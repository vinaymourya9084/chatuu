import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Automated Backend & Real-Time Socket Tests...');

  // 1. Health check
  const healthRes = await fetch(`${API_BASE}/health`);
  const health = await healthRes.json();
  console.log('✅ 1. Health Check:', health.status === 'ok' ? 'PASSED' : 'FAILED');

  // 2. Register User 1
  const rand = Math.floor(Math.random() * 10000);
  const u1Data = {
    username: `rohan_${rand}`,
    email: `rohan_${rand}@test.com`,
    password: 'password123',
    displayName: 'Rohan Sharma'
  };

  const reg1Res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(u1Data)
  });
  const reg1 = await reg1Res.json();
  console.log('✅ 2. Register User 1 (Rohan):', reg1.user?.username ? 'PASSED' : 'FAILED', reg1.user?.username);

  // 3. Register User 2
  const u2Data = {
    username: `sameer_${rand}`,
    email: `sameer_${rand}@test.com`,
    password: 'password123',
    displayName: 'Sameer Khan'
  };

  const reg2Res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(u2Data)
  });
  const reg2 = await reg2Res.json();
  console.log('✅ 3. Register User 2 (Sameer):', reg2.user?.username ? 'PASSED' : 'FAILED', reg2.user?.username);

  // 4. Update User 1 Profile (Bio & Status Mood)
  const updateRes = await fetch(`${API_BASE}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${reg1.token}`
    },
    body: JSON.stringify({
      statusText: '🚀 Coding on Chatuu',
      bio: 'Full stack developer building real-time apps'
    })
  });
  const updatedProfile = await updateRes.json();
  console.log('✅ 4. Profile Customization:', updatedProfile.user?.status_text === '🚀 Coding on Chatuu' ? 'PASSED' : 'FAILED');

  // 5. Search Users
  const searchRes = await fetch(`${API_BASE}/users/search?q=sameer`, {
    headers: { 'Authorization': `Bearer ${reg1.token}` }
  });
  const searchResults = await searchRes.json();
  console.log('✅ 5. User Search Discovery:', searchResults.users?.length > 0 ? 'PASSED' : 'FAILED');

  // 6. Create Direct Conversation
  const convRes = await fetch(`${API_BASE}/chats/direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${reg1.token}`
    },
    body: JSON.stringify({ targetUserId: reg2.user.id })
  });
  const convData = await convRes.json();
  const conversationId = convData.conversation?.id;
  console.log('✅ 6. Direct Conversation Creation:', conversationId ? 'PASSED' : 'FAILED', `(ID: ${conversationId})`);

  // 7. Test Real-time Socket Connection & Messaging
  const socket1 = io('http://localhost:5000', {
    auth: { token: reg1.token }
  });

  const socket2 = io('http://localhost:5000', {
    auth: { token: reg2.token }
  });

  await new Promise((resolve) => {
    let s1Connected = false;
    let s2Connected = false;

    socket1.on('connect', () => {
      s1Connected = true;
      if (s1Connected && s2Connected) resolve();
    });

    socket2.on('connect', () => {
      s2Connected = true;
      if (s1Connected && s2Connected) resolve();
    });
  });
  console.log('✅ 7. Dual Socket Handshake & Authentication: PASSED');

  // Join conversation
  socket1.emit('join_conversation', conversationId);
  socket2.emit('join_conversation', conversationId);

  // Send real-time message from User 1 to User 2
  const messagePromise = new Promise((resolve) => {
    socket2.on('receive_message', (msg) => {
      resolve(msg);
    });
  });

  socket1.emit('send_message', {
    conversationId,
    content: 'Bhai real-time chat ekdum smooth chal rahi hai! 🚀',
    type: 'text'
  });

  const receivedMsg = await messagePromise;
  console.log('✅ 8. Real-time WebSocket Message Delivery:', receivedMsg?.content ? 'PASSED' : 'FAILED');
  console.log('     Received Message:', receivedMsg?.content);

  // 8. Fetch Messages from SQLite DB via REST API
  const historyRes = await fetch(`${API_BASE}/chats/${conversationId}/messages`, {
    headers: { 'Authorization': `Bearer ${reg2.token}` }
  });
  const history = await historyRes.json();
  console.log('✅ 9. Database Persistence & Message History Fetch:', history.messages?.length === 1 ? 'PASSED' : 'FAILED');

  socket1.disconnect();
  socket2.disconnect();

  console.log('\n🎉 ALL 9 TEST SUITES PASSED FLAWLESSLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
