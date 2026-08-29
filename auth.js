// ============================================================
// ===== نظام حسابات محلي بدون Firebase =====
// ملاحظة: الحسابات محفوظة في نفس المتصفح/الجهاز عبر localStorage.
// ============================================================
let currentUserData = null;

function getUsers(){ return JSON.parse(localStorage.getItem('nexora_users') || '[]'); }
function saveUsers(users){ localStorage.setItem('nexora_users', JSON.stringify(users)); }
function getCurrentUser(){ return JSON.parse(localStorage.getItem('nexora_current_user') || 'null'); }
function setCurrentUser(user){ localStorage.setItem('nexora_current_user', JSON.stringify(user)); currentUserData=user; }
function makeId(){ return 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,9); }

function bootAuth(){
 const user=getCurrentUser();
 const loginSection=document.getElementById('loginMenuSection');
 const userSection=document.getElementById('userMenuSection');
 const appContainer=document.getElementById('appContainer');
 if(appContainer) appContainer.style.display='flex';
 if(user){
   if(loginSection) loginSection.style.display='none';
   if(userSection) userSection.style.display='block';
   currentUserData=user;
   updateProfileUI(user); updateSideMenu(user);
 } else {
   if(loginSection) loginSection.style.display='block';
   if(userSection) userSection.style.display='none';
 }
}

document.addEventListener('DOMContentLoaded', bootAuth);

function loginUser(){
 const username=document.getElementById('loginUsername').value.trim().toLowerCase();
 const password=document.getElementById('loginPassword').value;
 if(!username||!password) return showNotification('❌ اكتب اسم المستخدم وكلمة المرور');
 const user=getUsers().find(u=>u.username.toLowerCase()===username && u.password===password);
 if(!user) return showNotification('❌ بيانات الدخول غير صحيحة');
 const safe={...user}; delete safe.password; setCurrentUser(safe);
 showNotification('✅ تم تسجيل الدخول بنجاح!'); closeLoginModal(); bootAuth();
 if(typeof loadAllMedia==='function') loadAllMedia();
 if(typeof loadTofoPosts==='function') loadTofoPosts();
}

function registerUser(){
 const username=document.getElementById('registerUsername').value.trim();
 const password=document.getElementById('registerPassword').value;
 if(!username||!password) return showNotification('❌ يرجى ملء جميع الحقول');
 if(password.length<6) return showNotification('❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل');
 const users=getUsers();
 if(users.some(u=>u.username.toLowerCase()===username.toLowerCase())) return showNotification('❌ اسم المستخدم مستخدم بالفعل');
 const user={uid:makeId(),name:username,username,handle:'@'+username,bio:'⚡ مستخدم جديد على Nexora',avatar:'👤',avatarUrl:null,followers:0,following:0,createdAt:Date.now(),password};
 users.push(user); saveUsers(users); const safe={...user}; delete safe.password; setCurrentUser(safe);
 showNotification('✅ تم إنشاء الحساب بنجاح!'); closeRegisterModal(); bootAuth();
}

function logoutUser(){ localStorage.removeItem('nexora_current_user'); currentUserData=null; showNotification('👋 تم تسجيل الخروج'); bootAuth(); }
function loadUserData(){ currentUserData=getCurrentUser(); if(currentUserData){updateProfileUI(currentUserData);updateSideMenu(currentUserData);} }
function updateProfileUI(user){ if(!user)return; const name=user.name||'مستخدم'; const handle=user.handle||'@'+name; const bio=user.bio||''; const avatarHtml=user.avatarUrl?`<img src="${user.avatarUrl}">`:(user.avatar||'👤'); const a=document.getElementById('profileName');if(a)a.textContent=name; const b=document.getElementById('profileHandle');if(b)b.textContent=handle; const c=document.getElementById('profileBio');if(c)c.textContent=bio; const d=document.getElementById('profileAvatar');if(d)d.innerHTML=avatarHtml; const e=document.getElementById('headerAvatar');if(e)e.innerHTML=avatarHtml; }
function updateSideMenu(user){ if(!user)return; const avatarHtml=user.avatarUrl?`<img src="${user.avatarUrl}">`:(user.avatar||'👤'); const a=document.getElementById('sideAvatar');if(a)a.innerHTML=avatarHtml; const b=document.getElementById('sideName');if(b)b.textContent=user.name||'مستخدم'; const c=document.getElementById('sideHandle');if(c)c.textContent=user.handle||'@مستخدم'; }
function openLoginModal(){document.getElementById('loginModal').classList.add('active');}
function closeLoginModal(){document.getElementById('loginModal').classList.remove('active');}
function openRegisterModal(){document.getElementById('registerModal').classList.add('active');}
function closeRegisterModal(){document.getElementById('registerModal').classList.remove('active');}
function toggleSideMenu(){document.getElementById('sideMenuOverlay').classList.toggle('active');}
function showNotification(text){const n=document.getElementById('notification'); if(!n)return; document.getElementById('notifText').textContent=text;n.classList.add('show');clearTimeout(n._timeout);n._timeout=setTimeout(()=>n.classList.remove('show'),3000);}
