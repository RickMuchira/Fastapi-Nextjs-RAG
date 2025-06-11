# main.py

import os
import re
import traceback
import pickle
import faiss
import fitz  # PyMuPDF
from datetime import datetime
from typing import List, Generator, AsyncGenerator, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from sentence_transformers import SentenceTransformer
from groq import Groq, AuthenticationError

import json
import asyncio

import schemas
import models
from database import SessionLocal, engine
from speller import SpellingCorrector  # Our custom speller module

# Import the document-splitting logic
from chunker import split_document

# -----------------------
# Database setup
# -----------------------
models.Base.metadata.create_all(bind=engine)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -----------------------
# FastAPI app + CORS
# -----------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Embedding model & storage dirs
# -----------------------
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
EMBED_DIM = embedding_model.get_sentence_embedding_dimension()

UPLOAD_DIR   = "shared_storage/uploaded_files"
VECTOR_ROOT  = "shared_storage/vector_stores"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VECTOR_ROOT, exist_ok=True)

# -----------------------
# Groq client (hardcoded API key)
# -----------------------
GROQ_API_KEY = "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"
groq_client  = Groq(api_key=GROQ_API_KEY)

# -----------------------
# Initialize our speller
# -----------------------
corrector = SpellingCorrector()

# -----------------------
# Utility: normalize question
# -----------------------
def normalize_question(q: str) -> str:
    """
    Lowercases, trims whitespace, and removes trailing punctuation.
    """
    q = q.lower().strip()
    q = re.sub(r"[?.!]+$", "", q)  # remove trailing ., ?, or !
    q = re.sub(r"\s+", " ", q)     # collapse multiple spaces
    return q

# -----------------------
# CRUD Endpoints (unchanged)
# -----------------------
@app.post("/courses/", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_c = models.Course(name=course.name)
    db.add(db_c)
    db.commit()
    db.refresh(db_c)
    return db_c

@app.get("/courses/", response_model=List[schemas.CourseOut])
def get_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()

@app.get("/courses/{course_id}", response_model=schemas.Course)
def get_course(course_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Course).get(course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    return c

@app.put("/courses/{course_id}", response_model=schemas.Course)
def update_course(course_id: int, course: schemas.CourseCreate, db: Session = Depends(get_db)):
    c = db.query(models.Course).get(course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    c.name = course.name
    db.commit()
    db.refresh(c)
    return c

@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Course).get(course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    db.delete(c)
    db.commit()
    return {"message": "Course deleted"}

@app.post("/courses/{course_id}/years/", response_model=schemas.Year)
def create_year(course_id: int, year: schemas.YearCreate, db: Session = Depends(get_db)):
    y = models.Year(name=year.name, course_id=course_id)
    db.add(y)
    db.commit()
    db.refresh(y)
    return y

@app.get("/courses/{course_id}/years/", response_model=List[schemas.Year])
def get_years(course_id: int, db: Session = Depends(get_db)):
    return db.query(models.Year).filter_by(course_id=course_id).all()

@app.put("/years/{year_id}", response_model=schemas.Year)
def update_year(year_id: int, year: schemas.YearCreate, db: Session = Depends(get_db)):
    y = db.query(models.Year).get(year_id)
    if not y:
        raise HTTPException(404, "Year not found")
    y.name = year.name
    db.commit()
    db.refresh(y)
    return y

@app.delete("/years/{year_id}")
def delete_year(year_id: int, db: Session = Depends(get_db)):
    y = db.query(models.Year).get(year_id)
    if not y:
        raise HTTPException(404, "Year not found")
    db.delete(y)
    db.commit()
    return {"message": "Year deleted"}

@app.post("/years/{year_id}/semesters/", response_model=schemas.Semester)
def create_semester(year_id: int, semester: schemas.SemesterCreate, db: Session = Depends(get_db)):
    s = models.Semester(name=semester.name, year_id=year_id)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@app.get("/years/{year_id}/semesters/", response_model=List[schemas.Semester])
def get_semesters(year_id: int, db: Session = Depends(get_db)):
    return db.query(models.Semester).filter_by(year_id=year_id).all()

@app.put("/semesters/{semester_id}", response_model=schemas.Semester)
def update_semester(semester_id: int, semester: schemas.SemesterCreate, db: Session = Depends(get_db)):
    s = db.query(models.Semester).get(semester_id)
    if not s:
        raise HTTPException(404, "Semester not found")
    s.name = semester.name
    db.commit()
    db.refresh(s)
    return s

@app.delete("/semesters/{semester_id}")
def delete_semester(semester_id: int, db: Session = Depends(get_db)):
    s = db.query(models.Semester).get(semester_id)
    if not s:
        raise HTTPException(404, "Semester not found")
    db.delete(s)
    db.commit()
    return {"message": "Semester deleted"}

@app.post("/semesters/{semester_id}/units/", response_model=schemas.Unit)
def create_unit(semester_id: int, unit: schemas.UnitCreate, db: Session = Depends(get_db)):
    u = models.Unit(name=unit.name, semester_id=semester_id)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

@app.get("/semesters/{semester_id}/units/", response_model=List[schemas.Unit])
def get_units(semester_id: int, db: Session = Depends(get_db)):
    return db.query(models.Unit).filter_by(semester_id=semester_id).all()

# -----------------------
# Document Upload & Management
# -----------------------
@app.post("/documents/")
def upload_document(
    unit_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ts       = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{ts}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    doc = models.Document(filename=file.filename, filepath=filepath, unit_id=unit_id)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"message": "Upload successful", "id": doc.id}

@app.get("/documents/", response_model=List[schemas.DocumentWithPath])
def list_documents(db: Session = Depends(get_db)):
    out = []
    for doc in db.query(models.Document).all():
        u = doc.unit; s = u.semester; y = s.year; c = y.course
        path = f"{c.name} → {y.name} → {s.name} → {u.name}"
        out.append(schemas.DocumentWithPath(
            id=doc.id, filename=doc.filename, filepath=doc.filepath, course_path=path
        ))
    return out

@app.get("/documents/download/{doc_id}")
def download_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return FileResponse(path=doc.filepath, filename=doc.filename, media_type="application/pdf")

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}

# -----------------------
# Process Document: Store heading, pages, source_file in metadata
# -----------------------
def process_document_stream(doc_id: int, db: Session) -> Generator[str, None, None]:
    """
    Streaming generator that
      1) Splits the PDF into chunks + metadata,
      2) Embeds each chunk, indexes/flattens into a FAISS index,
      3) Yields SSE lines so the front-end can show progress.
    """
    doc = db.query(models.Document).get(doc_id)
    if not doc:
        yield "data: Document not found\n\n"
        return

    yield f"data: Processing {doc.filename}...\n\n"
    try:
        chunks, metadata = split_document(
            doc.filepath,
            filename=doc.filename,
            max_words=500,
            overlap=100
        )
    except Exception as e:
        yield f"data: Failed during splitting: {e}\n\n"
        return

    yield f"data: Split into {len(chunks)} chunks.\n\n"

    if not chunks:
        yield "data: No chunks generated.\n\n"
        return

    # Embed + index each chunk
    embeddings = embedding_model.encode(chunks)
    unit_dir   = os.path.join(VECTOR_ROOT, f"unit_{doc.unit_id}")
    os.makedirs(unit_dir, exist_ok=True)

    idx_path = os.path.join(unit_dir, "index.faiss")
    map_path = os.path.join(unit_dir, "doc_id_map.pkl")

    if os.path.exists(idx_path):
        index = faiss.read_index(idx_path)
        with open(map_path, "rb") as f:
            doc_map = pickle.load(f)
    else:
        index  = faiss.IndexFlatL2(EMBED_DIM)
        doc_map = {}

    base = index.ntotal
    index.add(embeddings)
    for i, chunk_text in enumerate(chunks):
        doc_map[base + i] = {
            "doc_id":     doc.id,
            "text":       chunk_text,
            "heading":    metadata[i].get("heading"),
            "pages":      metadata[i].get("pages"),
            "source_file": metadata[i].get("source_file")
        }

    faiss.write_index(index, idx_path)
    with open(map_path, "wb") as f:
        pickle.dump(doc_map, f)

    yield "data: Processing complete!\n\n"

@app.get("/documents/{doc_id}/process")
def process_document(doc_id: int, db: Session = Depends(get_db)):
    return StreamingResponse(process_document_stream(doc_id, db), media_type="text/event-stream")

# -----------------------
# Return chunks + metadata (inspection)
# -----------------------
@app.get("/documents/{doc_id}/chunks", response_model=List[Dict[str, Any]])
def get_document_chunks(doc_id: int, db: Session = Depends(get_db)):
    """
    Return all chunks + metadata for a given document,
    so you can inspect headings/pages and verify chunking correctness.
    """
    doc = db.query(models.Document).get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    try:
        chunks, metadata = split_document(
            doc.filepath,
            filename=doc.filename,
            max_words=500,
            overlap=100
        )
    except Exception as e:
        raise HTTPException(500, f"Error splitting document: {e}")

    response = []
    for meta, chunk_text in zip(metadata, chunks):
        response.append({
            "chunk_index": meta["chunk_index"],
            "heading":     meta["heading"],
            "text":        chunk_text,
            "pages":       meta["pages"],
        })

    return response

@app.get("/units/{unit_id}/documents/", response_model=List[schemas.DocumentWithPath])
def get_unit_documents(unit_id: int = Path(...), db: Session = Depends(get_db)):
    docs = db.query(models.Document).filter(models.Document.unit_id == unit_id).all()
    out = []
    for doc in docs:
        u = doc.unit; s = u.semester; y = s.year; c = y.course
        path = f"{c.name} → {y.name} → {s.name} → {u.name}"
        out.append(schemas.DocumentWithPath(
            id=doc.id,
            filename=doc.filename,
            filepath=doc.filepath,
            course_path=path
        ))
    return out

# -----------------------
# ASK Endpoint (non-streaming)
# -----------------------
@app.post("/ask")
def ask_question(request: schemas.AskRequest, db: Session = Depends(get_db)):
    try:
        normalized_query = normalize_question(request.question)

        # Spell-correct
        corrected_query = corrector.correct_sentence(normalized_query)

        # Load FAISS index & doc_map for that unit
        unit_dir = os.path.join(VECTOR_ROOT, f"unit_{request.unit_id}")
        idx_path = os.path.join(unit_dir, "index.faiss")
        map_path = os.path.join(unit_dir, "doc_id_map.pkl")
        if not (os.path.exists(idx_path) and os.path.exists(map_path)):
            return {
                "answer": "No vector store found for this unit. Please upload & process documents first.",
                "citations": []
            }

        index = faiss.read_index(idx_path)
        with open(map_path, "rb") as f:
            doc_map = pickle.load(f)

        # Search for top-5 chunks
        question_embedding = embedding_model.encode([corrected_query])
        _, I = index.search(question_embedding, k=5)
        top_indices = [i for i in I[0] if i in doc_map]

        # Build context for the LLM prompt
        context = "\n".join(doc_map[i]["text"] for i in top_indices)
        prompt = f"""
You are a helpful tutor. Use the notes below to answer the student's question. Provide a clear, concise answer:

Notes:
{context}

Question: {request.question}
Answer:
"""

        completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful tutor."},
                {"role": "user",   "content": prompt}
            ]
        )
        answer = completion.choices[0].message.content.strip()

        # Build citations
        citations = [
            {
                "heading":   doc_map[i].get("heading"),
                "pages":     doc_map[i].get("pages"),
                "file":      doc_map[i].get("source_file"),
            }
            for i in top_indices
        ]

        # Remove exact duplicates while preserving order
        seen = set()
        unique_citations = []
        for c in citations:
            c_str = json.dumps(c, sort_keys=True)
            if c_str not in seen:
                seen.add(c_str)
                unique_citations.append(c)

        return {
            "answer": answer,
            "citations": unique_citations
        }

    except AuthenticationError:
        raise HTTPException(502, "Groq authentication failed—check your API key")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

# -----------------------
# ASK Streaming Endpoint
# -----------------------
@app.post("/ask/stream")
async def ask_question_stream(request: schemas.AskRequest, db: Session = Depends(get_db)):
    async def generate_streaming_response() -> AsyncGenerator[str, None]:
        try:
            normalized_query = normalize_question(request.question)
            corrected_query = corrector.correct_sentence(normalized_query)

            # Load FAISS index & doc_map
            unit_dir = os.path.join(VECTOR_ROOT, f"unit_{request.unit_id}")
            idx_path = os.path.join(unit_dir, "index.faiss")
            map_path = os.path.join(unit_dir, "doc_id_map.pkl")
            if not (os.path.exists(idx_path) and os.path.exists(map_path)):
                msg = "No vector store found for this unit. Please upload & process documents first."
                for i, word in enumerate(msg.split()):
                    token = word if i == 0 else f" {word}"
                    data = json.dumps({"token": token})
                    yield f"data: {data}\n\n"
                    await asyncio.sleep(0.03)
                # Send empty citations array, then [DONE]
                yield f"data: {json.dumps({'citations': []})}\n\n"
                yield "data: [DONE]\n\n"
                return

            index = faiss.read_index(idx_path)
            with open(map_path, "rb") as f:
                doc_map = pickle.load(f)

            # Search top-5 chunks
            question_embedding = embedding_model.encode([corrected_query])
            _, I = index.search(question_embedding, k=5)
            top_indices = [i for i in I[0] if i in doc_map]

            # Build prompt context
            context = "\n".join(doc_map[i]["text"] for i in top_indices)
            prompt = f"""
You are a helpful tutor. Use the notes below to answer the student's question. Provide a clear, concise answer:

Notes:
{context}

Question: {request.question}
Answer:
"""

            # Stream from Groq
            stream = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": "You are a helpful tutor."},
                    {"role": "user",   "content": prompt}
                ],
                stream=True,
                temperature=0.7,
                max_tokens=1000,
            )

            # Emit tokens as SSE
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    data = json.dumps({"token": token})
                    yield f"data: {data}\n\n"
                    await asyncio.sleep(0.01)

            # Build citations
            citations = [
                {
                    "heading":   doc_map[i].get("heading"),
                    "pages":     doc_map[i].get("pages"),
                    "file":      doc_map[i].get("source_file"),
                }
                for i in top_indices
            ]

            # Remove exact duplicates while preserving order
            seen = set()
            unique_citations = []
            for c in citations:
                c_str = json.dumps(c, sort_keys=True)
                if c_str not in seen:
                    seen.add(c_str)
                    unique_citations.append(c)

            # At end, send the unique citations array
            yield f"data: {json.dumps({'citations': unique_citations})}\n\n"
            yield "data: [DONE]\n\n"

        except AuthenticationError:
            err = "Groq authentication failed—check your API key"
            for i, word in enumerate(err.split()):
                token = word if i == 0 else f" {word}"
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"
                await asyncio.sleep(0.03)
            # End with no citations
            yield f"data: {json.dumps({'citations': []})}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            err = str(e)
            for i, word in enumerate(err.split()):
                token = word if i == 0 else f" {word}"
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"
                await asyncio.sleep(0.03)
            yield f"data: {json.dumps({'citations': []})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_streaming_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    )

# -----------------------
# (Optional) ask/stream-simulated if you still want it
# -----------------------
@app.post("/ask/stream-simulated")
async def ask_question_stream_simulated(request: schemas.AskRequest, db: Session = Depends(get_db)):
    async def simulate_streaming_response() -> AsyncGenerator[str, None]:
        try:
            unit_dir = os.path.join(VECTOR_ROOT, f"unit_{request.unit_id}")
            idx_path = os.path.join(unit_dir, "index.faiss")
            map_path = os.path.join(unit_dir, "doc_id_map.pkl")
            if not (os.path.exists(idx_path) and os.path.exists(map_path)):
                msg = "No vector store found for this unit. Please upload & process documents first."
                for i, word in enumerate(msg.split()):
                    token = word if i == 0 else f" {word}"
                    data = json.dumps({"token": token})
                    yield f"data: {data}\n\n"
                    await asyncio.sleep(0.03)
                yield "data: [DONE]\n\n"
                return

            index = faiss.read_index(idx_path)
            with open(map_path, "rb") as f:
                doc_map = pickle.load(f)

            original_query  = request.question
            corrected_query = corrector.correct_sentence(original_query)

            question_embedding = embedding_model.encode([corrected_query])
            _, I = index.search(question_embedding, k=5)
            chunks = [doc_map[i]["text"] for i in I[0] if i in doc_map]

            context = "\n".join(f"- {c}" for c in chunks)
            prompt = f"""
You are a helpful tutor. Based on the notes below, answer the student's question.

Notes:
{context}

Question: {original_query}
Answer:
"""

            completion = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": "You are a helpful tutor."},
                    {"role": "user",   "content": prompt}
                ]
            )
            full_answer = completion.choices[0].message.content.strip()
            words = full_answer.split()

            for i, word in enumerate(words):
                token = word if i == 0 else f" {word}"
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"
                await asyncio.sleep(0.05)

            yield "data: [DONE]\n\n"

        except AuthenticationError:
            err = "Groq authentication failed—check your API key"
            for i, word in enumerate(err.split()):
                token = word if i == 0 else f" {word}"
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"
                await asyncio.sleep(0.03)
            yield "data: [DONE]\n\n"

        except Exception as e:
            err = str(e)
            for i, word in enumerate(err.split()):
                token = word if i == 0 else f" {word}"
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"
                await asyncio.sleep(0.03)
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        simulate_streaming_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    )

# -----------------------
# Course Tree endpoint (unchanged)
# -----------------------
@app.get("/tree/", response_model=List[schemas.Course])
def get_course_tree(db: Session = Depends(get_db)):
    return db.query(models.Course).all()