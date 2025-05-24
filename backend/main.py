# main.py

from dotenv import load_dotenv
load_dotenv()  # still loads other env vars if needed

import os
import traceback
import pickle
import faiss
import fitz  # PyMuPDF
from datetime import datetime
from typing import List, Generator

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from groq import Groq, AuthenticationError

import schemas
import models
from database import SessionLocal, engine

# === Database setup ===
models.Base.metadata.create_all(bind=engine)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === FastAPI app + CORS ===
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Embedding model & storage dirs ===
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
EMBED_DIM = embedding_model.get_sentence_embedding_dimension()

UPLOAD_DIR = "shared_storage/uploaded_files"
VECTOR_ROOT = "shared_storage/vector_stores"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VECTOR_ROOT, exist_ok=True)

# === Groq client (hard-coded key for testing) ===
# ⚠️ Only do this in local dev – remove before sharing or deploying!
GROQ_API_KEY = "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"
groq_client = Groq(api_key=GROQ_API_KEY)

# === COURSE CRUD ===
@app.post("/courses/", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_c = models.Course(name=course.name)
    db.add(db_c); db.commit(); db.refresh(db_c)
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
    db.commit(); db.refresh(c)
    return c

@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Course).get(course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    db.delete(c); db.commit()
    return {"message": "Course deleted"}

# === YEAR CRUD ===
@app.post("/courses/{course_id}/years/", response_model=schemas.Year)
def create_year(course_id: int, year: schemas.YearCreate, db: Session = Depends(get_db)):
    y = models.Year(name=year.name, course_id=course_id)
    db.add(y); db.commit(); db.refresh(y)
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
    db.commit(); db.refresh(y)
    return y

@app.delete("/years/{year_id}")
def delete_year(year_id: int, db: Session = Depends(get_db)):
    y = db.query(models.Year).get(year_id)
    if not y:
        raise HTTPException(404, "Year not found")
    db.delete(y); db.commit()
    return {"message": "Year deleted"}

# === SEMESTER CRUD ===
@app.post("/years/{year_id}/semesters/", response_model=schemas.Semester)
def create_semester(year_id: int, semester: schemas.SemesterCreate, db: Session = Depends(get_db)):
    s = models.Semester(name=semester.name, year_id=year_id)
    db.add(s); db.commit(); db.refresh(s)
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
    db.commit(); db.refresh(s)
    return s

@app.delete("/semesters/{semester_id}")
def delete_semester(semester_id: int, db: Session = Depends(get_db)):
    s = db.query(models.Semester).get(semester_id)
    if not s:
        raise HTTPException(404, "Semester not found")
    db.delete(s); db.commit()
    return {"message": "Semester deleted"}

# === UNIT CRUD ===
@app.post("/semesters/{semester_id}/units/", response_model=schemas.Unit)
def create_unit(semester_id: int, unit: schemas.UnitCreate, db: Session = Depends(get_db)):
    u = models.Unit(name=unit.name, semester_id=semester_id)
    db.add(u); db.commit(); db.refresh(u)
    return u

@app.get("/semesters/{semester_id}/units/", response_model=List[schemas.Unit])
def get_units(semester_id: int, db: Session = Depends(get_db)):
    return db.query(models.Unit).filter_by(semester_id=semester_id).all()

# === DOCUMENT UPLOAD & MANAGEMENT ===
@app.post("/documents/")
def upload_document(
    unit_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{ts}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    doc = models.Document(filename=file.filename, filepath=filepath, unit_id=unit_id)
    db.add(doc); db.commit(); db.refresh(doc)
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
    db.delete(doc); db.commit()
    return {"message": "Document deleted"}

# === DOCUMENT PROCESSING (SSE) ===
def process_document_stream(doc_id: int, db: Session) -> Generator[str, None, None]:
    doc = db.query(models.Document).get(doc_id)
    if not doc:
        yield "data: Document not found\n\n"; return

    yield f"data: Processing {doc.filename}...\n\n"
    try:
        with fitz.open(doc.filepath) as pdf:
            text = "".join(page.get_text() for page in pdf)
    except Exception as e:
        yield f"data: Failed to read PDF: {e}\n\n"; return

    if not text.strip():
        yield "data: Document has no text.\n\n"; return

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    chunks = splitter.split_text(text)
    yield f"data: Split into {len(chunks)} chunks.\n\n"

    embeddings = embedding_model.encode(chunks)
    unit_dir = os.path.join(VECTOR_ROOT, f"unit_{doc.unit_id}")
    os.makedirs(unit_dir, exist_ok=True)

    idx_path = os.path.join(unit_dir, "index.faiss")
    map_path = os.path.join(unit_dir, "doc_id_map.pkl")
    if os.path.exists(idx_path):
        index = faiss.read_index(idx_path)
        with open(map_path, "rb") as f:
            doc_map = pickle.load(f)
    else:
        index = faiss.IndexFlatL2(EMBED_DIM)
        doc_map = {}

    base = index.ntotal
    index.add(embeddings)
    for i, chunk in enumerate(chunks):
        doc_map[base + i] = {"doc_id": doc.id, "text": chunk}

    faiss.write_index(index, idx_path)
    with open(map_path, "wb") as f:
        pickle.dump(doc_map, f)

    yield "data: Processing complete!\n\n"

@app.get("/documents/{doc_id}/process")
def process_document(doc_id: int, db: Session = Depends(get_db)):
    return StreamingResponse(process_document_stream(doc_id, db), media_type="text/event-stream")

# === ASK ENDPOINT ===
@app.post("/ask")
def ask_question(request: schemas.AskRequest, db: Session = Depends(get_db)):
    try:
        unit_dir = os.path.join(VECTOR_ROOT, f"unit_{request.unit_id}")
        idx_path = os.path.join(unit_dir, "index.faiss")
        map_path = os.path.join(unit_dir, "doc_id_map.pkl")
        if not (os.path.exists(idx_path) and os.path.exists(map_path)):
            raise HTTPException(404, "Vector store not found for this unit")

        index = faiss.read_index(idx_path)
        with open(map_path, "rb") as f:
            doc_map = pickle.load(f)

        question_embedding = embedding_model.encode([request.question])
        _, I = index.search(question_embedding, k=5)
        chunks = [doc_map[i]["text"] for i in I[0] if i in doc_map]

        context = "\n".join(f"- {c}" for c in chunks)
        prompt = f"""
You are a helpful tutor. Based on the notes below, answer the student's question.

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
        return {"answer": answer}

    except AuthenticationError:
        raise HTTPException(502, "Groq authentication failed—check your API key")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

# === COURSE TREE FOR FRONTEND ===
@app.get("/tree/", response_model=List[schemas.Course])
def get_course_tree(db: Session = Depends(get_db)):
    return db.query(models.Course).all()
