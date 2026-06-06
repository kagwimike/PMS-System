🏢 PMS Pro — Property Management System

Effortless Property Management for Owners, Tenants & Administrators

PMS Pro is a full-stack property management platform built with Django (DRF) + React, designed to streamline property operations including leases, inspections, maintenance, vendors, and real-time notifications.

🚀 Tech Stack
🖥 Frontend

React.js

React Router

Axios (with JWT interceptors)

CSS (Modular styling)

WebSockets (Real-time notifications)

⚙ Backend

Django

Django REST Framework (DRF)

SimpleJWT (Authentication)

Django Channels (WebSockets)

PostgreSQL / SQLite (Dev)

ASGI (for WebSocket support)

🏗 System Architecture
React Frontend
      ↓
JWT Authentication
      ↓
Django REST API
      ↓
Database
      ↓
Django Channels (WebSockets)
      ↓
Real-time Notifications
🔐 Authentication Blueprint (Auth v2 Implemented)
✅ Implemented

JWT Authentication (Access + Refresh Tokens)

Axios Request Interceptors

Automatic Token Refresh

Role-Based Route Protection

Protected Dashboards (Admin / Owner / Tenant)

Auto Logout on Refresh Failure

🔄 Flow

User logs in → receives access + refresh

Access token stored in localStorage

Axios attaches Authorization: Bearer <token>

If 401 → auto refresh token

If refresh fails → forced logout

👥 Role System
Role	Capabilities
ADMIN	Full system access
OWNER	Manage properties, leases, inspections, vendors
TENANT	View leases, submit maintenance requests

Route protection enforced via ProtectedRoute.

🏠 Core Modules Implemented
1️⃣ Properties

Add properties (Owner/Admin)

View property listings

2️⃣ Leases

Create lease

Assign tenant

Lease dashboard

3️⃣ Inspections

Create inspection

Record damages

Deposit summary tracking

4️⃣ Maintenance System

Create maintenance request

Track request status

Vendor assignment

Owner/Admin request creation

Tenant request submission

5️⃣ Vendor Management

Add vendors

Assign vendors to maintenance requests

6️⃣ Notifications (Real-Time)

WebSocket-based

Notification bell in Navbar

Unread counter

Live updates without refresh

Powered by:

Django Channels

WebSocket token authentication

🌐 Frontend Features

Responsive Navbar

Sidebar Dashboard

Notification dropdown

Role-based UI rendering

About Page

Contact Page

Professional Footer

📦 Deployment Blueprint
Backend

ASGI compatible (for WebSockets)

Ready for:

Railway

Render

DigitalOcean

AWS

Frontend

Deployable on:

Vercel (Root Directory: frontend)

Netlify

📁 Project Structure
PMS-System/
│
├── backend/
│   ├── accounts/
│   ├── properties/
│   ├── maintenance/
│   ├── inspections/
│   ├── notifications/
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api.js
│   │   └── App.js
│   └── package.json
│
└── README.md
📡 Real-Time Notification Blueprint
Trigger Sources:

Maintenance request created

Vendor assigned

Inspection updates

Flow:

Backend saves notification

Django Channels sends WebSocket event

Frontend WebSocket listener updates UI

Navbar unread counter refreshes

🧪 Current Development Stage
✅ Completed

Full JWT Auth v2

Role-based dashboards

Maintenance module

Vendor management

Inspection system

Real-time notifications

Footer & About page

Deployment-ready frontend

🚧 Upcoming Features (Roadmap)
🔐 Security Improvements

HttpOnly cookie authentication

CSRF hardening

Production CORS configuration

Environment variable config

💳 Payments Module

Rent payment tracking

M-Pesa / Stripe integration

Invoice generation

Late fee automation

📊 Analytics Dashboard

Occupancy rate tracking

Monthly revenue stats

Maintenance cost breakdown

Owner reporting system

📱 Mobile Optimization

Fully responsive dashboards

PWA capability

📑 Document Management

Lease document upload

Tenant agreements

Digital signatures

📬 Email & SMS Integration

Automated lease reminders

Maintenance updates via email

Tenant notifications

🏢 Multi-Property Scaling

Multi-owner support

Portfolio overview

Admin system control panel

🧠 Technical Highlights

Clean separation of concerns (API / Frontend)

Token lifecycle management

WebSocket authentication

Modular app architecture

Scalable backend design

Production-ready authentication logic

🛠 Local Development Setup
Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
Frontend
cd frontend
npm install
npm start
🔮 Vision

PMS Pro aims to become a scalable, enterprise-ready property management platform tailored for:

Independent landlords

Property management companies

Real estate agencies

Multi-property enterprises

📌 Status

🟢 Actively in Development
🟢 Authentication Stable
🟢 Real-Time Notifications Operational
🟡 Payments Module Pending
🟡 Production Deployment Finalization

👨‍💻 Author

Built with focus on clean architecture, security, and scalability.
