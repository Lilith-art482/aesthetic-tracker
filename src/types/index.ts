export type Emotion = 'happy' | 'sleepy' | 'thirsty' | 'inspired' | 'neutral' | 'love' | 'thinking';

export type Tab = 'planner' | 'finances' | 'habits';

export interface Task {
  id: string;
  text: string;
  date: string;
  completed: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  lastCompleted: string | null;
  dates: string[];
  color: string;
}

export interface FinanceData {
  budget: number;
  expenses: Expense[];
}
