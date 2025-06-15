from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import json

Base = declarative_base()

class Course(Base):
    __tablename__ = 'courses'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    years = relationship("Year", back_populates="course", cascade="all, delete")

class Year(Base):
    __tablename__ = 'years'
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    name = Column(String, nullable=False)
    course = relationship("Course", back_populates="years")
    semesters = relationship("Semester", back_populates="year", cascade="all, delete")

class Semester(Base):
    __tablename__ = 'semesters'
    id = Column(Integer, primary_key=True, index=True)
    year_id = Column(Integer, ForeignKey("years.id"), nullable=False)
    name = Column(String, nullable=False)
    year = relationship("Year", back_populates="semesters")
    units = relationship("Unit", back_populates="semester", cascade="all, delete")

class Unit(Base):
    __tablename__ = 'units'
    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    name = Column(String, nullable=False)
    semester = relationship("Semester", back_populates="units")
    documents = relationship("Document", back_populates="unit", cascade="all, delete")
    quiz_questions = relationship("QuizQuestion", back_populates="unit", cascade="all, delete")

class Document(Base):
    __tablename__ = 'documents'
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    course_path = Column(String, nullable=False)
    processed = Column(Integer, default=0)
    unit = relationship("Unit", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete")

class Chunk(Base):
    __tablename__ = 'chunks'
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    text = Column(String, nullable=False)
    heading = Column(String)
    pages = Column(String)  # Store as JSON for lists
    document = relationship("Document", back_populates="chunks")
    quiz_questions = relationship("QuizQuestion", back_populates="chunk", cascade="all, delete")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True)
    unit_id = Column(Integer, ForeignKey("units.id"))
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=False)  # ✅ Change from String to JSON
    correct_answer = Column(String, nullable=False)
    explanation = Column(String)
    chunk_id = Column(Integer, ForeignKey("chunks.id"))
    unit = relationship("Unit", back_populates="quiz_questions")
    chunk = relationship("Chunk", back_populates="quiz_questions")
