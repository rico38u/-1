// 🔥 إعدادات Firebase - مشروع Black1-App
const firebaseConfig = {
  apiKey: "AIzaSyDkzdXU_8OtG29Nn01n9SvEN8ABBHQll7Q",
  authDomain: "black1-app.firebaseapp.com",
  projectId: "black1-app",
  storageBucket: "black1-app.firebasestorage.app",
  messagingSenderId: "289670539382",
  appId: "1:289670539382:web:e14d6586928e2f1d991757",
  measurementId: "G-06H4X84F5X"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// تصدير الخدمات
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// تمكين المزامنة دون اتصال
db.enablePersistence().catch(err => console.warn('⚠️ Firebase persistence error:', err));

// 🔥 إضافة: تعيين لغة المصادقة إلى العربية
auth.languageCode = 'ar';