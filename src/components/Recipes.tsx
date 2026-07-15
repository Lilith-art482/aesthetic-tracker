import { motion } from 'framer-motion';
import { BookOpen } from '@phosphor-icons/react';
import './Recipes.css';

export default function Recipes() {
  return (
    <div className="recipes">
      <h2 className="section-title">
        <BookOpen size={28} weight="fill" />
        Рецепты
      </h2>

      <motion.div
        className="recipes-placeholder"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="recipes-icon">📖</div>
        <h3>Скоро здесь появятся рецепты</h3>
        <p>
          Ты сможешь добавлять свои любимые блюда,
          <br />
          делиться рецептами и планировать меню
        </p>
        <div className="recipes-hint">
          <span>🍳</span>
          <span>🥗</span>
          <span>🍝</span>
          <span>🥘</span>
          <span>🥐</span>
        </div>
      </motion.div>
    </div>
  );
}
