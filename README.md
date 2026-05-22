# Internal Company Management System

A full-stack monorepo application for internal company management, including an API, Web Admin Dashboard, and Mobile App.

## Architecture
- **Monorepo**: npm workspaces
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Web Admin**: Next.js, TypeScript, TailwindCSS, shadcn/ui
- **Mobile App**: Expo (React Native), TypeScript, Expo Router
- **Shared Package**: Shared TypeScript types and constants

## Project Structure
```
internal-company-app/
├── apps/
│   ├── api/          # Express API
│   ├── web-admin/    # Next.js Dashboard
│   └── mobile/       # Expo Mobile App
├── packages/
│   └── shared/       # Shared types & enums
├── docker-compose.yml
└── README.md
```

## Getting Started

### 1. Installation
Run the following command in the root directory to install dependencies for all packages:
```bash
npm install
```

### 2. Database Setup
Start the PostgreSQL database using Docker:
```bash
docker compose up -d
```
*Note: The default port is mapped to `5433` to avoid conflicts.*

### 3. Backend API
Navigate to the API directory, setup the environment, and run migrations:
```bash
cd apps/api
# Copy .env (if not already there)
# npx prisma db push
# npx prisma db seed
npm run dev
```
**Default Admin Account:**
- Email: `admin@example.com`
- Password: `123456`

### 4. Web Admin
Navigate to the web-admin directory and start the development server:
```bash
cd apps/web-admin
npm run dev
```
Access at `http://localhost:3000`

### 5. Mobile App
Navigate to the mobile directory and start Expo:
```bash
cd apps/mobile
npx expo start
```

## Features Implemented
- [x] JWT Authentication & Role-based Access Control
- [x] User & Role Management
- [x] Department & Employee Management
- [x] Customer & Lead Tracking
- [x] Task Management with Status/Priority
- [x] Support Ticket System
- [x] Activity Logs & Dashboard Summary
- [x] Responsive Web Dashboard (shadcn/ui)
- [x] Mobile App for Employees (Expo Router)

## License
MIT
