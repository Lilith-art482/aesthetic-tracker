import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyBaUZzG00EBQrXjg02TeXchZM1135xBFMQ',
  authDomain: 'planer-138eb.firebaseapp.com',
  projectId: 'planer-138eb',
  storageBucket: 'planer-138eb.firebasestorage.app',
  messagingSenderId: '507210562275',
  appId: '1:507210562275:web:1ecc4756a39a3885b9e3d6',
  measurementId: 'G-5G72617HTG',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
