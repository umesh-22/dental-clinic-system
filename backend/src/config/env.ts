import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  clinicName: process.env.CLINIC_NAME || 'Mahesh Superspecialty Dental Clinic',
  clinicAddress: process.env.CLINIC_ADDRESS || 'Ashok Nagar, Ganjipeta, Krishna Nagar, Gadwal-509125, Telangana',
  clinicCurrency: process.env.CLINIC_CURRENCY || 'INR',
  clinicTaxRate: parseFloat(process.env.CLINIC_TAX_RATE || '18'),
};
