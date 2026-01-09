
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  pageNumber: string;
  difficulty: 'سهل' | 'متوسط' | 'صعب';
}

export interface QuizResult {
  title: string;
  questions: Question[];
  targetAgeRange: { min: number; max: number };
}

export type AppState = 'IDLE' | 'LOADING' | 'GENERATED' | 'ERROR';

export interface QuizConfig {
  minAge: number;
  maxAge: number;
  questionCount: number;
}
