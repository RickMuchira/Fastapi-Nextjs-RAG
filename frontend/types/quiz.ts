export interface Quiz {
  id: number;
  unit_id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  chunk_id: number | null;
  course_path: string;
}