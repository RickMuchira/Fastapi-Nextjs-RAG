from pydantic import BaseModel
from typing import List, Optional

# =========================
# SHARED INPUT SCHEMAS
# =========================

class CourseBase(BaseModel):
    name: str

class CourseCreate(CourseBase):
    pass

class YearBase(BaseModel):
    name: str

class YearCreate(YearBase):
    pass

class SemesterBase(BaseModel):
    name: str

class SemesterCreate(SemesterBase):
    pass

class UnitBase(BaseModel):
    name: str

class UnitCreate(UnitBase):
    pass

# =========================
# OUTPUT MODELS (NESTED)
# =========================

class Unit(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class Semester(BaseModel):
    id: int
    name: str
    units: List[Unit] = []

    class Config:
        from_attributes = True

class Year(BaseModel):
    id: int
    name: str
    semesters: List[Semester] = []

    class Config:
        from_attributes = True

class Course(BaseModel):
    id: int
    name: str
    years: List[Year] = []

    class Config:
        from_attributes = True

# =========================
# FLAT OUTPUTS (FOR LISTING)
# =========================

class CourseOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class YearOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class SemesterOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class UnitOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# =========================
# DOCUMENT SCHEMAS
# =========================

class DocumentBase(BaseModel):
    filename: str
    filepath: str
    unit_id: int

class Document(DocumentBase):
    id: int

    class Config:
        from_attributes = True

class DocumentWithPath(BaseModel):
    id: int
    filename: str
    filepath: str
    course_path: str  # e.g., "CS → Year 1 → Sem 2 → Data Structures"

    class Config:
        from_attributes = True

# =========================
# ASK REQUEST SCHEMA
# =========================

class AskRequest(BaseModel):
    unit_id: int
    question: str

# =========================
# QUIZ QUESTION SCHEMA
# =========================

class QuizQuestion(BaseModel):
    id: int
    unit_id: int
    question: str
    options: str  # JSON string of options
    correct_answer: str
    explanation: Optional[str] = None # Make explanation optional for the schema
    chunk_id: Optional[int] = None # Make chunk_id optional for the schema

    class Config:
        from_attributes = True
