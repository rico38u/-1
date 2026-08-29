// ============================================================
// ===== نظام المصادقة (اسم مستخدم + كلمة مرور) — VERSION 2.0 =====
// ============================================================

// التحقق من حالة المستخدم
auth.onAuthStateChanged(user => {
    const loginSection = document.getElementById('loginMenuSection');
    const userSection = document.getElementById('userMenuSection');
    const appContainer = document.getElementById('appContainer');

    if (user) {
        console.log('✅ مستخدم مسجل:', user.uid);
        loginSection.style.display = 'none';
        userSection.style.display = 'block';
        appContainer.style.display = 'flex';
        loadUserData(user.uid);
        updateProfileUI(user);
        loadAllMedia();
        loadTofoPosts();
        loadChats();
        showNotification('👋 مرحباً بك مرة أخرى!');
    } else {
        console.log('❌ لا يوجد مستخدم مسجل');
        loginSection.style.display = 'block';
        userSection.style.display = 'none';
        appContainer.style.display = 'flex';
        const grid = document.getElementById('mediaGrid');
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:rgba(0,0,0,0.1);">
                <i class="fas fa-photo-video" style="font-size:56px;opacity:0.1;margin-bottom:16px;display:block;"></i>
                <p style="font-size:20px;">مرحباً بك في Black 1</p>
                <p style="font-size:14px;color:rgba(0,0,0,0.05);">سجل دخولك لمشاهدة المحتوى ونشر الفيديوهات</p>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px;">
                    <button onclick="openLoginModal()" style="padding:10px 30px;background:#ff0040;color:#fff;border:none;border-radius:30px;font-size:16px;font-weight:700;cursor:pointer;">تسجيل الدخول</button>
                    <button onclick="openRegisterModal()" style="padding:10px 30px;background:#1DA1F2;color:#fff;border:none;border-radius:30px;font-size:16px;font-weight:700;cursor:pointer;">إنشاء حساب</button>
                </div>
            </div>
        `;
    }
});

// ===== ✅ تسجيل الدخول (الإصدار المُحسَّن) =====
function loginUser() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!username || !password) {
        showNotification('❌ يرجى ملء جميع الحقول');
        return;
    }

    // 🔥 استخدام إيميل ثابت مع نطاق معتمد من Firebase
    const tempEmail = username.toLowerCase() + '@black1-app.firebaseapp.com';

    auth.signInWithEmailAndPassword(tempEmail, password)
        .then(() => {
            showNotification('✅ تم تسجيل الدخول بنجاح!');
            closeLoginModal();
            // تحديث الواجهة فوراً
            location.reload();
        })
        .catch(error => {
            console.error('❌ خطأ في تسجيل الدخول:', error);
            if (error.code === 'auth/user-not-found') {
                showNotification('❌ اسم المستخدم غير موجود، يرجى إنشاء حساب أولاً');
            } else if (error.code === 'auth/wrong-password') {
                showNotification('❌ كلمة المرور غير صحيحة');
            } else {
                showNotification('❌ ' + error.message);
            }
        });
}

// ===== ✅ إنشاء حساب جديد (الإصدار المُحسَّن) =====
function registerUser() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    
    if (!username || !password) {
        showNotification('❌ يرجى ملء جميع الحقول');
        return;
    }
    
    if (password.length < 6) {
        showNotification('❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }

    // 🔥 استخدام إيميل ثابت مع نطاق معتمد من Firebase
    const tempEmail = username.toLowerCase() + '@black1-app.firebaseapp.com';

    // التحقق من عدم وجود اسم مستخدم مكرر
    db.collection('users').where('username', '==', username).get()
        .then(snapshot => {
            if (!snapshot.empty) {
                showNotification('❌ هذا الاسم مستخدم بالفعل، اختر اسماً آخر');
                return Promise.reject('username_exists');
            }
            
            // خطوة 1: إنشاء الحساب في Firebase Auth
            return auth.createUserWithEmailAndPassword(tempEmail, password)
                .then(userCredential => {
                    const user = userCredential.user;
                    // خطوة 2: تخزين بيانات المستخدم في Firestore
                    return db.collection('users').doc(user.uid).set({
                        uid: user.uid,
                        name: username,
                        username: username,
                        email: tempEmail,
                        handle: '@' + username,
                        bio: '⚡ مستخدم جديد على Black 1',
                        avatar: '👤',
                        avatarUrl: null,
                        followers: 0,
                        following: 0,
                        isOnline: true,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        // ✅ خطوة 3: تسجيل الدخول تلقائياً بعد إنشاء الحساب
                        return auth.signInWithEmailAndPassword(tempEmail, password);
                    });
                });
        })
        .then(() => {
            showNotification('✅ تم إنشاء الحساب وتسجيل الدخول بنجاح!');
            closeRegisterModal();
            // ✅ تحديث واجهة المستخدم فوراً
            location.reload();
        })
        .catch(error => {
            if (error === 'username_exists') {
                // تم التعامل معها بالفعل
                return;
            }
            if (error.code === 'auth/email-already-in-use') {
                showNotification('❌ هذا الاسم مستخدم بالفعل، اختر اسماً آخر');
            } else {
                console.error('❌ خطأ في إنشاء الحساب:', error);
                showNotification('❌ ' + error.message);
            }
        });
}

// ===== تسجيل الخروج =====
function logoutUser() {
    const user = auth.currentUser;
    if (user) {
        db.collection('users').doc(user.uid).update({ isOnline: false });
    }
    auth.signOut().then(() => {
        showNotification('👋 تم تسجيل الخروج');
        location.reload();
    });
}

// ===== متغيرات المستخدم =====
let currentUserData = null;

function loadUserData(uid) {
    db.collection('users').doc(uid).onSnapshot(doc => {
        if (doc.exists) {
            currentUserData = doc.data();
            currentUserData.uid = uid;
            updateProfileUI(currentUserData);
            updateSideMenu(currentUserData);
        }
    });
}

function updateProfileUI(user) {
    if (!user) return;
    const name = user.name || user.displayName || 'مستخدم';
    const handle = user.handle || '@' + name.replace(/\s/g, '');
    const bio = user.bio || '⚡ مستخدم على Black 1';
    const avatarHtml = user.avatarUrl ? `<img src="${user.avatarUrl}">` : (user.avatar || '👤');
    document.getElementById('profileName').innerHTML = name;
    document.getElementById('profileHandle').textContent = handle;
    document.getElementById('profileBio').textContent = bio;
    document.getElementById('profileAvatar').innerHTML = avatarHtml;
    document.getElementById('headerAvatar').innerHTML = avatarHtml;
    document.getElementById('subCount').textContent = user.followers || 0;
}

function updateSideMenu(user) {
    if (!user) return;
    const name = user.name || 'مستخدم';
    const handle = user.handle || '@' + name.replace(/\s/g, '');
    const avatarHtml = user.avatarUrl ? `<img src="${user.avatarUrl}">` : (user.avatar || '👤');
    document.getElementById('sideAvatar').innerHTML = avatarHtml;
    document.getElementById('sideName').innerHTML = name;
    document.getElementById('sideHandle').textContent = handle;
}

// ===== فتح وإغلاق النوافذ =====
function openLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

function openRegisterModal() {
    document.getElementById('registerModal').classList.add('active');
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
}

function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('active');
}

function toggleSideMenu() {
    document.getElementById('sideMenuOverlay').classList.toggle('active');
}

function showNotification(text) {
    const notif = document.getElementById('notification');
    document.getElementById('notifText').textContent = text;
    notif.classList.add('show');
    clearTimeout(notif._timeout);
    notif._timeout = setTimeout(() => notif.classList.remove('show'), 3000);
}