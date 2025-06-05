import fitz  # PyMuPDF
import pdfplumber
from typing import List, Tuple, Dict

def extract_tables_from_pdf(pdf_path):
    tables = {}
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            page_tables = page.extract_tables()
            # Ensure that each table has at least one row and one column
            valid_tables = []
            for tbl in page_tables:
                if tbl and isinstance(tbl, list) and all(isinstance(row, list) for row in tbl):
                    if len(tbl) > 0 and len(tbl[0]) > 0:
                        valid_tables.append(table_to_markdown(tbl))
            tables[i] = valid_tables
    return tables

def table_to_markdown(table):
    if not table or not isinstance(table, list) or not isinstance(table[0], list):
        return ""
    table = [[("" if cell is None else str(cell).strip()) for cell in row] for row in table]
    header = "| " + " | ".join(table[0]) + " |"
    sep = "| " + " | ".join("---" for _ in table[0]) + " |"
    body = "\n".join("| " + " | ".join(row) + " |" for row in table[1:] if len(row) == len(table[0]))
    return f"{header}\n{sep}\n{body}"

def detect_headings_by_fontsize(page):
    headings = []
    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if block.get("type") == 0:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    size = span.get("size", 0)
                    text = span.get("text", "").strip()
                    if text and size >= 14 and not text.islower() and len(text.split()) < 16:
                        headings.append((text, span.get("bbox", (0, 0, 0, 0)), size))
    seen = set()
    result = []
    for h in headings:
        if h[0] not in seen:
            result.append(h)
            seen.add(h[0])
    return result

def split_document(
    pdf_path: str,
    *,
    filename: str = None,
    max_words: int = 500,
    overlap: int = 100,
    fallback_chunk_size: int = 400,
    fallback_overlap: int = 50
) -> Tuple[List[str], List[Dict]]:
    doc = fitz.open(pdf_path)
    toc = doc.get_toc()
    use_outline = toc and len(toc) > 1
    tables_by_page = extract_tables_from_pdf(pdf_path)
    chunks = []
    metadata = []
    chunk_index = 0

    def add_chunk(text, heading, source_file, pages):
        nonlocal chunk_index
        if not text.strip():
            return
        chunks.append(text)
        metadata.append({
            "chunk_index": chunk_index,
            "heading": heading or "No heading detected",
            "source_file": source_file,
            "pages": pages,
        })
        chunk_index += 1

    if use_outline:
        try:
            labels = doc.get_page_labels()
        except Exception:
            labels = None
        outline_sections = []
        page_count = doc.page_count
        for idx, (level, title, pg) in enumerate(toc):
            if level in (1, 2):
                start = max(0, min(page_count - 1, pg - 1))
                if idx + 1 < len(toc):
                    _, _, next_pg = toc[idx + 1]
                    end = max(0, min(page_count - 1, next_pg - 2))
                else:
                    end = page_count - 1
                if start > end:
                    continue
                outline_sections.append((title, start, end))
        for heading, start_pg, end_pg in outline_sections:
            section_pages = range(start_pg, end_pg + 1)
            real_labels = []
            pages_text = []
            for p in section_pages:
                if p < 0 or p >= doc.page_count:
                    continue
                if labels and p < len(labels) and labels[p] is not None:
                    real_labels.append(labels[p])
                else:
                    real_labels.append(str(p + 1))
                tables = tables_by_page.get(p, [])
                for tbl in tables:
                    add_chunk(f"== {heading} ==\n{tbl}", heading, filename, [real_labels[-1]])
                page_text = doc.load_page(p).get_text()
                if page_text.strip():
                    pages_text.append(page_text)
            section_text = "\n".join(pages_text).strip()
            if not section_text:
                continue
            words = section_text.split()
            total_words = len(words)
            if total_words <= max_words:
                chunk_text = f"== {heading} ==\n{section_text}"
                add_chunk(chunk_text, heading, filename, real_labels)
            else:
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
                    add_chunk(chunk_text, heading, filename, sub_pages)
                    start_word += max_words - overlap
    else:
        all_headings = []
        for pno in range(doc.page_count):
            page = doc.load_page(pno)
            for text, bbox, size in detect_headings_by_fontsize(page):
                all_headings.append((text, pno, bbox[1]))
        all_headings.sort(key=lambda tup: (tup[1], tup[2]))
        heading_spans = []
        for idx, (h, p, y) in enumerate(all_headings):
            start_p, start_y = p, y
            if idx + 1 < len(all_headings):
                next_p, next_y = all_headings[idx + 1][1], all_headings[idx + 1][2]
                heading_spans.append((h, start_p, start_y, next_p, next_y))
            else:
                heading_spans.append((h, start_p, start_y, doc.page_count - 1, None))
        for i, (heading, start_p, start_y, end_p, end_y) in enumerate(heading_spans):
            section_text = ""
            real_labels = []
            for p in range(start_p, end_p + 1):
                if p < 0 or p >= doc.page_count:
                    continue
                real_labels.append(str(p + 1))
                page = doc.load_page(p)
                if p == start_p and start_y is not None:
                    text = page.get_text("text", clip=(0, start_y, page.rect.width, page.rect.height))
                elif p == end_p and end_y is not None:
                    text = page.get_text("text", clip=(0, 0, page.rect.width, end_y))
                else:
                    text = page.get_text()
                section_text += text + "\n"
                tables = tables_by_page.get(p, [])
                for tbl in tables:
                    add_chunk(f"== {heading} ==\n{tbl}", heading, filename, [str(p + 1)])
            section_text = section_text.strip()
            if not section_text:
                continue
            words = section_text.split()
            total_words = len(words)
            if total_words <= max_words:
                chunk_text = f"== {heading} ==\n{section_text}"
                add_chunk(chunk_text, heading, filename, real_labels)
            else:
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
                    add_chunk(chunk_text, heading, filename, sub_pages)
                    start_word += max_words - overlap

    doc.close()
    assert len(chunks) == len(metadata), (
        f"Mismatch: {len(chunks)} chunks vs {len(metadata)} metadata"
    )
    return chunks, metadata
