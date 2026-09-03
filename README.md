<div align="center">

<img src="https://github.com/NovidiaNews/NovidiaNews/blob/main/images/TW.png?raw=true" alt="Novidia Logo" width="1800"/>

# Novidia

A modern publishing platform built for Polish schools.

Students and teachers can create, publish, and share articles in a secure, privacy-focused environment designed specifically for education.

![License](https://img.shields.io/badge/license-Proprietary-red)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![Next.js](https://img.shields.io/badge/Next.js-black)
![Fastify](https://img.shields.io/badge/Fastify-green)

</div>

---

![Home Page](https://github.com/NovidiaNews/NovidiaNews/blob/main/images/Article.png?raw=true)

## Overview

Novidia is a modern journalism platform that enables schools to build their own online newspaper.

Designed with the Polish educational ecosystem in mind, the platform allows students to write articles, teachers to moderate content, and administrators to manage schools through an intuitive interface while maintaining a strong focus on privacy and security.

---

## Features

### Writing

- ✍️ Markdown-based article editor
- 📄 Drafts and publishing workflow
- 🕒 Article version history
- 🌍 Multi-language support
- 🎨 Light and dark themes

### Schools

- 🏫 School registration
- 🔍 RSPO integration
- ✅ School verification

### Administration

- 👥 User management
- 📝 Article moderation
- 📊 Analytics dashboard
- 🔒 Security monitoring

---

## Technology

### Frontend

- Next.js
- React
- Tailwind CSS
- Framer Motion

### Backend

- Fastify
- Prisma
- PostgreSQL

### Infrastructure

- Docker
- JWT Authentication
- OAuth2 (Google & Discord)
- SMTP Email
- Crowdin

---

## Getting Started

### Requirements

- Node.js 18+
- PostgreSQL
- npm or pnpm

### Clone the repositories

```bash
git clone git@github.com:NovidiaNews/backend.git
git clone git@github.com:NovidiaNews/frontend.git
```

### Backend

```bash
cd backend

npm install

cp .env.example .env

docker compose up -d

npx prisma migrate dev

npm run dev
```

### Frontend

```bash
cd frontend

npm install

cp .env.example .env.local

npm run dev
```

The frontend runs on **localhost:3000** and communicates with the backend running on **localhost:3001**.

---

## Configuration

Configuration is managed through environment variables.

Example configuration files are provided:

```
backend/.env.example
frontend/.env.local.example
```

---

## Security

Security is a core part of Novidia.

The platform includes:

- Secure authentication
- Password hashing using Argon2
- Rate limiting
- Content Security Policy
- Abuse protection
- Privacy-oriented account management

Security implementation details are intentionally omitted from this repository.

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/my-feature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push your branch

```bash
git push origin feature/my-feature
```

5. Open a Pull Request

---

## Roadmap

- [ ] Rich text editor
- [ ] Mobile application
- [ ] Notifications
- [ ] Federation between schools
- [ ] Public API

---

## License

This project is proprietary software.

All rights reserved.

---

<div align="center">

Built with ❤️ for Polish education.

**https://novidia.eu**

</div>
