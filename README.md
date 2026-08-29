# Nexora Full Stack

## 1. تشغيل قاعدة البيانات
ثبّت MongoDB محلياً أو استخدم MongoDB Atlas، ثم انسخ `server/.env.example` إلى `server/.env` وعدّل القيم.

## 2. تشغيل السيرفر
```bash
cd server
npm install
npm start
```

## 3. تشغيل الموقع
شغّل ملفات الواجهة عبر خادم HTTP (مثلاً VS Code Live Server) على `http://localhost:8080`.

## ملاحظة
تمت إضافة Backend حقيقي + MongoDB + JWT + كلمات مرور مشفرة bcrypt + رفع ملفات + بحث مستخدمين + رسائل + منشورات. الواجهة الحالية تحتاج ربط دوال Firebase القديمة تدريجياً مع `api.js` endpoints لتصبح كل الوظائف تعمل عبر السيرفر.
