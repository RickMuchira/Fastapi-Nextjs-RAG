from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Course(Base):
    __tablename__ = 'courses'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    years = relationship("Year", back_populates="course", cascade="all, delete")


class Year(Base):
    __tablename__ = 'years'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    course = relationship("Course", back_populates="years")
    semesters = relationship("Semester", back_populates="year", cascade="all, delete")


class Semester(Base):
    __tablename__ = 'semesters'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False)
    year_id = Column(Integer, ForeignKey("years.id"), nullable=False)

    year = relationship("Year", back_populates="semesters")
    units = relationship("Unit", back_populates="semester", cascade="all, delete")


class Unit(Base):
    __tablename__ = 'units'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)

    semester = relationship("Semester", back_populates="units")
    documents = relationship("Document", back_populates="unit", cascade="all, delete")


class Document(Base):
    __tablename__ = 'documents'
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)  # ✅ Make sure this field exists in the DB
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)

    unit = relationship("Unit", back_populates="documents")
