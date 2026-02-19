import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './utils/errors';
import { auditLog } from './middleware/audit';

// Routes
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import treatmentRoutes from './routes/treatment.routes';
import prescriptionRoutes from './routes/prescription.routes';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import inventoryRoutes from './routes/inventory.routes';
import attendanceRoutes from './routes/attendance.routes';
import documentRoutes from './routes/document.routes';
import reportRoutes from './routes/report.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [config.frontendUrl,'https://dental-clinic-system-five.vercel.app'],
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit logging
app.use(auditLog);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);

// Serve uploaded files
app.use('/uploads', express.static(config.uploadDir));

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
