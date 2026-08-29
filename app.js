// ============================================================
// ===== التطبيق الرئيسي =====
// ============================================================

let allMedia = [];
let tofoPosts = [];
let currentMediaId = null;
let mediaStream = null;
let isLive = false;
let liveViewerInterval = null;
let liveViewers = 0;
let peer = null;
let currentRoomId = null;
let tofoImageData = null;

// ===== تحميل جميع الفيديوهات =====
function loadAllMedia() {
    db.collection('media').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        allMedia = [];
        snapshot.forEach(doc => {
            allMedia.push({ id: doc.id, ...doc.data() });
        });
        renderMedia();
    });
}

// ===== عرض الفيديوهات =====
function renderMedia(list = null) {
    const grid = document.getElementById('mediaGrid');
    const items = list || allMedia;
    if (items.length === 0) {
        const user = auth.currentUser;
        grid.innerHTML = `
            <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:rgba(0,0,0,0.1);font-size:20px;">
                <i class="fas fa-photo-video" style="font-size:56px;opacity:0.1;margin-bottom:16px;"></i>
                <p>لا يوجد منشورات</p>
                <p style="font-size:16px;color:rgba(0,0,0,0.05);">${user ? 'انشر فيديو أو صورة ليظهر هنا' : 'سجل دخولك لنشر المحتوى'}</p>
                ${!user ? `<button onclick="openLoginModal()" style="margin-top:12px;padding:8px 24px;background:#ff0040;color:#fff;border:none;border-radius:30px;font-size:14px;font-weight:700;cursor:pointer;">تسجيل الدخول</button>` : ''}
            </div>
        `;
        return;
    }
    grid.innerHTML = items.map(item => {
        const isVerified = item.verified || false;
        const quality = item.quality || 'HD';
        return `
            <div class="video-card" onclick="openTiktok('${item.id}')">
                <div class="thumb">
                    ${item.type === 'video' ? 
                        `<video src="${item.url}" muted preload="metadata" loading="lazy"></video>
                         ${item.duration ? `<div class="duration">${item.duration}</div>` : ''}
                         <div class="quality-badge">${quality}</div>` :
                        `<img src="${item.url}" loading="lazy" alt="${item.title}">
                         <div class="quality-badge">${quality}</div>`
                    }
                </div>
                <div class="info">
                    <div class="title">${item.title || 'بدون عنوان'}</div>
                    <div class="channel">${item.uploaderName || 'مستخدم'} ${isVerified ? '<i class="fas fa-circle-check verified"></i>' : ''}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== عرض الملف الشخصي =====
function renderProfileMedia(list = null) {
    const grid = document.getElementById('profileMediaGrid');
    const user = auth.currentUser;
    if (!user) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px;color:rgba(0,0,0,0.05);font-size:18px;">
                <i class="fas fa-photo-video" style="font-size:44px;opacity:0.05;margin-bottom:12px;"></i>
                <p>سجل دخولك لعرض منشوراتك</p>
                <button onclick="openLoginModal()" style="margin-top:12px;padding:8px 24px;background:#ff0040;color:#fff;border:none;border-radius:30px;font-size:14px;font-weight:700;cursor:pointer;">تسجيل الدخول</button>
            </div>
        `;
        return;
    }
    const userMedia = allMedia.filter(m => m.uploader === user.uid);
    const items = list || userMedia;
    if (items.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px;color:rgba(0,0,0,0.05);font-size:18px;">
                <i class="fas fa-photo-video" style="font-size:44px;opacity:0.05;margin-bottom:12px;"></i>
                <p>لا يوجد منشورات</p>
                <p style="font-size:14px;color:rgba(0,0,0,0.03);">انشر محتوى ليظهر هنا</p>
            </div>
        `;
        return;
    }
    grid.innerHTML = items.slice(0, 8).map(item => {
        const quality = item.quality || 'HD';
        return `
            <div class="video-card" onclick="openTiktok('${item.id}')">
                <div class="thumb">
                    ${item.type === 'video' ? 
                        `<video src="${item.url}" muted preload="metadata" loading="lazy"></video>
                         ${item.duration ? `<div class="duration">${item.duration}</div>` : ''}
                         <div class="quality-badge">${quality}</div>` :
                        `<img src="${item.url}" loading="lazy" alt="${item.title}">
                         <div class="quality-badge">${quality}</div>`
                    }
                </div>
                <div class="info">
                    <div class="title">${item.title || 'بدون عنوان'}</div>
                    <div class="channel">${item.uploaderName || 'مستخدم'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== TOFO =====
function loadTofoPosts() {
    db.collection('tofo').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        tofoPosts = [];
        snapshot.forEach(doc => {
            tofoPosts.push({ id: doc.id, ...doc.data() });
        });
        renderTofo();
    });
}

function renderTofo() {
    const container = document.getElementById('tofoFeed');
    if (tofoPosts.length === 0) {
        const user = auth.currentUser;
        container.innerHTML = `
            <div style="padding:40px;text-align:center;color:rgba(0,0,0,0.1);font-size:18px;">
                <i class="fas fa-fire" style="font-size:44px;opacity:0.1;margin-bottom:12px;display:block;"></i>
                لا توجد منشورات في TOFO
                <p style="font-size:14px;color:rgba(0,0,0,0.05);">${user ? 'انقر "نشر جديد" لإضافة منشور' : 'سجل دخولك للنشر في TOFO'}</p>
                ${!user ? `<button onclick="openLoginModal()" style="margin-top:12px;padding:8px 24px;background:#ff0040;color:#fff;border:none;border-radius:30px;font-size:14px;font-weight:700;cursor:pointer;">تسجيل الدخول</button>` : ''}
            </div>
        `;
        return;
    }
    container.innerHTML = tofoPosts.map(item => `
        <div class="tofo-item">
            <div class="avatar" style="background:linear-gradient(135deg, #f7971e, #ffd200);">
                ${item.avatarUrl ? `<img src="${item.avatarUrl}">` : (item.avatar || '👤')}
            </div>
            <div class="info">
                <div class="name">${item.userName || 'مستخدم'} <i class="fas fa-circle-check verified"></i></div>
                <div class="text">${item.text}</div>
                ${item.imageUrl ? `<div style="margin:6px 0;"><img src="${item.imageUrl}" style="max-width:100%;max-height:200px;border-radius:12px;"></div>` : ''}
                <div class="stats">
                    <span><i class="fas fa-heart" style="color:var(--primary);"></i> ${item.likes || 0}</span>
                    <span><i class="fas fa-comment"></i> ${item.comments || 0}</span>
                    <span><i class="fas fa-clock"></i> ${item.time || 'منذ قليل'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== TOFO POST =====
function openNewTofoPost() {
    const user = auth.currentUser;
    if (!user) { showNotification('❌ يرجى تسجيل الدخول أولاً'); openLoginModal(); return; }
    document.getElementById('newTofoPostModal').classList.add('active');
    document.getElementById('tofoPostText').value = '';
    tofoImageData = null;
    document.getElementById('tofoImagePreview').style.display = 'none';
}

function closeNewTofoPost() {
    document.getElementById('newTofoPostModal').classList.remove('active');
}

function handleTofoImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        tofoImageData = event.target.result;
        document.getElementById('tofoImagePreviewImg').src = tofoImageData;
        document.getElementById('tofoImagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removeTofoImage() {
    tofoImageData = null;
    document.getElementById('tofoImagePreview').style.display = 'none';
    document.getElementById('tofoImageInput').value = '';
}

async function publishTofoPost() {
    const user = auth.currentUser;
    if (!user) { showNotification('❌ يرجى تسجيل الدخول أولاً'); return; }
    const text = document.getElementById('tofoPostText').value.trim();
    if (!text) { showNotification('❌ يرجى كتابة نص المنشور'); return; }
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data() || {};
        let imageUrl = null;
        if (tofoImageData) {
            const storageRef = storage.ref(`tofo/${user.uid}_${Date.now()}.jpg`);
            const response = await fetch(tofoImageData);
            const blob = await response.blob();
            await storageRef.put(blob);
            imageUrl = await storageRef.getDownloadURL();
        }
        await db.collection('tofo').add({
            uid: user.uid,
            userName: userData.name || 'مستخدم',
            avatar: userData.avatar || '👤',
            avatarUrl: userData.avatarUrl || null,
            text: text,
            imageUrl: imageUrl,
            likes: 0,
            comments: 0,
            time: new Date().toLocaleString('ar'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification('✅ تم نشر المنشور في TOFO!');
        closeNewTofoPost();
    } catch (error) {
        showNotification('❌ خطأ في النشر: ' + error.message);
    }
}

// ===== رفع فيديو أو صورة =====
async function confirmUpload(type) {
    const user = auth.currentUser;
    if (!user) { showNotification('❌ يرجى تسجيل الدخول أولاً'); return; }
    const modal = type === 'video' ? document.getElementById('uploadModal') : document.getElementById('imageUploadModal');
    const url = modal.dataset.mediaUrl;
    const title = type === 'video' 
        ? document.getElementById('videoTitleInput').value.trim() || 'فيديو جديد'
        : document.getElementById('imageTitleInput').value.trim() || 'صورة جديدة';
    if (!url) { showNotification('❌ يرجى اختيار ملف أولاً'); return; }
    try {
        showNotification('⏳ جاري الرفع...');
        const response = await fetch(url);
        const blob = await response.blob();
        const storagePath = type === 'video' 
            ? `videos/${user.uid}_${Date.now()}.mp4`
            : `images/${user.uid}_${Date.now()}.jpg`;
        const storageRef = storage.ref(storagePath);
        await storageRef.put(blob);
        const downloadUrl = await storageRef.getDownloadURL();
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data() || {};
        const mediaData = {
            type: type,
            title: title,
            url: downloadUrl,
            quality: type === 'video' ? document.getElementById('videoQuality')?.value || 'HDR' : '4K',
            uploader: user.uid,
            uploaderName: userData.name || 'مستخدم',
            uploaderAvatar: userData.avatarUrl || null,
            verified: userData.verified || false,
            views: 0,
            likes: 0,
            duration: type === 'video' ? '00:30' : null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('media').add(mediaData);
        modal.classList.remove('active');
        modal.dataset.mediaUrl = '';
        if (type === 'video') {
            document.getElementById('fileInput').value = '';
            document.getElementById('videoTitleInput').value = '';
        } else {
            document.getElementById('imageInput').value = '';
            document.getElementById('imageTitleInput').value = '';
        }
        showNotification(`✅ تم نشر ${type === 'video' ? 'الفيديو' : 'الصورة'} بنجاح!`);
    } catch (error) {
        showNotification('❌ خطأ في الرفع: ' + error.message);
    }
}

function handleUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'video') {
        document.getElementById('uploadModal').dataset.mediaUrl = url;
        showNotification('📹 تم اختيار فيديو: ' + file.name);
    } else {
        document.getElementById('imageUploadModal').dataset.mediaUrl = url;
        showNotification('🖼️ تم اختيار صورة: ' + file.name);
    }
}

function openUpload() {
    const user = auth.currentUser;
    if (!user) { showNotification('❌ يرجى تسجيل الدخول أولاً'); openLoginModal(); return; }
    document.getElementById('uploadModal').classList.add('active');
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadModal').dataset.mediaUrl = '';
}

function openImageUpload() {
    const user = auth.currentUser;
    if (!user) { showNotification('❌ يرجى تسجيل الدخول أولاً'); openLoginModal(); return; }
    document.getElementById('imageUploadModal').classList.add('active');
    document.getElementById('imageInput').value = '';
    document.getElementById('imageUploadModal').dataset.mediaUrl = '';
}

// ===== تيك توك =====
function openTiktok(id) {
    const item = allMedia.find(m => m.id === id);
    if (!item) return;
    currentMediaId = id;
    const page = document.getElementById('tiktokPage');
    const video = document.getElementById('ttVideo');
    const img = document.getElementById('ttImage');
    if (item.type === 'video') {
        video.style.display = 'block';
        img.style.display = 'none';
        video.src = item.url;
        video.load();
        video.play();
    } else {
        video.style.display = 'none';
        img.style.display = 'block';
        img.src = item.url;
    }
    document.getElementById('ttTitle').textContent = item.title || 'بدون عنوان';
    document.getElementById('ttUploader').innerHTML = (item.uploaderName || 'مستخدم') + (item.verified ? ' <i class="fas fa-circle-check verified"></i>' : '');
    document.getElementById('ttViews').textContent = item.views || 0;
    document.getElementById('ttLikes').textContent = item.likes || 0;
    document.getElementById('ttLikeIcon').style.color = (item.likes || 0) > 0 ? '#ff0040' : 'rgba(255,255,255,0.2)';
    page.classList.add('active');
    db.collection('media').doc(id).update({
        views: firebase.firestore.FieldValue.increment(1)
    }).catch(console.warn);
}

function closeTiktok() {
    document.getElementById('tiktokPage').classList.remove('active');
    document.getElementById('ttVideo').pause();
}

function likeTt() {
    if (!currentMediaId) return;
    db.collection('media').doc(currentMediaId).update({
        likes: firebase.firestore.FieldValue.increment(1)
    }).then(() => {
        document.getElementById('ttLikes').textContent = parseInt(document.getElementById('ttLikes').textContent) + 1;
        document.getElementById('ttLikeIcon').style.color = '#ff0040';
    }).catch(console.warn);
}

// ===== البث المباشر =====
async function startLiveStream() {
    const user = auth.currentUser;
    if (!user) { showNotification('❌ يرجى تسجيل الدخول أولاً'); openLoginModal(); return; }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 },
            audio: true
        });
        mediaStream = stream;
        const video = document.getElementById('liveVideo');
        video.srcObject = stream;
        await video.play();
        document.getElementById('liveOverlay').classList.add('active');
        isLive = true;
        document.getElementById('liveBtn').classList.add('active');
        currentRoomId = 'live_' + user.uid + '_' + Date.now();
        peer = new Peer(user.uid + '_' + Date.now());
        peer.on('open', (id) => {
            console.log('✅ Peer ID:', id);
            showNotification('📡 البث المباشر جاهز! معرف الغرفة: ' + currentRoomId);
        });
        liveViewers = Math.floor(Math.random() * 20) + 5;
        document.getElementById('viewerCount').textContent = liveViewers;
        liveViewerInterval = setInterval(() => {
            liveViewers += Math.floor(Math.random() * 4) - 1;
            if (liveViewers < 3) liveViewers = 3;
            document.getElementById('viewerCount').textContent = liveViewers;
        }, 3000);
        showNotification('📡 بدأ البث المباشر! شارك معرف الغرفة: ' + currentRoomId);
    } catch (err) {
        showNotification('⚠️ لا يمكن بدء البث: ' + err.message);
        document.getElementById('liveBtn').classList.remove('active');
        isLive = false;
    }
}

function endLiveStream() {
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
    if (peer) { peer.destroy(); peer = null; }
    document.getElementById('liveOverlay').classList.remove('active');
    isLive = false;
    document.getElementById('liveBtn').classList.remove('active');
    clearInterval(liveViewerInterval);
    showNotification('⏹️ انتهى البث المباشر');
}

// ===== البحث عن مستخدمين (داخل مستخدمي المنصة فقط) =====
async function searchUsers() {
    const raw = document.getElementById('searchInput').value.trim();
    const query = raw.toLowerCase();
    const box = document.getElementById('searchResults');
    if (!query) { box.style.display = 'none'; box.innerHTML = ''; return; }
    try {
        // تحميل مجموعة صغيرة ثم مطابقة الاسم واسم المستخدم بدون كشف بيانات خاصة.
        const snapshot = await db.collection('users').limit(100).get();
        const results = [];
        snapshot.forEach(doc => {
            const u = { uid: doc.id, ...doc.data() };
            const haystack = `${u.name || ''} ${u.username || ''} ${u.handle || ''}`.toLowerCase();
            if (haystack.includes(query)) results.push(u);
        });
        box.style.display = 'block';
        box.innerHTML = `<div class="glass-search-results">${results.length ? results.slice(0,20).map(u => `
            <button class="user-search-row" onclick="openPublicProfile('${u.uid}')">
                <span class="search-avatar">${u.avatarUrl ? `<img src="${u.avatarUrl}" alt="">` : (u.avatar || '👤')}</span>
                <span><b>${escapeHtml(u.name || 'مستخدم')}</b><small>${escapeHtml(u.handle || '@' + (u.username || u.name || 'user'))}</small></span>
                <i class="fas fa-chevron-left"></i>
            </button>`).join('') : `<div class="empty-search">لا توجد نتائج داخل المنصة</div>`}</div>`;
    } catch (error) { showNotification('❌ خطأ في البحث: ' + error.message); }
}

function escapeHtml(v) { const d=document.createElement('div'); d.textContent=String(v||''); return d.innerHTML; }
function openPublicProfile(uid) {
    // ملف عام محدود للعضو، بدون بريد أو بيانات حساسة.
    db.collection('users').doc(uid).get().then(doc => {
        if (!doc.exists) return;
        const u=doc.data();
        showNotification(`👤 ${u.name || 'مستخدم'} — ${u.bio || 'عضو في المنصة'}`);
        document.getElementById('searchResults').style.display='none';
    });
}

// ===== البحث الصوتي =====
function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window)) {
        showNotification('❌ متصفحك لا يدعم البحث الصوتي');
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'ar-AR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = function(e) {
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
                document.getElementById('searchInput').value = e.results[i][0].transcript;
                searchUsers();
                return;
            } else {
                document.getElementById('searchInput').value = e.results[i][0].transcript;
            }
        }
    };
    recognition.start();
    showNotification('🎤 تحدث الآن...');
}

// ===== المحادثات =====
let chats = [];
let currentChatUserId = null;

function loadChats() {
    const user = auth.currentUser;
    if (!user) return;
    db.collection('chats')
        .where('participants', 'array-contains', user.uid)
        .orderBy('lastMessageTime', 'desc')
        .onSnapshot(snapshot => {
            chats = [];
            snapshot.forEach(doc => {
                chats.push({ id: doc.id, ...doc.data() });
            });
            renderChats();
            updateUnreadBadge();
        });
}

function renderChats(filter = '') {
    const container = document.getElementById('tgList');
    let list = chats;
    if (filter.trim()) {
        const q = filter.trim().toLowerCase();
        list = list.filter(c => 
            c.otherUserName.toLowerCase().includes(q) ||
            c.lastMessage.toLowerCase().includes(q)
        );
    }
    if (list.length === 0) {
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 16px;color:rgba(0,0,0,0.05);">
                <i class="fas fa-comment-slash" style="font-size:48px;opacity:0.05;margin-bottom:16px;"></i>
                <p style="font-size:18px;color:rgba(0,0,0,0.1);">لا توجد محادثات</p>
                <p style="font-size:14px;color:rgba(0,0,0,0.05);">ابحث عن مستخدم وابدأ محادثة</p>
            </div>
        `;
        return;
    }
    container.innerHTML = list.map(chat => `
        <div class="tg-item" onclick="openTgChat('${chat.otherUserId}')">
            <div class="avatar" style="background:${chat.otherAvatarColor || '#6c5ce7'};">
                ${chat.otherAvatarUrl ? `<img src="${chat.otherAvatarUrl}">` : (chat.otherAvatar || '👤')}
                ${chat.isOnline ? '<span class="online-dot"></span>' : ''}
            </div>
            <div class="info">
                <div class="name">${chat.otherUserName} ${chat.otherVerified ? '<i class="fas fa-circle-check verified"></i>' : ''}</div>
                <div class="last-msg">
                    ${chat.lastMessageSender === 'me' ? '<span class="sender">أنت: </span>' : ''}
                    ${chat.lastMessage}
                </div>
            </div>
            <div class="time">${chat.lastMessageTime}</div>
            ${chat.unreadCount > 0 ? `<div class="unread-badge">${chat.unreadCount}</div>` : ''}
        </div>
    `).join('');
}

async function searchTelegramDirectory() {
    const query = document.getElementById('tgSearch').value.trim().toLowerCase();
    renderChats(query);
    const directory = document.getElementById('tgDirectory');
    if (!query) { directory.innerHTML = ''; return; }
    try {
        const snap = await db.collection('users').limit(100).get();
        const me = auth.currentUser?.uid;
        const users=[];
        snap.forEach(doc => {
            if (doc.id === me) return;
            const u={uid:doc.id,...doc.data()};
            if (`${u.name||''} ${u.username||''} ${u.handle||''}`.toLowerCase().includes(query)) users.push(u);
        });
        directory.innerHTML = users.slice(0,8).map(u => `
            <button class="tg-directory-item" onclick="openTgChat('${u.uid}')">
                <span class="avatar">${u.avatarUrl ? `<img src="${u.avatarUrl}" alt="">` : (u.avatar||'👤')}</span>
                <span class="info"><b>${escapeHtml(u.name||'مستخدم')}</b><small>${escapeHtml(u.handle||'@'+(u.username||u.name||'user'))}</small></span>
                <span>ابدأ محادثة</span>
            </button>`).join('') || '<div class="tg-no-results">لا يوجد مستخدم مطابق</div>';
    } catch(e) { directory.innerHTML=''; }
}
function filterTgUsers(){ searchTelegramDirectory(); }
function focusTelegramPeopleSearch(){ const i=document.getElementById('tgSearch'); i.focus(); i.placeholder='ابحث عن شخص لبدء محادثة...'; }

function openTgChat(userId) {
    currentChatUserId = userId;
    document.getElementById('tgList').style.display = 'none';
    document.getElementById('tgChat').classList.add('active');
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('tgChatName').textContent = userData.name || 'مستخدم';
                document.getElementById('tgChatAvatar').innerHTML = userData.avatarUrl ? `<img src="${userData.avatarUrl}" alt="">` : (userData.avatar || '👤');
                document.getElementById('tgChatAvatar').style.background = userData.avatarColor || '#6c5ce7';
                document.getElementById('tgChatStatus').textContent = userData.isOnline ? '🟢 متصل' : '⚪ غير متصل';
            }
        });
    loadChatMessages(userId);
    document.getElementById('tgChatInput').value = '';
    document.getElementById('tgChatInput').focus();
}

function loadChatMessages(otherUserId) {
    const user = auth.currentUser;
    if (!user) return;
    const chatId = [user.uid, otherUserId].sort().join('_');
    db.collection('messages')
        .where('chatId', '==', chatId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            const msgs = [];
            snapshot.forEach(doc => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            renderMessages(msgs);
            const unreadMsgs = msgs.filter(m => m.senderId === otherUserId && !m.read);
            if (unreadMsgs.length > 0) {
                unreadMsgs.forEach(m => {
                    db.collection('messages').doc(m.id).update({ read: true });
                });
                db.collection('chats').doc(chatId).update({
                    unreadCount: 0
                });
            }
        });
}

function renderMessages(msgs) {
    const container = document.getElementById('tgChatMessages');
    container.innerHTML = msgs.map(m => `
        <div class="tg-msg ${m.senderId === auth.currentUser?.uid ? 'user' : 'other'}">
            ${m.text}
            <span class="time">${m.time}</span>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

function sendTgMessage() {
    if (!currentChatUserId) return;
    const input = document.getElementById('tgChatInput');
    const text = input.value.trim();
    if (!text) return;
    const user = auth.currentUser;
    if (!user) return;
    const chatId = [user.uid, currentChatUserId].sort().join('_');
    const time = new Date().toLocaleTimeString('ar');
    db.collection('messages').add({
        chatId: chatId,
        senderId: user.uid,
        receiverId: currentChatUserId,
        text: text,
        time: time,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    }).then(() => {
        input.value = '';
        db.collection('users').doc(currentChatUserId).get()
            .then(doc => {
                const otherUser = doc.data() || {};
                db.collection('chats').doc(chatId).set({
                    participants: [user.uid, currentChatUserId],
                    lastMessage: text,
                    lastMessageSender: 'me',
                    lastMessageTime: time,
                    otherUserId: currentChatUserId,
                    otherUserName: otherUser.name || 'مستخدم',
                    otherAvatar: otherUser.avatar || '👤',
                    otherAvatarUrl: otherUser.avatarUrl || null,
                    otherAvatarColor: otherUser.avatarColor || '#6c5ce7',
                    otherVerified: otherUser.verified || false,
                    isOnline: otherUser.isOnline || false,
                    unreadCount: 1
                }, { merge: true });
            });
    });
}

function closeTgChat() {
    document.getElementById('tgList').style.display = 'block';
    document.getElementById('tgChat').classList.remove('active');
    currentChatUserId = null;
}

function openTelegram() {
    const user = auth.currentUser;
    if (!user) { showNotification('❌ يرجى تسجيل الدخول أولاً'); openLoginModal(); return; }
    document.getElementById('telegramPage').classList.add('active');
    document.getElementById('tgChat').classList.remove('active');
    document.getElementById('tgSearch').value = '';
    loadChats();
}

function closeTelegram() {
    document.getElementById('telegramPage').classList.remove('active');
}

function updateUnreadBadge() {
    const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    const badge = document.getElementById('msgBadge');
    if (totalUnread > 0) {
        badge.textContent = totalUnread;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// ===== وظائف التنقل =====
function switchToHome(el) {
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    if (el && typeof el === 'object') el.classList.add('active');
    document.getElementById('homeContent').style.display = 'block';
    document.getElementById('profileContent').style.display = 'none';
    renderMedia();
}

function switchToProfile(el) {
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    if (el && typeof el === 'object') el.classList.add('active');
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';
    renderProfileMedia();
}

function openTofo() {
    document.getElementById('tofoPage').classList.add('active');
}

function closeTofo() {
    document.getElementById('tofoPage').classList.remove('active');
}

function openSettings() { showNotification('⚙️ الإعدادات قريباً'); }
function openRewards() { showNotification('🏆 المكافآت قريباً'); }
function startCall() { showNotification('📞 الاتصال قريباً'); }

function openEditProfile() {
    const user = auth.currentUser;
    if (!user) { showNotification('❌ يرجى تسجيل الدخول أولاً'); openLoginModal(); return; }
    document.getElementById('editProfileOverlay').classList.add('active');
    document.getElementById('editName').value = user.displayName || user.name || 'مستخدم';
    document.getElementById('editBio').value = user.bio || '⚡ مستخدم على Black 1';
}

function closeEditProfile() {
    document.getElementById('editProfileOverlay').classList.remove('active');
}

function saveEditProfile() {
    const user = auth.currentUser;
    if (!user) return;
    const name = document.getElementById('editName').value.trim() || 'مستخدم';
    const bio = document.getElementById('editBio').value.trim() || '⚡ مستخدم على Black 1';
    db.collection('users').doc(user.uid).update({
        name: name,
        bio: bio
    }).then(() => {
        showNotification('✅ تم حفظ التغييرات!');
        closeEditProfile();
    });
}

function handleAvatarEdit(e) {
    const file = e.target.files[0];
    if (!file || !auth.currentUser) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const imageUrl = event.target.result;
        db.collection('users').doc(auth.currentUser.uid).update({
            avatarUrl: imageUrl,
            avatar: '👤'
        }).then(() => {
            showNotification('✅ تم تحديث الصورة!');
            document.getElementById('editAvatar').innerHTML = `<img src="${imageUrl}">`;
        });
    };
    reader.readAsDataURL(file);
}

function subscribeChannel() { showNotification('✅ تم الاشتراك!'); }

function filterMedia(filter, el) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    let filtered = [...allMedia];
    if (filter === 'recent') filtered.sort((a, b) => b.createdAt - a.createdAt);
    else if (filter === 'popular') filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (filter === 'video') filtered = filtered.filter(m => m.type === 'video');
    else if (filter === 'image') filtered = filtered.filter(m => m.type === 'image');
    renderMedia(filtered);
}

function filterProfileMedia(filter, el) {
    document.querySelectorAll('.profile-tabs .tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    const user = auth.currentUser;
    if (!user) { renderProfileMedia([]); return; }
    const userMedia = allMedia.filter(m => m.uploader === user.uid);
    let filtered = [...userMedia];
    if (filter === 'videos') filtered = userMedia.filter(m => m.type === 'video');
    else if (filter === 'images') filtered = userMedia.filter(m => m.type === 'image');
    else if (filter === 'liked') filtered = userMedia.filter(m => (m.likes || 0) > 0);
    renderProfileMedia(filtered);
}

// ===== الوضع الليلي =====
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    const btn = document.getElementById('darkModeBtn');
    btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    showNotification(isDark ? '🌙 الوضع الليلي مفعّل' : '☀️ الوضع النهاري مفعّل');
}

// تحميل الوضع الليلي من التخزين المحلي
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('darkModeBtn');
    if (btn) btn.innerHTML = '<i class="fas fa-sun"></i>';
}

// ===== اختصارات لوحة المفاتيح =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('tiktokPage').classList.contains('active')) closeTiktok();
        if (document.getElementById('tofoPage').classList.contains('active')) closeTofo();
        if (document.getElementById('telegramPage').classList.contains('active')) closeTelegram();
        if (document.getElementById('tgChat').classList.contains('active')) closeTgChat();
        if (document.getElementById('uploadModal').classList.contains('active')) 
            document.getElementById('uploadModal').classList.remove('active');
        if (document.getElementById('imageUploadModal').classList.contains('active')) 
            document.getElementById('imageUploadModal').classList.remove('active');
        if (document.getElementById('loginModal').classList.contains('active')) closeLoginModal();
        if (document.getElementById('registerModal').classList.contains('active')) closeRegisterModal();
        if (document.getElementById('newTofoPostModal').classList.contains('active')) closeNewTofoPost();
        if (document.getElementById('sideMenuOverlay').classList.contains('active')) toggleSideMenu();
        if (document.getElementById('editProfileOverlay').classList.contains('active')) 
            document.getElementById('editProfileOverlay').classList.remove('active');
    }
});