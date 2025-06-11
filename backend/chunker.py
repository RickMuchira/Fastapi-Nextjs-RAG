import fitz  # PyMuPDF
import pdfplumber
from typing import List, Tuple, Dict, Optional
import logging
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChunkMetadata(Dict):
    chunk_index: int
    heading: str
    source_file: str
    pages: List[str]

def detect_headings_by_fontsize(
    page: fitz.Page,
    min_font_size: float = 12.0,  # Lowered for proposals
    max_words: int = 20  # Increased for longer headings in legal docs
) -> List[Tuple[str, Tuple[float, float, float, float], float]]:
    """Detect headings based on font size and layout."""
    headings = []
    try:
        page_dict = page.get_text("dict")
        blocks = page_dict.get("blocks", [])
        for block in blocks:
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        size = span.get("size", 0)
                        text = span.get("text", "").strip()
                        if (
                            text
                            and size >= min_font_size
                            and not text.islower()
                            and len(text.split()) < max_words
                            and not text.startswith(("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"))  # Avoid numbered lists
                        ):
                            headings.append((text, span.get("bbox", (0, 0, 0, 0)), size))
    except Exception as e:
        logger.error(f"Error detecting headings on page {page.number}: {e}")
    seen = set()
    return [
        (h[0], h[1], h[2])
        for h in sorted(headings, key=lambda x: x[1][1])
        if h[0] not in seen and not seen.add(h[0])
    ]

def extract_tables_from_pdf(pdf_path: str) -> Dict[int, List[str]]:
    """Extract tables from PDF using pdfplumber."""
    tables = {}
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                page_tables = []
                # Use explicit table settings for better detection
                extracted_tables = page.extract_tables({
                    "vertical_strategy": "lines",
                    "horizontal_strategy": "lines",
                    "keep_blank_chars": True
                })
                for table in extracted_tables:
                    markdown_table = table_to_markdown(table)
                    if markdown_table:
                        page_tables.append(markdown_table)
                tables[page_num] = page_tables
    except Exception as e:
        logger.error(f"Error extracting tables from PDF {pdf_path}: {e}")
        return {}
    return tables

def table_to_markdown(table: List[List]) -> str:
    """Convert table data to Markdown format."""
    if not table or not isinstance(table, list) or not isinstance(table[0], list) or not table[0]:
        return ""
    col_count = len(table[0])
    table = [[("" if cell is None else str(cell).strip()) for cell in row] for row in table if len(row) == col_count]
    if not table:
        return ""
    header = "| " + " | ".join(table[0]) + " |"
    sep = "| " + " | ".join("---" for _ in table[0]) + " |"
    body = "\n".join("| " + " | ".join(row) + " |" for row in table[1:])
    return f"{header}\n{sep}\n{body}"

def extract_page_text_with_words(
    page: fitz.Page, clip: Optional[Tuple[float, float, float, float]] = None
) -> Tuple[str, List[Tuple[str, int]]]:
    """Extract text and word-to-page mapping from a page with optional clipping."""
    try:
        text = page.get_text("text", clip=clip).strip()
        words_data = page.get_text("words", clip=clip)  # Returns (x0, y0, x1, y1, word, block_no, line_no, word_no)
        word_page_map = [(word[4], page.number) for word in words_data]
        return text, word_page_map
    except Exception as e:
        logger.error(f"Error extracting text from page {page.number}: {e}")
        return "", []

def chunk_section(
    section_text: str,
    heading: str,
    word_page_map: List[Tuple[str, int]],
    real_labels: List[str],
    filename: str,
    max_words: int,
    overlap: int,
    chunk_index: int
) -> Tuple[List[str], List[ChunkMetadata], int]:
    """Chunk a section of text with precise page metadata."""
    chunks, metadata = [], []
    words = section_text.split()
    total_words = len(words)

    if not word_page_map:
        # Fallback to approximation if no word-page mapping
        words_per_page = max(1, total_words // max(1, len(real_labels)))
        start_word = 0
        while start_word < total_words:
            end_word = min(start_word + max_words, total_words)
            sub_words = words[start_word:end_word]
            if not sub_words:
                break
            sub_text = " ".join(sub_words)
            chunk_text = f"== {heading} ==\n{sub_text}"
            approx_start = min(start_word // words_per_page, len(real_labels) - 1)
            approx_end = min((end_word - 1) // words_per_page, len(real_labels) - 1)
            sub_pages = real_labels[approx_start:approx_end + 1]
            chunks.append(chunk_text)
            metadata.append({
                "chunk_index": chunk_index,
                "heading": heading or "No heading detected",
                "source_file": filename,
                "pages": sub_pages
            })
            chunk_index += 1
            start_word += max_words - overlap
        return chunks, metadata, chunk_index

    # Use word-page mapping for precise page assignment
    start_word = 0
    word_idx = 0
    while start_word < total_words:
        end_word = min(start_word + max_words, total_words)
        sub_words = words[start_word:end_word]
        if not sub_words:
            break
        sub_text = " ".join(sub_words)
        chunk_text = f"== {heading} ==\n{sub_text}"

        # Find pages for this chunk
        page_counts = defaultdict(int)
        word_count = 0
        for word, page_num in word_page_map:
            if word_idx <= word_count < word_idx + (end_word - start_word):
                page_counts[page_num] += 1
            word_count += 1
        # Assign the page with the most words, or fall back to range
        if page_counts:
            most_common_page = max(page_counts, key=page_counts.get)
            sub_pages = [real_labels[most_common_page] if most_common_page < len(real_labels) else str(most_common_page + 1)]
            # Include multiple pages only for large chunks
            if end_word - start_word > max_words // 2 and len(page_counts) > 1:
                sub_pages = [
                    real_labels[p] if p < len(real_labels) else str(p + 1)
                    for p in sorted(page_counts.keys())
                ]
        else:
            sub_pages = real_labels[:]

        chunks.append(chunk_text)
        metadata.append({
            "chunk_index": chunk_index,
            "heading": heading or "No heading detected",
            "source_file": filename,
            "pages": sub_pages
        })
        chunk_index += 1
        start_word += max_words - overlap
        word_idx += max_words - overlap
    return chunks, metadata, chunk_index

def split_document(
    pdf_path: str,
    *,
    filename: str = None,
    max_words: int = 300,  # Reduced for precise citations
    overlap: int = 50     # Reduced to minimize redundancy
) -> Tuple[List[str], List[ChunkMetadata]]:
    """Split PDF into chunks with headings, tables, and precise page metadata."""
    if not pdf_path.endswith(".pdf"):
        raise ValueError("Invalid PDF path")
    if max_words <= 0 or overlap < 0 or overlap >= max_words:
        raise ValueError("Invalid max_words or overlap values")

    chunks, metadata = [], []
    chunk_index = 0
    filename = filename or pdf_path

    try:
        with fitz.open(pdf_path) as doc:
            try:
                toc = doc.get_toc()
                use_outline = toc and len(toc) > 1
            except Exception as e:
                logger.error(f"Error reading TOC: {e}")
                use_outline = False

            tables_by_page = extract_tables_from_pdf(pdf_path)

            if use_outline:
                try:
                    labels = doc.get_page_labels()
                except Exception:
                    labels = [str(i + 1) for i in range(doc.page_count)]
                outline_sections = []
                for idx, (level, title, pg) in enumerate(toc):
                    if level in (1, 2):
                        start = max(0, min(doc.page_count - 1, pg - 1))
                        end = min(doc.page_count - 1, toc[idx + 1][2] - 2 if idx + 1 < len(toc) else doc.page_count - 1)
                        if start <= end:
                            outline_sections.append((title, start, end))
                for heading, start_pg, end_pg in outline_sections:
                    real_labels, pages_text, word_page_map = [], [], []
                    for p in range(start_pg, end_pg + 1):
                        if p >= doc.page_count:
                            continue
                        real_labels.append(labels[p] if p < len(labels) else str(p + 1))
                        page = doc.load_page(p)
                        for tbl in tables_by_page.get(p, []):
                            chunks.append(f"== {heading} ==\n{tbl}")
                            metadata.append({
                                "chunk_index": chunk_index,
                                "heading": heading,
                                "source_file": filename,
                                "pages": [real_labels[-1]]  # Exact page for table
                            })
                            chunk_index += 1
                        text, page_words = extract_page_text_with_words(page)
                        if text:  # Skip empty pages
                            pages_text.append(text)
                            word_page_map.extend(page_words)
                    section_text = "\n".join(p for p in pages_text if p).strip()
                    if section_text:
                        section_chunks, section_metadata, chunk_index = chunk_section(
                            section_text, heading, word_page_map, real_labels, filename, max_words, overlap, chunk_index
                        )
                        chunks.extend(section_chunks)
                        metadata.extend(section_metadata)
            else:
                try:
                    labels = doc.get_page_labels()
                except Exception:
                    labels = [str(i + 1) for i in range(doc.page_count)]
                for pno in range(doc.page_count):
                    page = doc.load_page(pno)
                    real_label = labels[pno] if pno < len(labels) else str(pno + 1)
                    headings = detect_headings_by_fontsize(page)
                    page_text, word_page_map = extract_page_text_with_words(page)
                    for tbl in tables_by_page.get(pno, []):
                        chunks.append(f"== No heading ==\n{tbl}")
                        metadata.append({
                            "chunk_index": chunk_index,
                            "heading": "No heading detected",
                            "source_file": filename,
                            "pages": [real_label]  # Exact page for table
                        })
                        chunk_index += 1
                    if page_text:  # Skip empty pages
                        if headings:
                            for text, _, _ in headings:
                                section_chunks, section_metadata, chunk_index = chunk_section(
                                    page_text, text, word_page_map, [real_label], filename, max_words, overlap, chunk_index
                                )
                                chunks.extend(section_chunks)
                                metadata.extend(section_metadata)
                        else:
                            section_chunks, section_metadata, chunk_index = chunk_section(
                                page_text, "No heading detected", word_page_map, [real_label], filename, max_words, overlap, chunk_index
                            )
                            chunks.extend(section_chunks)
                            metadata.extend(section_metadata)

        assert len(chunks) == len(metadata), f"Mismatch: {len(chunks)} chunks vs {len(metadata)} metadata"
        return chunks, metadata
    except Exception as e:
        logger.error(f"Failed to process PDF {pdf_path}: {e}")
        raise