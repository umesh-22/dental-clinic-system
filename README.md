# Dental Clinic Management System

A complete, production-ready dental clinic management system for **Mahesh Superspecialty Dental Clinic** located in Ashok Nagar, Ganjipeta, Krishna Nagar, Gadwal-509125, Telangana.

## Features

### Core Functionality

- **User Management**: Multi-role authentication (Admin, Doctor, Receptionist, Staff) with JWT-based auth
- **Patient Management**: Complete patient records with demographics, medical history, and document storage
- **Appointment Scheduling**: Multi-chair support (3 chairs) with 15-minute slots and conflict detection
- **Treatment Records**: Clinical notes with tooth number tracking (FDI notation)
- **Prescription Management**: Digital prescriptions with PDF generation
- **Billing & Invoicing**: Professional invoices with GST 18% support, multiple payment methods
- **Inventory Management**: Stock tracking with low stock alerts and expiry date tracking
- **Staff Attendance**: Clock in/out system with working hours calculation
- **Reports & Analytics**: Comprehensive dashboard with revenue, patient, and treatment analytics
- **Document Management**: X-ray, report, and photo storage with image viewer

## Technology Stack

### Backend
- Node.js with Express.js and TypeScript
- PostgreSQL with Prisma ORM
- JWT authentication with refresh tokens
- File upload with Multer
- PDF generation with PDFKit

### Frontend
- React 18 with TypeScript and Vite
- TailwindCSS with shadcn/ui components
- Zustand for client state management
- React Query for server state management
- React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+
- Docker and Docker Compose (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dental-clinic-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file (copy from .env.example)
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   
   # Seed database
   npm run prisma:seed
   
   # Start development server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create .env file
   echo "VITE_API_URL=http://localhost:5000/api" > .env
   
   # Start development server
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Prisma Studio: `cd backend && npm run prisma:studio`

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Default Credentials

After seeding the database, you can use these credentials:

- **Admin**: admin@clinic.com / admin123
- **Doctor**: doctor@clinic.com / doctor123
- **Receptionist**: receptionist@clinic.com / receptionist123

## Project Structure

```
dental-clinic-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── config/
│   │   └── server.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── lib/
│   │   └── main.tsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Patients
- `GET /api/patients` - List patients (with pagination and search)
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient (soft delete)

### Appointments
- `GET /api/appointments` - List appointments (with filters)
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update appointment
- `POST /api/appointments/:id/check-in` - Check in
- `POST /api/appointments/:id/check-out` - Check out
- `POST /api/appointments/:id/cancel` - Cancel appointment

### Treatments
- `GET /api/treatments` - List treatments
- `POST /api/treatments` - Create treatment
- `GET /api/treatments/:id` - Get treatment details
- `PUT /api/treatments/:id` - Update treatment
- `DELETE /api/treatments/:id` - Delete treatment

### Prescriptions
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions/:id` - Get prescription details
- `GET /api/prescriptions/:id/pdf` - Download prescription PDF
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `GET /api/invoices/:id/pdf` - Download invoice PDF

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/payments/:id` - Get payment details

### Inventory
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Create inventory item
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/:id` - Get item details
- `PUT /api/inventory/:id` - Update item
- `POST /api/inventory/:id/transaction` - Create transaction

### Attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance` - List attendance records
- `PUT /api/attendance/:userId/:date` - Update attendance

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/patients` - Patient analytics
- `GET /api/reports/doctors` - Doctor performance

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dental_clinic?schema=public"
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## Development

### Backend
```bash
cd backend
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run prisma:studio # Open Prisma Studio
```

### Frontend
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Production Deployment

1. Build both backend and frontend
2. Set up PostgreSQL database
3. Run migrations: `npm run prisma:migrate`
4. Set environment variables
5. Start services

Or use Docker Compose for easy deployment.

## License

ISC

## Support

For issues and questions, please contact the development team.
