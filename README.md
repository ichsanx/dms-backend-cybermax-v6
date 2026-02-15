# Document Management System (DMS) Backend  
**Technical Test Submission – Software Engineer (Mid-Level)**

Repository: https://github.com/ichsanx/dms-backend-cybermax

---

## Overview

This project is a backend implementation of a **Document Management System (DMS)** built with:

- **NestJS (TypeScript)**
- **Prisma ORM**
- **PostgreSQL**
- **JWT Authentication**
- **Role-Based Access Control** (USER / ADMIN)

It simulates a real enterprise workflow including approval processes and notifications.

> **Enterprise note:** The system emphasizes transactional consistency, role isolation, and workflow integrity.  
> Designed with scalability and microservice migration in mind.

---

## Features

### Authentication
- Register & Login (JWT)
- JWT-protected APIs
- Roles: **USER**, **ADMIN**

### Document Management
- Upload document
- List documents with **pagination + search**
- View document detail
- Replace document (**requires approval**)
- Delete document (**requires approval**)
- Version increment on replace
- Status: `ACTIVE`, `PENDING_DELETE`, `PENDING_REPLACE`

### Approval Workflow
- USER submits replace/delete request
- System creates permission request + notifies ADMIN
- Document is locked while pending
- ADMIN can **approve** or **reject**
- Transaction-safe approve/reject

### Notification System
- Stored in DB
- List notifications
- Mark as read
- Triggered on approval/rejection

---

## Project Structure (High-Level)

- `src/auth` → auth, jwt strategy, roles guard
- `src/documents` → documents CRUD + request replace/delete
- `src/approvals` → admin approve/reject workflows
- `src/notifications` → notifications APIs
- `src/prisma` → prisma module/service
- `prisma/` → schema + migrations + seeds

---

## How to Run (Local)

### Prerequisites
- Node.js 18+ (recommended)
- PostgreSQL

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dms_db"
JWT_SECRET="your_super_secret_key"
PORT=3000
```

### 3) Run migrations
```bash
npx prisma migrate dev
```

(Optional) Seed data if you have seed scripts:
```bash
npx prisma db seed
```

### 4) Start development server
```bash
npm run start:dev
```

Server runs on:
- `http://localhost:3000`
- Static uploads served at: `http://localhost:3000/uploads/<filename>` (dev convenience)

---

## API Endpoint Documentation

> Base URL: `http://localhost:3000`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (JWT required)

### Documents (JWT required)
- `GET /documents?q=&page=&limit=`
- `GET /documents/:id`
- `POST /documents` (multipart/form-data: `file`, plus `title`, `description`, `documentType`)
- `DELETE /documents/:id` (request delete → creates permission request)
- `POST /documents/:id/replace` (multipart/form-data: `file`, optional fields to update)

### Approvals (ADMIN only, JWT required)
- `GET /approvals/requests` (list pending requests)
- `POST /approvals/requests/:id/approve`
- `POST /approvals/requests/:id/reject`

### Notifications (JWT required)
- `GET /notifications` (list)
- `POST /notifications/:id/read` (mark as read)

---

## System Design Answers (Mid-Level)

### 1) Large file upload handling
- **Current:** Multer disk storage + file size limit (e.g., 10MB).
- **Scaling approach:** Use **streaming upload** to object storage (S3/MinIO). Prefer **pre-signed URLs** so the API does not proxy large payloads.
- Add antivirus scanning and content-type validation in async pipeline.

### 2) Lost update prevention (replace documents)
- Use **status locking** (`PENDING_REPLACE`) to block concurrent replace/delete.
- Use **transactions** for approve operations (document update + request status + notification).
- Add **optimistic concurrency** using `version` (or `updatedAt`) checks to reject stale updates.

### 3) Notification scalability
- **Current:** Store notifications in DB and query by user.
- **Scaling approach:** Publish events to a queue (Redis/Kafka/RabbitMQ) and process with workers.
- Separate notification service + WebSocket/SSE if needed.

### 4) File security
- Protect file operations via **JWT + RBAC**.
- Avoid direct public access; serve via **signed URL** or authenticated endpoint.
- Validate MIME type, sanitize names, enforce size limits.

### 5) Microservice migration strategy
- Modular design maps cleanly to services:
  - Auth Service, Document Service, Approval Service, Notification Service
- Introduce event bus + contracts to decouple.
- Extract persistence per service over time.

---

## Notes (Bahasa Indonesia)

- Workflow enterprise: **request → lock → approve/reject → notif**.
- Replace/Delete **tidak langsung dieksekusi**, harus disetujui ADMIN.
- Approve dilakukan dalam **transaction** supaya konsisten.

---

## Author
**Ichsan Saputra**
