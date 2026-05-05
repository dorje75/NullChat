# nullChat

Private, encrypted chat rooms. No accounts. No logs. Messages disappear.

---

## What is this?

I built nullChat while learning how end-to-end encryption actually works. The idea was simple, a chat room you can share with one link, that leaves no trace when you're done. No signup, no message history, no server reading what you send.

Everything is encrypted in your browser before it goes anywhere. The server is just a relay — it passes along ciphertext it can't read.

---

## Why I made it

I kept reading about zero-knowledge architecture and wanted to actually implement it, not just understand it in theory. So I started building. Along the way I learned WebSockets, Redis, the Web Crypto API, and a lot about what "end-to-end encrypted" actually means under the hood.

The app is functional. You create a room, get a Room ID and an Access Key, share both with whoever you want to talk to, and the room deletes itself after 24 hours. The key never leaves your browser. The server never sees it.

---

## How it works

1. You create a room and get a Room ID + Access Key
2. The Access Key is hashed in your browser before anything is sent to the server
3. Your encryption key is derived from the Access Key using PBKDF2 (never sent anywhere)
4. Every message is encrypted with AES-GCM before leaving your device
5. The server receives ciphertext, passes it to the other person, and that's it
6. The room auto-deletes after 24 hours

The server is a zero-knowledge relay. It doesn't have the key, so it can't read the messages even if someone asked it to.

---

## Preview

![Home](./screenshots/home-page.png)
![Room Creation](./screenshots/home-page-roomGeneration.png)
![Chat](./screenshots/chat-preview.png)

---

## Demo

![Demo](./screenshots/demo.gif)

---

## Tech stack

Frontend: React 18, Vite, React Router, Web Crypto API, CSS Modules

Backend: Node.js, Fastify, WebSockets, Redis, JWT

---

## Getting started

Clone the repo:

```bash
git clone https://github.com/dorje75/NullChat.git
cd NullChat
```

Start Redis (requires Docker):

```bash
docker run -d --name nullchat-redis -p 6379:6379 redis:alpine
```

Install and run:

```bash
npm install
npm run install:all
npm run dev
```

---

## Environment variables

Backend:

```
JWT_SECRET=your-secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

Frontend:

```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## What's done and what isn't

Working:
- Real-time messaging over WebSockets
- End-to-end encryption (AES-GCM 256-bit)
- No accounts required
- Rooms expire after 24 hours
- QR code sharing
- Typing indicators
- Live participant count

Still to do:
- Rate limiting
- File sharing (encrypted)
- Redis Pub/Sub for horizontal scaling
- Delivery receipts
- PWA support

---

## Security notes

The access key never gets sent to the server in plaintext. Only a SHA-256 hash is stored, and even that is just used to verify you have the right key when joining. The encryption key itself is derived client-side and never transmitted. Each message uses a fresh random IV. None of the messages are written to a database.

I'm still learning a lot of this. If you spot something wrong with the security model please tell.
