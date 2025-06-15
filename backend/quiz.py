import os
import json
import asyncio
from typing import AsyncGenerator, Dict, Any, List

from sqlalchemy.orm import Session

from groq import Groq, AsyncGroq, AuthenticationError

import models # This imports your models.py

# --- Configuration ---
GROQ_API_KEY = "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" # Keep consistent with main.py

# Initialize the ASYNCHRONOUS Groq client
groq_client = AsyncGroq(api_key=GROQ_API_KEY)


async def generate_question_for_chunk(chunk_text: str) -> Dict[str, Any]:
    """
    Generate a multiple-choice question from a text chunk using Groq API.
    Returns a dictionary with question, options, correct answer, and explanation.
    """
    print(f"DEBUG: quiz.py: Calling generate_question_for_chunk for chunk text length: {len(chunk_text)}")

    prompt = f"""
Generate exactly one multiple-choice question with four distinct options (A, B, C, D) based on the following text.
Ensure the question and its options are directly derivable from the text.
Provide the single correct option letter (A, B, C, or D) and a concise explanation for why it is correct.

Output your response in JSON format with the following structure:
{{
  "question": "The question text.",
  "options": {{
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  }},
  "correct_answer": "A",
  "explanation": "Explanation of the correct answer."
}}

Text: {chunk_text}
"""
    try:
        completion = await groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are an expert at creating multiple-choice questions in JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=1000,
        )
        response_content = completion.choices[0].message.content
        print(f"DEBUG: quiz.py: Groq raw response (first 200 chars): {response_content[:200]}...")
        question_data = json.loads(response_content)

        # Basic validation for expected keys and structure
        if not all(k in question_data for k in ["question", "options", "correct_answer"]):
            raise ValueError("LLM response missing required keys (question, options, correct_answer).")
        if not isinstance(question_data["options"], dict) or not all(opt in question_data["options"] for opt in ["A", "B", "C", "D"]):
            raise ValueError("LLM response 'options' field is not a dictionary with A, B, C, D keys.")

        return question_data
    except AuthenticationError:
        print("ERROR: quiz.py: Groq authentication failed. Check your API key.")
        raise Exception("Groq authentication failed—check your API key.")
    except json.JSONDecodeError as e:
        print(f"ERROR: quiz.py: Failed to decode JSON from Groq response: {e}")
        print(f"ERROR: quiz.py: Raw Groq response that caused error: {response_content if 'response_content' in locals() else 'Not available'}")
        raise Exception(f"Failed to parse question from LLM (JSON error): {str(e)}")
    except Exception as e:
        print(f"ERROR: quiz.py: An unexpected error occurred during question generation: {str(e)}")
        raise Exception(f"Failed to generate question: {str(e)}")


async def generate_quiz_for_document(doc_id: int, db: Session) -> AsyncGenerator[str, None]:
    """
    Generate quiz questions for a document by processing its chunks.
    Yields JSON strings with progress and questions generated.
    """
    print(f"DEBUG: quiz.py: generate_quiz_for_document called for doc_id: {doc_id}")
    doc = db.query(models.Document).get(doc_id)
    if not doc:
        print(f"ERROR: quiz.py: Document with ID {doc_id} not found.")
        yield f"data: {json.dumps({'status': 'error', 'message': 'Document not found'})}\n\n"
        return

    print(f"DEBUG: quiz.py: Document found: {doc.filename}")

    chunks = db.query(models.Chunk).filter_by(document_id=doc_id).all()
    total = len(chunks)
    print(f"DEBUG: quiz.py: Found {total} chunks for document ID {doc_id}.")

    if total == 0:
        print(f"ERROR: quiz.py: No chunks found for document ID {doc_id}. Ensure document was processed.")
        yield f"data: {json.dumps({'status': 'error', 'message': 'No chunks found for document. Please process the document first.'})}\n\n"
        return

    for i, chunk in enumerate(chunks):
        print(f"DEBUG: quiz.py: Processing chunk {i+1}/{total} (chunk_id: {chunk.id}).")
        try:
            # Indicate progress
            yield f"data: {json.dumps({'status': 'progress', 'current': i + 1, 'total': total, 'message': f'Generating question for chunk {i+1} of {total}...'})}\n\n"

            question_data = await generate_question_for_chunk(chunk.text)

            # Create QuizQuestion instance matching your models.py structure
            quiz_question = models.QuizQuestion(
                unit_id=doc.unit_id,
                question=question_data["question"], # Use 'question' column name
                options=json.dumps(question_data["options"]), # Store options as JSON string
                correct_answer=question_data["correct_answer"],
                explanation=question_data.get("explanation", ""),
                chunk_id=chunk.id,
                # Removed source_chunk, source_heading, source_pages as they are not columns in QuizQuestion based on your models.py
                # They are accessible via the 'chunk' relationship if needed from the DB
            )
            db.add(quiz_question)
            db.commit()
            db.refresh(quiz_question)

            print(f"DEBUG: quiz.py: Successfully generated and saved question {quiz_question.id} for chunk {chunk.id}.")

            # Send the generated question data to the frontend
            yield f"data: {json.dumps({
                'status': 'question_generated',
                'question': question_data['question'],
                'options': question_data['options'], # Send original dict, not JSON string, for frontend use
                'correct_answer': question_data['correct_answer'],
                'explanation': question_data.get('explanation', ''),
                'db_id': quiz_question.id
            })}\n\n"
            await asyncio.sleep(0.01)

        except Exception as e:
            db.rollback()
            print(f"ERROR: quiz.py: Failed to generate or save question for chunk {chunk.id}: {str(e)}")
            yield f"data: {json.dumps({'status': 'error', 'message': f'Error processing chunk {i+1}: {str(e)}'})}\n\n"
            continue

    print(f"DEBUG: quiz.py: Quiz generation complete for document ID {doc_id}.")
    yield f"data: {json.dumps({'status': 'completed', 'message': 'Quiz generation complete.'})}\n\n"