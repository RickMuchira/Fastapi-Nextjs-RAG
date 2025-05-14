from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Generator
from datetime import datetime
import os
import fitz  # PyMuPDF
import pickle
import faiss
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from groq import Groq
import schemas
import models
from database import SessionLocal, engine

# === Create DB tables ===
models.Base.metadata.create_all(bind=engine)

# === App setup ===
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === DB Dependency ===
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === Embedding model ===
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
embedding_dim = 384

# === Storage folders ===
UPLOAD_DIR = "shared_storage/uploaded_files"
VECTOR_ROOT = "shared_storage/vector_stores"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VECTOR_ROOT, exist_ok=True)

# === Groq client ===
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# === COURSE CRUD ===
@app.post("/courses/", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_course = models.Course(name=course.name)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@app.get("/courses/", response_model=List[schemas.CourseOut])
def get_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()

@app.get("/courses/{course_id}", response_model=schemas.Course)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@app.put("/courses/{course_id}", response_model=schemas.Course)
def update_course(course_id: int, course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    db_course.name = course.name
    db.commit()
    db.refresh(db_course)
    return db_course

@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(db_course)
    db.commit()
    return {"message": "Course deleted"}

# === YEAR CRUD ===
@app.post("/courses/{course_id}/years/", response_model=schemas.Year)
def create_year(course_id: int, year: schemas.YearCreate, db: Session = Depends(get_db)):
    db_year = models.Year(name=year.name, course_id=course_id)
    db.add(db_year)
    db.commit()
    db.refresh(db_year)
    return db_year

@app.get("/courses/{course_id}/years/", response_model=List[schemas.Year])
def get_years(course_id: int, db: Session = Depends(get_db)):
    return db.query(models.Year).filter(models.Year.course_id == course_id).all()

@app.put("/years/{year_id}", response_model=schemas.Year)
def update_year(year_id: int, year: schemas.YearCreate, db: Session = Depends(get_db)):
    db_year = db.query(models.Year).filter(models.Year.id == year_id).first()
    if not db_year:
        raise HTTPException(status_code=404, detail="Year not found")
    db_year.name = year.name
    db.commit()
    db.refresh(db_year)
    return db_year

@app.delete("/years/{year_id}")
def delete_year(year_id: int, db: Session = Depends(get_db)):
    db_year = db.query(models.Year).filter(models.Year.id == year_id).first()
    if not db_year:
        raise HTTPException(status_code=404, detail="Year not found")
    db.delete(db_year)
    db.commit()
    return {"message": "Year deleted"}

# === SEMESTER CRUD ===
@app.post("/years/{year_id}/semesters/", response_model=schemas.Semester)
def create_semester(year_id: int, semester: schemas.SemesterCreate, db: Session = Depends(get_db)):
    db_semester = models.Semester(name=semester.name, year_id=year_id)
    db.add(db_semester)
    db.commit()
    db.refresh(db_semester)
    return db_semester

@app.get("/years/{year_id}/semesters/", response_model=List[schemas.Semester])
def get_semesters(year_id: int, db: Session = Depends(get_db)):
    return db.query(models.Semester).filter(models.Semester.year_id == year_id).all()

@app.put("/semesters/{semester_id}", response_model=schemas.Semester)
def update_semester(semester_id: int, semester: schemas.SemesterCreate, db: Session = Depends(get_db)):
    db_semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    if not db_semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    db_semester.name = semester.name
    db.commit()
    db.refresh(db_semester)
    return db_semester

@app.delete("/semesters/{semester_id}")
def delete_semester(semester_id: int, db: Session = Depends(get_db)):
    db_semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    if not db_semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    db.delete(db_semester)
    db.commit()
    return {"message": "Semester deleted"}

# === UNIT CRUD ===
@app.post("/semesters/{semester_id}/units/", response_model=schemas.Unit)
def create_unit(semester_id: int, unit: schemas.UnitCreate, db: Session = Depends(get_db)):
    db_unit = models.Unit(name=unit.name, semester_id=semester_id)
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit

@app.get("/semesters/{semester_id}/units/", response_model=List[schemas.Unit])
def get_units(semester_id: int, db: Session = Depends(get_db)):
    return db.query(models.Unit).filter(models.Unit.semester_id == semester_id).all()

# === DOCUMENT UPLOAD ===
@app.post("/documents/")
def upload_document(unit_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    db_doc = models.Document(filename=file.filename, filepath=file_path, unit_id=unit_id)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return {"message": "Upload successful", "id": db_doc.id}

@app.get("/documents/", response_model=List[schemas.DocumentWithPath])
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(models.Document).all()
    result = []
    for doc in docs:
        unit = doc.unit
        semester = unit.semester
        year = semester.year
        course = year.course
        path = f"{course.name} → {year.name} → {semester.name} → {unit.name}"
        result.append(schemas.DocumentWithPath(id=doc.id, filename=doc.filename, filepath=doc.filepath, course_path=path))
    return result

@app.get("/documents/download/{doc_id}")
def download_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(path=doc.filepath, filename=doc.filename, media_type="application/pdf")

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}

# === DOCUMENT PROCESSING ===
def process_document_stream(doc_id: int, db) -> Generator[str, None, None]:
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        yield "data: Document not found\n\n"
        return
    yield f"data: Processing {doc.filename}...\n\n"
    try:
        with fitz.open(doc.filepath) as pdf:
            text = "".join(page.get_text() for page in pdf)
    except Exception as e:
        yield f"data: Failed to read PDF: {str(e)}\n\n"
        return
    if not text.strip():
        yield "data: Document has no text.\n\n"
        return
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    chunks = splitter.split_text(text)
    yield f"data: Split into {len(chunks)} chunks.\n\n"
    embeddings = embedding_model.encode(chunks)
    unit_id = doc.unit_id
    unit_dir = os.path.join(VECTOR_ROOT, f"unit_{unit_id}")
    os.makedirs(unit_dir, exist_ok=True)
    index_path = os.path.join(unit_dir, "index.faiss")
    map_path = os.path.join(unit_dir, "doc_id_map.pkl")
    if os.path.exists(index_path):
        index = faiss.read_index(index_path)
        with open(map_path, "rb") as f:
            doc_id_map = pickle.load(f)
    else:
        index = faiss.IndexFlatL2(embedding_dim)
        doc_id_map = {}
    start_idx = index.ntotal
    index.add(embeddings)
    for i, chunk in enumerate(chunks):
        doc_id_map[start_idx + i] = {"doc_id": doc.id, "text": chunk}
    faiss.write_index(index, index_path)
    with open(map_path, "wb") as f:
        pickle.dump(doc_id_map, f)
    yield "data: Processing complete!\n\n"

@app.get("/documents/{doc_id}/process")
def process_document(doc_id: int, db: Session = Depends(get_db)):
    return StreamingResponse(process_document_stream(doc_id, db), media_type="text/event-stream")

# === ASK ENDPOINT ===
@app.post("/ask")
def ask_question(request: schemas.AskRequest, db: Session = Depends(get_db)):
    unit_id = request.unit_id
    question = request.question
    unit_dir = os.path.join(VECTOR_ROOT, f"unit_{unit_id}")
    index_path = os.path.join(unit_dir, "index.faiss")
    map_path = os.path.join(unit_dir, "doc_id_map.pkl")

    if not os.path.exists(index_path) or not os.path.exists(map_path):
        raise HTTPException(status_code=404, detail="Vector store not found for this unit")

    index = faiss.read_index(index_path)
    with open(map_path, "rb") as f:
        doc_id_map = pickle.load(f)

    question_embedding = embedding_model.encode([question])
    D, I = index.search(question_embedding, k=5)
    chunks = [doc_id_map[i]["text"] for i in I[0] if i in doc_id_map]
    context = "\n".join([f"- {c}" for c in chunks])

    prompt = f"""
    You are a helpful tutor. Based on the notes below, answer the student's question.

    Notes:
    {context}

    Question: {question}
    Answer:
    """

    # ✅ Updated model
    completion = groq_client.chat.completions.create(
        model="llama3-70b-8192",  # REPLACE with an active model
        messages=[
            {"role": "system", "content": "You are a helpful tutor."},
            {"role": "user", "content": prompt}
        ]
    )
    answer = completion.choices[0].message.content.strip()
    return {"answer": answer}

@app.get("/tree/", response_model=List[schemas.Course])
def get_course_tree(db: Session = Depends(get_db)):
    courses = db.query(models.Course).all()
    return courses
