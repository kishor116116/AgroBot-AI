import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBkF7-o1KKzOoEwILNgoin6eQZBvAAchXs",
  authDomain: "agrobot-ai.firebaseapp.com",
  projectId: "agrobot-ai",
  storageBucket: "agrobot-ai.firebasestorage.app",
  messagingSenderId: "413038350682",
  appId: "1:413038350682:web:23841cdcadb74d5569e363",
  measurementId: "G-QF0BH1V96Y",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };