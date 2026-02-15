# 📄 Document Management System (DMS) Backend

**Technical Test Submission -- Software Engineer (Mid-Level)**

Repository: https://github.com/ichsanx/dms-backend-cybermax

------------------------------------------------------------------------

## 🧩 Overview

This project is a backend implementation of a **Document Management
System (DMS)** built with:

-   **NestJS (TypeScript)**
-   **Prisma ORM**
-   **PostgreSQL**
-   **JWT Authentication**
-   **Role-Based Access Control (USER / ADMIN)**

The system simulates a real enterprise document workflow including
approval processes, transactional safety, and notification handling.

> **Enterprise Perspective:**\
> The system emphasizes transactional consistency, workflow integrity,
> proper role isolation, and is designed with scalability and
> microservice migration in mind.

------------------------------------------------------------------------

# 🏗 Architecture Overview

User → Auth → Document → Approval → Notification

### Replace/Delete Workflow

User requests replace/delete\
↓\
Create approval request\
↓\
Lock document (PENDING state)\
↓\
Admin approves/rejects\
↓\
Execute transaction:\
- Update document\
- Update approval status\
- Create notification\
↓\
Notify user

------------------------------------------------------------------------

# 🚀 Features

## 🔐 Authentication

-   Register & Login (JWT)
-   JWT-protected APIs
-   Role-based access control (USER / ADMIN)

## 📂 Document Management

-   Upload document
-   List documents with pagination & search
-   View document detail
-   Replace document (requires approval)
-   Delete document (requires approval)
-   Automatic version increment on replace
-   Status: ACTIVE, PENDING_DELETE, PENDING_REPLACE

## 🧾 Approval Workflow

-   USER submits replace/delete request
-   System creates approval request
-   Document is locked while pending
-   ADMIN can approve or reject
-   Approval handled using database transactions
-   Notification automatically triggered

## 🔔 Notification System

-   Stored in database
-   List notifications per user
-   Mark notification as read

------------------------------------------------------------------------

# 🛠 How to Run (Local Development)

## Prerequisites

-   Node.js 18+
-   PostgreSQL

### 1) Install Dependencies

npm install

### 2) Configure Environment

Create a `.env` file:

DATABASE_URL="postgresql://postgres:password@localhost:5432/dms_db"\
JWT_SECRET="your_super_secret_key"\
PORT=3000

### 3) Run Prisma Migration

npx prisma migrate dev

(Optional) Seed database: npx prisma db seed

### 4) Start Development Server

npm run start:dev

Server runs at: http://localhost:3000

------------------------------------------------------------------------

# 🐳 Running with Docker (Optional)

docker-compose up --build

------------------------------------------------------------------------

# 📡 API Documentation

Base URL: http://localhost:3000

## Auth

-   POST /auth/register
-   POST /auth/login
-   GET /auth/me

## Documents (JWT required)

-   GET /documents?q=&page=&limit=
-   GET /documents/:id
-   POST /documents (multipart/form-data)
-   DELETE /documents/:id
-   POST /documents/:id/replace

## Approvals (ADMIN only)

-   GET /approvals/requests
-   POST /approvals/requests/:id/approve
-   POST /approvals/requests/:id/reject

## Notifications

-   GET /notifications
-   POST /notifications/:id/read

------------------------------------------------------------------------

# 🧠 System Design Considerations

## Large File Upload Handling

-   Multer disk storage (current)
-   File size limit
-   Scaling: Streaming to S3/MinIO + pre-signed URLs

## Lost Update Prevention

-   Status locking
-   Database transactions
-   Optimistic concurrency control (version field)

## Notification Scalability

-   Current: Stored in DB
-   Scaling: Message queue + workers + WebSocket/SSE

## File Security

-   JWT + RBAC
-   Signed URL or authenticated endpoint
-   MIME validation + filename sanitization

## Microservice Migration Strategy

-   Modular structure
-   Event-driven communication
-   Extract services gradually

------------------------------------------------------------------------

# 👤 Author

Ichsan Saputra
