# Setup Instructions

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install

# Copy environment file
# On Windows PowerShell:
Copy-Item env.example .env
# On Linux/Mac:
# cp env.example .env

# Edit .env with your database credentials:
# DATABASE_URL="postgresql://user:password@localhost:5432/dental_clinic?schema=public"
# JWT_SECRET=your-secret-key-here
# JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with initial data
npm run prisma:seed

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Copy environment file
# On Windows PowerShell:
Copy-Item env.example .env
# On Linux/Mac:
# cp env.example .env

# Start development server
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Prisma Studio: `cd backend && npm run prisma:studio`

## Default Login Credentials

After seeding:
- **Admin**: admin@clinic.com / admin123
- **Doctor**: doctor@clinic.com / doctor123
- **Receptionist**: receptionist@clinic.com / receptionist123

## Docker Setup (Alternative)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Project Status

### ✅ Completed Features

1. **Backend**
   - Complete database schema with Prisma
   - All API endpoints (auth, patients, appointments, treatments, prescriptions, invoices, payments, inventory, attendance, documents, reports)
   - JWT authentication with refresh tokens
   - File upload/download
   - PDF generation for invoices and prescriptions
   - Role-based access control
   - Audit logging

2. **Frontend**
   - Authentication (Login)
   - Dashboard with statistics
   - Patient management (CRUD)
   - Appointment scheduling with timeline view
   - UI components (shadcn/ui style)
   - Responsive layout

### 🚧 Remaining Frontend Pages

The following pages have route placeholders and can be built following the same pattern as Patients and Appointments:

- Treatments
- Prescriptions
- Invoices
- Payments
- Inventory
- Attendance
- Reports

All backend APIs are ready and functional. You can build these pages using the same patterns:
- React Query for data fetching
- React Hook Form with Zod validation
- Dialog modals for create/edit
- Tables for listing data

## Next Steps

1. Build remaining frontend pages following the Patients/Appointments pattern
2. Add more advanced features (search, filters, exports)
3. Enhance UI/UX with animations and transitions
4. Add unit and integration tests
5. Set up CI/CD pipeline
6. Deploy to production

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `createdb dental_clinic`

### Port Already in Use
- Change PORT in backend/.env
- Change port in frontend/vite.config.ts

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:migrate` to apply migrations
