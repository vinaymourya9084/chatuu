# 💬 Chatuu — Real-Time Chat Web Application

Ek modern, sleek aur powerful **Real-Time Chat Web Application** jisme real users, real SQLite persistent database, live presence (online/offline indicators), typing indicators, custom profile builder, aur photo attachments sab integrated hain.

---

## ✨ Features

- 👤 **Real User Accounts & Auth**: Secure registration & login with Bcrypt password hashing & JWT tokens.
- 🗄️ **100% Real Persistent Database**: Powered by native SQLite (`chat.db`). All chats, media, users, and credentials persist permanently.
- ⚡ **Real-Time Socket Engine**: Instant messaging with zero refresh, room management, and read receipts.
- 🟢 **Live Online/Offline Presence**: Instant online/offline indicators with pulsing badges and last-seen activity timestamps.
- ✍️ **Live Typing Indicators**: Real-time "Ali is typing..." indicators with animated bouncing dots.
- 🖼️ **Image & Photo Sharing**: Upload photos directly from your device, preview before sending, and view full-size in a high-resolution lightbox with zoom and download.
- 🎨 **Profile Customization**: Customize display name, avatar (device upload or bot presets), custom status mood (e.g. `🟢 Available`, `🚀 Coding`, `☕ Coffee break`), and bio.
- 🔍 **User Discovery**: Instant search to find any friend by username/name and start 1-on-1 direct conversations.
- 🔔 **Subtle Audio Notifications**: Procedural notification chime using Web Audio API on receiving new messages.
- 📱 **Fully Responsive UI**: Dark luxury glassmorphic design that adapts seamlessly from mobile phones to ultra-wide screens.

---

## 🚀 How to Run the Project

### 1. Start the Backend Server
```bash
cd server
npm start
```
> Server runs on `http://localhost:5000`

### 2. Start the Frontend Client
In a second terminal:
```bash
cd client
npm run dev
```
> Frontend runs on `http://localhost:5173`

---

## 👥 How to Test Between Real Users

1. Open `http://localhost:5173` in your browser (e.g., Chrome).
2. Click **"Quick Autofill: User 1 (Rohan)"** or create a new account, then click **Sign In** (or **Create Account**).
3. Open an **Incognito / Private Window** (or a second browser like Edge/Firefox) and go to `http://localhost:5173`.
4. Click **"Quick Autofill: User 2 (Sameer)"** or create your friend's account, then click **Sign In** (or **Create Account**).
5. In Rohan's window, click the **"+" (Find People)** button, search for `Sameer`, and click **Chat**.
6. **Start chatting in real time**:
   - Send instant messages.
   - Start typing to see the live **"Rohan is typing..."** indicator.
   - Attach photos to see high-res image sharing.
   - Close one tab to see the live **Offline / Last seen** status update.
