import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Plus, ArrowDownRight, ArrowUpRight,
  Funnel, ChartPieSlice
} from '@phosphor-icons/react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { FinanceData, FinanceOperation, OperationType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ACCOUNTS } from '../types';
import { playStoneDropSound } from '../utils/sounds';
import './Finances.css';

interface FinancesProps {
  onIncomeAdded?: () => void;
  onExpenseAdded?: () => void;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const EMPTY_DATA: FinanceData = { operations: [] };

export default function Finances({ onIncomeAdded, onExpenseAdded }: FinancesProps) {
  const [data, setData] = useLocalStorage<FinanceData>('finance_data', EMPTY_DATA);
  const [mode, setMode] = useState<OperationType>('expense');
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState(ACCOUNTS[0]);
  const [filter, setFilter] = useState<'all' | OperationType>('all');

  const categories = mode === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const totalIncome = useMemo(
    () => data.operations.filter(o => o.type === 'income').reduce((s, o) => s + o.amount, 0),
    [data.operations]
  );
  const totalExpense = useMemo(
    () => data.operations.filter(o => o.type === 'expense').reduce((s, o) => s + o.amount, 0),
    [data.operations]
  );
  const balance = totalIncome - totalExpense;
  const healthPercent = totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0;

  const filteredOps = useMemo(() => {
    let ops = [...data.operations].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    if (filter !== 'all') ops = ops.filter(o => o.type === filter);
    return ops;
  }, [data.operations, filter]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { income: number; expense: number }> = {};
    data.operations.forEach(o => {
      if (!stats[o.category]) stats[o.category] = { income: 0, expense: 0 };
      stats[o.category][o.type] += o.amount;
    });
    return stats;
  }, [data.operations]);

  const addOperation = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const op: FinanceOperation = {
      id: generateId(),
      type: mode,
      amount: amt,
      category,
      description: description.trim(),
      date,
      account,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, operations: [...prev.operations, op] }));
    if (mode === 'expense') playStoneDropSound();
    setAmount('');
    setDescription('');
    setShowAdd(false);
    if (mode === 'income') onIncomeAdded?.();
    else onExpenseAdded?.();
  };

  const deleteOperation = (id: string) => {
    setData(prev => ({
      ...prev,
      operations: prev.operations.filter(o => o.id !== id),
    }));
  };

  return (
    <div className="finances">
      <h2 className="section-title">
        <Wallet size={28} weight="fill" />
        Здоровье кошелька
      </h2>

      <div className="finance-summary">
        <div className="summary-card income">
          <ArrowUpRight size={20} weight="bold" />
          <div>
            <span className="summary-label">Доходы</span>
            <span className="summary-value">{totalIncome.toLocaleString()} ₽</span>
          </div>
        </div>
        <div className="summary-card expense">
          <ArrowDownRight size={20} weight="bold" />
          <div>
            <span className="summary-label">Расходы</span>
            <span className="summary-value">{totalExpense.toLocaleString()} ₽</span>
          </div>
        </div>
        <div className={`summary-card balance ${balance >= 0 ? 'positive' : 'negative'}`}>
          <Wallet size={20} weight="fill" />
          <div>
            <span className="summary-label">Баланс</span>
            <span className="summary-value">{balance.toLocaleString()} ₽</span>
          </div>
        </div>
      </div>

      <div className="health-bar">
        <div className="health-bar-track">
          <motion.div
            className="health-bar-fill"
            animate={{ width: `${Math.min(100, healthPercent)}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            style={{
              background: healthPercent <= 70
                ? 'linear-gradient(90deg, #B5EAD7, #7ec8a0)'
                : healthPercent <= 90
                  ? 'linear-gradient(90deg, #FFDFD3, #f0c0a0)'
                  : 'linear-gradient(90deg, #FDE2E4, #f0a0b0)'
            }}
          />
        </div>
        <span className="health-text">
          Здоровье кошелька: {healthPercent <= 70 ? '🌟' : healthPercent <= 90 ? '🌿' : '⚠️'} {Math.round(healthPercent)}%
        </span>
      </div>

      <div className="finance-layout">
        <div className="operations-section">
          <div className="ops-header">
            <div className="mode-tabs">
              <motion.button
                className={`mode-tab ${mode === 'expense' ? 'active' : ''}`}
                onClick={() => { setMode('expense'); setCategory(EXPENSE_CATEGORIES[0]); }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowDownRight size={18} weight="bold" /> Расход
              </motion.button>
              <motion.button
                className={`mode-tab ${mode === 'income' ? 'active' : ''}`}
                onClick={() => { setMode('income'); setCategory(INCOME_CATEGORIES[0]); }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowUpRight size={18} weight="bold" /> Доход
              </motion.button>
            </div>
            <motion.button
              className="ops-add-btn"
              onClick={() => setShowAdd(!showAdd)}
              whileTap={{ scale: 0.9 }}
            >
              <Plus size={20} weight="bold" />
            </motion.button>
          </div>

          <AnimatePresence>
            {showAdd && (
              <motion.div
                className="op-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="number"
                  className="op-input"
                  placeholder="Сумма"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                <select className="op-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input
                  type="text"
                  className="op-input"
                  placeholder="Описание"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                <input
                  type="date"
                  className="op-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
                <select className="op-select" value={account} onChange={e => setAccount(e.target.value)}>
                  {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
                </select>
                <motion.button
                  className="op-submit"
                  onClick={addOperation}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: mode === 'income'
                      ? 'linear-gradient(135deg, #B5EAD7, #7ec8a0)'
                      : 'linear-gradient(135deg, #FDE2E4, #f0a0b0)'
                  }}
                >
                  {mode === 'income' ? '💰 Добавить доход' : '💸 Добавить расход'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="ops-filter">
            <Funnel size={14} />
            {(['all', 'income', 'expense'] as const).map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Все' : f === 'income' ? 'Доходы' : 'Расходы'}
              </button>
            ))}
          </div>

          <div className="ops-list">
            <AnimatePresence>
              {filteredOps.map(op => (
                <motion.div
                  key={op.id}
                  className={`op-item ${op.type}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                >
                  <div className="op-icon" style={{
                    background: op.type === 'income'
                      ? 'rgba(181, 234, 215, 0.3)'
                      : 'rgba(253, 226, 228, 0.3)'
                  }}>
                    {op.type === 'income' ? '💰' : '💸'}
                  </div>
                  <div className="op-info">
                    <span className="op-category">{op.category}</span>
                    <span className="op-meta">
                      {op.description || op.account} · {op.date}
                    </span>
                  </div>
                  <span className={`op-amount ${op.type}`}>
                    {op.type === 'income' ? '+' : '-'}{op.amount.toLocaleString()} ₽
                  </span>
                  <button className="op-delete" onClick={() => deleteOperation(op.id)}>
                    ✕
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredOps.length === 0 && (
              <div className="ops-empty">Нет операций</div>
            )}
          </div>
        </div>

        <div className="chart-section">
          <h3 className="chart-title">
            <ChartPieSlice size={18} weight="fill" />
            По категориям
          </h3>
          <div className="chart-list">
            {Object.entries(categoryStats)
              .sort(([, a], [, b]) => (b.income + b.expense) - (a.income + a.expense))
              .map(([cat, stats]) => {
                const total = stats.income + stats.expense;
                const maxTotal = Math.max(
                  ...Object.values(categoryStats).map(s => s.income + s.expense),
                  1
                );
                const pct = Math.round((total / maxTotal) * 100);
                return (
                  <div key={cat} className="chart-row">
                    <div className="chart-bar-track">
                      {stats.income > 0 && (
                        <motion.div
                          className="chart-bar income"
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.income / maxTotal) * 100}%` }}
                          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        />
                      )}
                      {stats.expense > 0 && (
                        <motion.div
                          className="chart-bar expense"
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.expense / maxTotal) * 100}%` }}
                          transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.1 }}
                          style={{ left: `${(stats.income / maxTotal) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="chart-label">
                      <span>{cat}</span>
                      <span className="chart-value">
                        {stats.income > 0 && <span className="income">+{stats.income.toLocaleString()} </span>}
                        {stats.expense > 0 && <span className="expense">-{stats.expense.toLocaleString()}</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            {Object.keys(categoryStats).length === 0 && (
              <div className="chart-empty">Нет данных для графика</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
