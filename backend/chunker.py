# chunker.py

import fitz  # PyMuPDF
import re
from typing import List, Tuple, Dict


def split_by_pdf_outline(
    pdf_path: str,
    *,
    filename: str = None,
    max_words: int = 500,
    overlap: int = 100
) -> Tuple[List[str], List[Dict]]:
    """
    Use the PDF's built-in outline (bookmarks) to define chunks.
    Each outline entry at level 1 or 2 becomes a “heading.” Text from the heading’s start page
    up to just before the next heading is treated as one section. If that section’s word count
    exceeds max_words, it is further broken into overlapping sub-chunks of max_words words.

    Returns:
      - final_chunks: List of chunk strings
      - metadata_list: List of dicts {chunk_index, heading, source_file}
    """
    doc = fitz.open(pdf_path)
    toc = doc.get_toc()  # Each entry: [level, title, page_number]

    # 1) Build (title, start_page, end_page) list for levels 1 & 2
    sections: List[Tuple[str, int, int]] = []
    for idx, (level, title, pg) in enumerate(toc):
        if level in (1, 2):
            start = pg - 1  # convert 1-based to 0-based page index
            if idx + 1 < len(toc):
                _, _, next_pg = toc[idx + 1]
                end = next_pg - 1
            else:
                end = doc.page_count - 1
            sections.append((title, start, end))

    final_chunks: List[str] = []
    metadata_list: List[Dict] = []
    chunk_index = 0

    # 2) For each section, extract text from the page range
    for heading, start_pg, end_pg in sections:
        pages_text: List[str] = []
        for pno in range(start_pg, end_pg + 1):
            page = doc.load_page(pno)
            pages_text.append(page.get_text())
        section_text = "\n".join(pages_text).strip()
        if not section_text:
            continue

        words = section_text.split()
        total_words = len(words)

        # 3a) If small enough, keep whole section
        if total_words <= max_words:
            final_chunks.append(section_text)
            metadata_list.append({
                "chunk_index": chunk_index,
                "heading": heading,
                "source_file": filename,
            })
            chunk_index += 1

        else:
            # 3b) Otherwise, break into overlapping sub-chunks
            start_word = 0
            while start_word < total_words:
                end_word = min(start_word + max_words, total_words)
                sub_words = words[start_word:end_word]
                sub_text = " ".join(sub_words)

                final_chunks.append(sub_text)
                metadata_list.append({
                    "chunk_index": chunk_index,
                    "heading": heading,
                    "source_file": filename,
                })
                chunk_index += 1

                start_word += max_words - overlap

    doc.close()
    return final_chunks, metadata_list


def split_into_semantic_chunks(
    raw_text: str,
    *,
    filename: str = None,
    chunk_size: int = 400,
    chunk_overlap: int = 50
) -> Tuple[List[str], List[Dict]]:
    """
    Regex-based fallback splitter: detects lines matching “Article X”, “Section X.Y”, “Chapter I”, etc.
    Groups lines under their nearest heading. For each group:
      - If word count ≤ chunk_size: keep as one chunk
      - Else: break into overlapping sub-chunks of chunk_size words (with chunk_overlap).
    """
    heading_patterns = [
        re.compile(r"^Article\s+\d+", flags=re.IGNORECASE),
        re.compile(r"^Section\s+\d+(\.\d+)*", flags=re.IGNORECASE),
        re.compile(r"^Chapter\s+[IVX]+", flags=re.IGNORECASE),
        # Add more patterns if needed
    ]

    lines = raw_text.splitlines()
    preliminary_segments: List[Tuple[str, List[str]]] = []
    current_heading = None
    current_lines: List[str] = []

    for line in lines:
        stripped = line.strip()
        if any(pat.match(stripped) for pat in heading_patterns):
            if current_lines:
                preliminary_segments.append((current_heading, current_lines))
            current_heading = stripped
            current_lines = [stripped]
        else:
            current_lines.append(line)
    if current_lines:
        preliminary_segments.append((current_heading, current_lines))

    final_chunks: List[str] = []
    metadata_list: List[Dict] = []
    chunk_index = 0

    for heading, segment_lines in preliminary_segments:
        segment_text = "\n".join(segment_lines).strip()
        if not segment_text:
            continue

        words = segment_text.split()
        total_words = len(words)

        if total_words <= chunk_size:
            final_chunks.append(segment_text)
            metadata_list.append({
                "chunk_index": chunk_index,
                "heading": heading or "No heading detected",
                "source_file": filename,
            })
            chunk_index += 1

        else:
            start = 0
            while start < total_words:
                end = min(start + chunk_size, total_words)
                sub_words = words[start:end]
                subchunk_text = " ".join(sub_words)

                final_chunks.append(subchunk_text)
                metadata_list.append({
                    "chunk_index": chunk_index,
                    "heading": heading or "No heading detected",
                    "source_file": filename,
                })
                chunk_index += 1

                start += chunk_size - chunk_overlap

    return final_chunks, metadata_list


def split_document(
    pdf_path: str,
    *,
    filename: str = None,
    max_words: int = 500,
    overlap: int = 100,
    fallback_chunk_size: int = 400,
    fallback_overlap: int = 50
) -> Tuple[List[str], List[Dict]]:
    """
    1) Attempt to split by PDF outline (bookmarks).
    2) If outline is empty (or yields no chunks), extract all text and fallback to regex splitting.
    """
    try:
        # Try outline-based first
        chunks, metadata = split_by_pdf_outline(
            pdf_path,
            filename=filename,
            max_words=max_words,
            overlap=overlap
        )
        # If it returned at least one chunk, use it
        if chunks:
            return chunks, metadata

    except Exception:
        # Any error (e.g., cannot open PDF) → fallback
        pass

    # Fallback: extract raw text and regex-split
    doc = fitz.open(pdf_path)
    text_pieces = [page.get_text() for page in doc]
    doc.close()
    raw_text = "\n".join(text_pieces)
    return split_into_semantic_chunks(
        raw_text,
        filename=filename,
        chunk_size=fallback_chunk_size,
        chunk_overlap=fallback_overlap
    )
