# Эстетичный трекер

Пастельный SPA-трекер с роботом-помощником, в стиле glassmorphism и дунхуа-эстетики.

## Функции

- **Планер** — задачи с календарём, чекбоксы-звёздочки
- **Финансы** — бюджет в виде аквариума, траты-камешки
- **Привычки** — кристаллы с анимацией свечения и сериями
- **Робот-помощник** — 7 эмоций, напоминания о воде и разминке
- **Lo-Fi плеер** — звук дождя через Web Audio API

## Запуск

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
npm run preview
```

## Деплой на Vercel

1. Залейте репозиторий на GitHub
2. На [vercel.com](https://vercel.com) импортируйте репозиторий
3. Vercel автоматически определит Vite-фреймворк

## Подключение Firebase

1. Создайте проект в [Firebase Console](https://console.firebase.google.com)
2. Включите Firestore Database
3. Создайте `.env` файл (см. `.env.example`)
4. Установите `firebase` пакет: `npm install firebase`
5. Раскомментируйте код Firebase в `src/utils/firebase.ts`

## Технологии

- React 19 + TypeScript
- Vite
- Framer Motion
- Phosphor Icons
- localStorage
- Web Audio API
