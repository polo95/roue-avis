import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA0LjEAtLMEgxmCCZe0OM-GKfl-H8QrmLw',
  authDomain: 'roue-avis-c72ad.firebaseapp.com',
  projectId: 'roue-avis-c72ad',
  storageBucket: 'roue-avis-c72ad.firebasestorage.app',
  messagingSenderId: '830254203656',
  appId: '1:830254203656:web:5695d5811afbfb7bed22bd',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export default app;
