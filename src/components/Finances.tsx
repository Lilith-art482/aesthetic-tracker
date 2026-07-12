import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Trash, CurrencyDollar } from '@phosphor-icons/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { FinanceData, Emotion } from '../types';
import { playStoneDropSound } from '../utils/sounds';
import './Finances.css';

interface FinancesProps {
  onRobotEmotion?: (emotion: Emotion) => void;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const categories = [
  'Еда', 'Транспорт', 'Развлечения', 'Покупки', 'Здоровье', 'Другое'
];

export default function Finances({ onRobotEmotion }: FinancesProps) {
  const [data, setData] = useLocalStorage<FinanceData>('finance_data', {
    budget: 30000,
    expenses: []
  });

  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Другое');
  const [note, setNote] = useState('');

  const totalSpent = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = data.budget - totalSpent;
  const waterLevel = Math.max(0, Math.min(1, remaining / data.budget));

  const addExpense = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const expense = {
      id: generateId(),
      amount: amt,
      category,
      date: new Date().toISOString().slice(0, 10),
      note: note.trim()
    };
    setData(prev => ({ ...prev, expenses: [...prev.expenses, expense] }));
    playStoneDropSound();
    setAmount('');
    setNote('');
    setShowAdd(false);
    onRobotEmotion?.('sleepy');
    setTimeout(() => onRobotEmotion?.('neutral'), 2000);
  };

  const deleteExpense = (id: string) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
    onRobotEmotion?.('happy');
    setTimeout(() => onRobotEmotion?.('neutral'), 2000);
  };

  const setBudget = () => {
    const val = prompt('Новый бюджет (₽):', String(data.budget));
    if (val) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        setData(prev => ({ ...prev, budget: num }));
        onRobotEmotion?.('inspired');
        setTimeout(() => onRobotEmotion?.('neutral'), 2500);
      }
    }
  };

  const stones = data.expenses.slice(-20).reverse();

  return (
    <div className="finances">
      <h2 className="section-title">
        <Wallet size={28} weight="fill" />
        Здоровье кошелька
      </h2>

      <div className="finance-content">
        <div className="aquarium-section">
          <div className="aquarium" onClick={setBudget}>
            <div className="aquarium-bg" />
            <motion.div
              className="aquarium-water"
              animate={{ height: `${waterLevel * 100}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            />
            <div className="aquarium-glass" />
            <div className="aquarium-info">
              <div className="aqua-amount">{remaining.toLocaleString()} ₽</div>
              <div className="aqua-label">осталось</div>
            </div>
            <div className="aquarium-bubbles">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="bubble"
                  animate={{
                    y: [0, -60 - Math.random() * 40],
                    opacity: [0.4, 0],
                    x: [0, (Math.random() - 0.5) * 20]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: 'easeOut'
                  }}
                  style={{
                    left: `${15 + Math.random() * 70}%`,
                    bottom: `${waterLevel * 100 - 5}%`,
                    width: 4 + Math.random() * 6,
                    height: 4 + Math.random() * 6
                  }}
                />
              ))}
            </div>
            <AnimatePresence>
              {stones.map((exp, i) => (
                <motion.div
                  key={exp.id}
                  className="stone"
                  initial={{ y: -40, opacity: 1, x: (i % 5) * 18 - 36 }}
                  animate={{
                    y: 250 - i * 12,
                    opacity: 0.7 - i * 0.03,
                    scale: 1 - i * 0.02
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.05 }}
                  style={{
                    left: `${15 + (i * 23) % 70}%`,
                    background: exp.amount > 1000
                      ? 'linear-gradient(135deg, #f0a8b8, #d495a8)'
                      : 'linear-gradient(135deg, #b8d4e8, #a0c0d8)'
                  }}
                >
                  <span className="stone-label">{exp.amount}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="aquarium-sand" />
          </div>

          <div className="budget-bar">
            <div className="budget-track">
              <motion.div
                className="budget-fill"
                animate={{ width: `${(remaining / data.budget) * 100}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                style={{
                  background: remaining > data.budget * 0.3
                    ? 'linear-gradient(90deg, #B5EAD7, #7ec8a0)'
                    : 'linear-gradient(90deg, #FDE2E4, #f0a0b0)'
                }}
              />
            </div>
            <span className="budget-text">{remaining.toLocaleString()} / {data.budget.toLocaleString()} ₽</span>
          </div>
        </div>

        <div className="expenses-section">
          <div className="expenses-header">
            <h3>Траты</h3>
            <motion.button
              className="expense-add-btn"
              onClick={() => setShowAdd(!showAdd)}
              whileTap={{ scale: 0.9 }}
            >
              <Plus size={20} weight="bold" />
            </motion.button>
          </div>

          <AnimatePresence>
            {showAdd && (
              <motion.div
                className="expense-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="number"
                  className="expense-input"
                  placeholder="Сумма"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                <select
                  className="expense-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input
                  type="text"
                  className="expense-input"
                  placeholder="Заметка (необяз.)"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <motion.button
                  className="expense-submit"
                  onClick={addExpense}
                  whileTap={{ scale: 0.95 }}
                >
                  <CurrencyDollar size={18} weight="fill" /> Добавить
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="expenses-list">
            <AnimatePresence>
              {data.expenses.slice().reverse().map(exp => (
                <motion.div
                  key={exp.id}
                  className="expense-item"
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                >
                  <div className="expense-cat" style={{
                    background: categories.indexOf(exp.category) % 2 === 0
                      ? 'rgba(253, 226, 228, 0.3)' : 'rgba(207, 186, 225, 0.3)'
                  }}>
                    {exp.category[0]}
                  </div>
                  <div className="expense-info">
                    <span className="expense-note">{exp.note || exp.category}</span>
                    <span className="expense-date">{exp.date}</span>
                  </div>
                  <span className="expense-amount">-{exp.amount.toLocaleString()} ₽</span>
                  <button className="expense-delete" onClick={() => deleteExpense(exp.id)}>
                    <Trash size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {data.expenses.length === 0 && (
              <div className="expenses-empty">Нет трат. Отличная работа!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
