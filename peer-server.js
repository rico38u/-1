// ============================================================
// ===== خادم PeerJS الوسيط للبث المباشر =====
// ============================================================
const { PeerServer } = require('peer');
const peerServer = PeerServer({
    port: 9000,
    path: '/',
    allow_discovery: true
});

console.log('✅ PeerJS Server running on port 9000');

// يمكن تشغيله عبر:
// npm install peer
// node peer-server.js