import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {},
    create: {
      email: 'admin@clinic.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  // Create doctor user
  const doctorPassword = await hashPassword('doctor123');
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@clinic.com' },
    update: {},
    create: {
      email: 'doctor@clinic.com',
      password: doctorPassword,
      firstName: 'Mahesh',
      lastName: 'Doctor',
      role: UserRole.DOCTOR,
      phone: '+91 9876543210',
    },
  });

  // Create receptionist user
  const receptionistPassword = await hashPassword('receptionist123');
  const receptionist = await prisma.user.upsert({
    where: { email: 'receptionist@clinic.com' },
    update: {},
    create: {
      email: 'receptionist@clinic.com',
      password: receptionistPassword,
      firstName: 'Receptionist',
      lastName: 'User',
      role: UserRole.RECEPTIONIST,
    },
  });

  // Create clinic settings
  await prisma.clinicSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      clinicName: 'Mahesh Superspecialty Dental Clinic',
      address: 'Ashok Nagar, Ganjipeta, Krishna Nagar, Gadwal-509125, Telangana',
      currency: 'INR',
      taxRate: 18,
      chairCount: 3,
      slotDuration: 15,
      allowOverlap: true,
    },
  });

  // Create sample inventory items
  const inventoryItems = [
    {
      name: 'Dental Composite',
      description: 'Tooth-colored filling material',
      category: 'Restorative',
      unit: 'pack',
      currentStock: 50,
      minStockLevel: 10,
      unitPrice: 500,
    },
    {
      name: 'Local Anesthetic',
      description: 'Lidocaine 2%',
      category: 'Anesthesia',
      unit: 'vial',
      currentStock: 100,
      minStockLevel: 20,
      unitPrice: 150,
    },
    {
      name: 'Dental X-Ray Film',
      description: 'Intraoral X-ray film',
      category: 'Imaging',
      unit: 'box',
      currentStock: 5,
      minStockLevel: 10,
      unitPrice: 2000,
    },
  ];

  for (const item of inventoryItems) {
    await prisma.inventory.create({
      data: item,
    });
  }

  console.log('Seeding completed!');
  console.log('Admin credentials: admin@clinic.com / admin123');
  console.log('Doctor credentials: doctor@clinic.com / doctor123');
  console.log('Receptionist credentials: receptionist@clinic.com / receptionist123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
