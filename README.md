# 🔧 FixItNow - Home Service Marketplace API

<p align="center">
  <strong>Backend REST API for managing home services, technician bookings, and secure payments.</strong>
</p>

---

# 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Prerequisites](#-prerequisites)
- [Quick Start / Installation](#-quick-start--installation)
- [Environment Variables](#-environment-variables)
- [Database Schema Overview](#-database-schema-overview)
- [Running the Project](#-running-the-project)
- [API Documentation](#-api-documentation)
  - [Authentication](#1-authentication)
  - [Categories](#2-categories-public--admin)
  - [Services](#3-services-public--technician)
  - [Technicians](#4-technicians-public--profile)
  - [Bookings](#5-bookings-core-flow)
  - [Payments](#6-payments-stripe-integration-)
  - [Reviews](#7-reviews)
  - [Admin Panel](#8-admin-panel)
- [Default Admin Credentials](#-default-admin-credentials)
- [Project Architecture](#-project-architecture)
- [Key Design Decisions](#-key-design-decisions)
- [Author](#-author)

---

# 🚀 Project Overview

**FixItNow** is a scalable backend REST API that connects customers looking for home services with skilled technicians.

The system manages the complete service lifecycle—from user registration and authentication to booking, payment, job completion, and customer reviews.

The application follows a **Modular Monolith Architecture** using **Express.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**, while implementing secure authentication, role-based authorization, booking management, and Stripe payment integration.

---

# ⚙️ Tech Stack

| Technology | Usage |
|------------|-------|
| Node.js | Runtime Environment |
| Express.js | Web Framework |
| TypeScript | Type Safety |
| PostgreSQL | Database |
| Prisma ORM | Database ORM |
| Zod | Request Validation |
| JWT | Authentication |
| Stripe | Payment Gateway |
| Bcrypt | Password Hashing |

---

# ✨ Key Features

- 🔐 JWT Authentication
- 👥 Role-Based Access Control (Customer, Technician, Admin)
- 🛠 Service Category Management
- 🔎 Service Search & Filtering
- 👨‍🔧 Technician Profile Management
- 📅 Smart Booking System
- 💳 Stripe Payment Integration
- ⭐ Customer Reviews
- 📊 Admin  APIs
- ✅ Zod  Validation
- 🚨 Global Error Handling
- 🧾 Consistent API Response Format
- 🗃 Prisma Transactions for Critical Operations

---

# 📋 Prerequisites

Before running this project locally, make sure you have installed:

- Node.js (v18 or later)
- npm or yarn
- PostgreSQL
- Git
- Stripe Account (Test Mode)

---

# 🛠 Quick Start / Installation

## 1. Clone Repository

```bash
git clone <https://github.com/sakimuzzaman/fixitnow-backendl>
```

```bash
cd fixitnow-backend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the project root.

---

## 4. Run Database Migration

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client

```bash
npx prisma generate
```

---

## 5. Seed Admin User

```bash
npm run seed:admin
```

---

## 6. Run Development Server

```bash
npm run dev
```

Server will run at

```
http://localhost:5000
```

---

# 🔐 Environment Variables

Create a `.env` file and copy the following:

```env
# Application
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/fixitnow?schema=public"

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Password Encryption
BCRYPT_SALT_ROUNDS=12

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend
CLIENT_URL=http://localhost:3000
```

---

# 🗄 Database Schema Overview

The application contains the following primary models:

- **Users**
- **Technician Profiles**
- **Categories**
- **Services**
- **Bookings**
- **Payments**
- **Reviews**

### Relationship Overview

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── config/                # Global configs (DB, JWT)
├── middlewares/           # Reusable logic (Auth, Error Handling, Validation)
│   ├── auth.ts            # JWT verification middleware
│   ├── validateRequest.ts # Zod schema validator
│   └── globalErrorHandler.ts # Structured error response formatter
├── modules/               # Business Logic (Feature-based)
│   ├── auth/
│   │   ├── auth.route.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.validation.ts
│   ├── technician/
│   ├── booking/
│   ├── payment/
│   └── ... (other features)
└── utils/
```

---

# ▶️ Running the Project

Development Mode

```bash
npm run dev
```

Production Build

```bash
npm run build
```

Run Production Server

```bash
npm start
```

---

# 🌐 API Documentation

Base URL

```
http://localhost:5000/api
```

---

# 1. Authentication

Handles registration, login and user profile.

| Method | Endpoint | Authentication |
|---------|----------|---------------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| GET | `/auth/me` | JWT |

### Register Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123",
  "role": "CUSTOMER"
}
```

---

# 2. Categories (Public & Admin)

| Method | Endpoint | Role |
|---------|----------|------|
| GET | `/categories` | Public |
| POST | `/categories` | Admin |

---

# 3. Services (Public & Technician)

| Method | Endpoint |
|---------|----------|
| GET | `/services` |
| GET | `/services/my-services` |
| POST | `/services` |
| PATCH | `/services/:id` |
| DELETE | `/services/:id` |

### Available Filters

```
?category=plumbing
```

```
?location=Dhaka
```

```
?minPrice=500
```

```
?maxPrice=2000
```

```
?search=leak
```

---

# 4. Technicians (Public & Profile)

| Method | Endpoint |
|---------|----------|
| GET | `/technicians` |
| GET | `/technicians/:id` |
| PUT | `/technician/profile` |
| PUT | `/technician/availability` |

---

# 5. Bookings (Core Flow)

Booking Status Flow

```
REQUESTED
      ↓
ACCEPTED
      ↓
PAID
      ↓
IN_PROGRESS
      ↓
COMPLETED
```

| Method | Endpoint |
|---------|----------|
| POST | `/bookings` |
| GET | `/bookings` |
| GET | `/bookings/technician` |
| PATCH | `/bookings/:id/status` |
| PATCH | `/bookings/:id/cancel` |

---

# 6. Payments (Stripe Integration) ⚡

| Method | Endpoint |
|---------|----------|
| POST | `/payments/create` |
| POST | `/payments/confirm` |
| GET | `/payments` |
| POST | `/payments/webhook` |

Payment Flow

```
Customer
      │
      ▼
Create Booking
      │
      ▼
Create Payment Intent
      │
      ▼
Stripe Checkout
      │
      ▼
Payment Success
      │
      ▼
Webhook Verification
      │
      ▼
Booking Status Updated
```

---

# 7. Reviews

| Method | Endpoint |
|---------|----------|
| POST | `/reviews` |

Customers can submit ratings and comments after the booking has been completed.

---

# 8. Admin Panel

| Method | Endpoint |
|---------|----------|
| GET | `/admin/users` |
| PATCH | `/admin/users/:id` |
| GET | `/admin/bookings` |

---

# 👤 Default Admin Credentials

After running

```bash
npm run seed:admin
```

Login using

**Email**

```
admin@fixitnow.com
```

**Password**

```
Admin12345
```

---

# 🏗 Project Architecture

```
src
│
├── app.ts
├── server.ts
│
├── config
│   ├── index.ts
│   ├── prisma.ts
│   └── stripe.ts
│
├── middlewares
│   ├── auth.ts
│   ├── validateRequest.ts
│   ├── globalErrorHandler.ts
│   └── notFound.ts
│
├── modules
│   ├── auth
│   ├── admin
│   ├── category
│   ├── service
│   ├── technician
│   ├── booking
│   ├── payment
│   └── review
│
├── routes
│
├── utils
│
└── generated
    └── prisma
```

---

# 💡 Key Design Decisions

### ✅ Zod Validation

Every incoming request is validated before reaching the service layer.

---

### ✅ Prisma Transactions

Critical operations such as payment confirmation and review creation use Prisma Transactions to ensure database consistency.

---

### ✅ Role-Based Authorization

Protected routes ensure that only authorized users can access specific resources.

- Customer
- Technician
- Admin

---

### ✅ Global Error Handler

Every API returns a consistent response structure.

```json
{
  "success": false,
  "message": "Something went wrong",
  "errorDetails": {}
}
```

---

### ✅ Modular Monolith Architecture

The project is organized by features, making it easy to scale and maintain.

---

# 📌 API Response Format

Successful Response

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

Error Response

```json
{
  "success": false,
  "message": "Validation Error",
  "errorDetails": {}
}
```

---

# 👨‍💻 Author

**Md. Sakimuzzaman**

Backend Developer | TypeScript | Node.js | Express.js | Prisma | PostgreSQL

---

# ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub.

