from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from groq import Groq
import json
import models
import schemas

groq_client = Groq()  # Assumes Groq client is initialized elsewhere (e.g., in main.py)

def generate_question_for_chunk(chunk_text: str) -> dict:
    """
    Generate a multiple-choice question from a text chunk using Groq API.
    Returns a dictionary with question, options, correct answer, and explanation.
    """
    prompt = f"""
Generate a multiple-choice question with four options based on the following text. Also provide an explanation for the correct answer. Output in JSON format with the structure:
{{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "A",
  "explanation": "Explanation of why this is correct"
}}

Text: {chunk_text}
"""
    try:
        completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are a question generator that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        raise Exception(f"Failed to generate question: {str(e)}")

def generate_quiz_for_document(doc_id: int, db: Session):
    """
    Generate quiz questions for a document by processing its chunks.
    Yields JSON strings with progress and questions generated.
    """
    doc = db.query(models.Document).get(doc_id)
    if not doc:
        yield "data: {\"error\": \"Document not found\"}\n\n"
        return

    chunks = db.query(models.Chunk).filter_by(document_id=doc_id).all()
    total = len(chunks)
    if total == 0:
        yield "data: {\"error\": \"No chunks found for document\"}\n\n"
        return

    for i, chunk in enumerate(chunks):
        try:
            question_data = generate_question_for_chunk(chunk.text)
            quiz_question = models.QuizQuestion(
                unit_id=doc.unit_id,
                question=question_data["question"],
                options=json.dumps(question_data["options"]),
                correct_answer=question_data["correct_answer"],
                explanation=question_data.get("explanation", ""),
                chunk_id=chunk.id
            )
            db.add(quiz_question)
            db.commit()
            progress = int((i + 1) / total * 100)
            yield f"data: {json.dumps({'progress': progress, 'questionsGenerated': i + 1})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'Error generating question: {str(e)}'})}\n\n"
            continue

    yield "data: [DONE]\n\n"