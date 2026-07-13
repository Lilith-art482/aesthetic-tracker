export type Emotion = 'happy' | 'sleepy' | 'thirsty' | 'inspired' | 'neutral' | 'love' | 'thinking';

export type Tab = 'planner' | 'finances' | 'habits';

export type OperationType = 'income' | 'expense';

export interface Task {
  id: string;
  text: string;
  date: string;
  completed: boolean;
  createdAt: string;
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

export interface FinanceOperation {
  id: string;
  type: OperationType;
  amount: number;
  category: string;
  description: string;
  date: string;
  account: string;
  createdAt: string;
}

export interface FinanceData {
  operations: FinanceOperation[];
}

export const INCOME_CATEGORIES = [
  'Зарплата',
  'Фриланс / Подработка',
  'Подарок',
  'Инвестиции / Проценты',
  'Кэшбэк',
  'Возврат долга',
  'Продажа вещей',
  'Другое',
];

export const EXPENSE_CATEGORIES = [
  'Еда',
  'Транспорт',
  'Одежда',
  'Развлечения',
  'Здоровье',
  'Дом',
  'Связь',
  'Образование',
  'Другое',
];

export const ACCOUNTS = ['Наличные', 'Карта', 'Сбережения'];
