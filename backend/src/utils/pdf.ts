import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

export const generateInvoicePDF = async (invoice: any): Promise<string> => {
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
  const filePath = path.join(config.uploadDir, fileName);

  // Ensure directory exists
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.fontSize(20).text(config.clinicName, { align: 'center' });
  doc.fontSize(12).text(config.clinicAddress, { align: 'center' });
  doc.moveDown();

  // Invoice details
  doc.fontSize(16).text('INVOICE', { align: 'center' });
  doc.moveDown();

  // Invoice number and date
  doc.fontSize(10);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 150);
  doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50, 165);
  if (invoice.dueDate) {
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 180);
  }

  // Patient details
  doc.text('Bill To:', 350, 150);
  doc.text(`${invoice.patient.firstName} ${invoice.patient.lastName}`, 350, 165);
  if (invoice.patient.address) {
    doc.text(invoice.patient.address, 350, 180);
  }
  if (invoice.patient.phone) {
    doc.text(`Phone: ${invoice.patient.phone}`, 350, 195);
  }

  doc.moveDown(5);

  // Items table
  let y = 250;
  doc.fontSize(10);
  doc.text('Description', 50, y);
  doc.text('Qty', 300, y);
  doc.text('Unit Price', 350, y);
  doc.text('Total', 450, y);
  y += 20;

  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 10;

  invoice.items.forEach((item: any) => {
    doc.text(item.description, 50, y, { width: 240 });
    doc.text(item.quantity.toString(), 300, y);
    doc.text(`₹${Number(item.unitPrice).toFixed(2)}`, 350, y);
    doc.text(`₹${Number(item.total).toFixed(2)}`, 450, y);
    y += 20;
  });

  y += 10;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 20;

  // Totals
  doc.text(`Subtotal:`, 350, y);
  doc.text(`₹${Number(invoice.subtotal).toFixed(2)}`, 450, y);
  y += 15;

  if (invoice.discount > 0) {
    doc.text(`Discount:`, 350, y);
    doc.text(`₹${Number(invoice.discount).toFixed(2)}`, 450, y);
    y += 15;
  }

  doc.text(`Tax (${invoice.taxRate}%):`, 350, y);
  doc.text(`₹${Number(invoice.taxAmount).toFixed(2)}`, 450, y);
  y += 15;

  doc.fontSize(12).font('Helvetica-Bold');
  doc.text(`Total:`, 350, y);
  doc.text(`₹${Number(invoice.total).toFixed(2)}`, 450, y);
  y += 20;

  doc.fontSize(10).font('Helvetica');
  doc.text(`Paid: ₹${Number(invoice.paidAmount).toFixed(2)}`, 350, y);
  y += 15;
  doc.text(`Balance: ₹${(Number(invoice.total) - Number(invoice.paidAmount)).toFixed(2)}`, 350, y);

  // Footer
  doc.fontSize(8).text('Thank you for your business!', { align: 'center' }, doc.page.height - 50);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

export const generatePrescriptionPDF = async (prescription: any): Promise<string> => {
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `prescription-${prescription.id}-${Date.now()}.pdf`;
  const filePath = path.join(config.uploadDir, fileName);

  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.fontSize(20).text(config.clinicName, { align: 'center' });
  doc.fontSize(12).text(config.clinicAddress, { align: 'center' });
  doc.moveDown();

  // Prescription title
  doc.fontSize(16).text('PRESCRIPTION', { align: 'center' });
  doc.moveDown();

  // Date and patient details
  doc.fontSize(10);
  doc.text(`Date: ${new Date(prescription.date).toLocaleDateString()}`, 50, 150);
  doc.text(`Patient: ${prescription.patient.firstName} ${prescription.patient.lastName}`, 50, 165);
  if (prescription.patient.phone) {
    doc.text(`Phone: ${prescription.patient.phone}`, 50, 180);
  }

  doc.text(`Doctor: Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`, 350, 150);

  doc.moveDown(3);

  // Medications
  let y = 250;
  doc.fontSize(12).font('Helvetica-Bold').text('Medications:', 50, y);
  y += 25;

  doc.fontSize(10).font('Helvetica');
  prescription.items.forEach((item: any, index: number) => {
    doc.text(`${index + 1}. ${item.medicationName}`, 50, y);
    y += 15;
    doc.text(`   Dosage: ${item.dosage}`, 70, y);
    y += 15;
    doc.text(`   Frequency: ${item.frequency}`, 70, y);
    y += 15;
    doc.text(`   Duration: ${item.duration}`, 70, y);
    if (item.instructions) {
      y += 15;
      doc.text(`   Instructions: ${item.instructions}`, 70, y);
    }
    y += 20;
  });

  // Notes
  if (prescription.notes) {
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').text('Notes:', 50, y);
    y += 20;
    doc.fontSize(10).font('Helvetica').text(prescription.notes, 50, y, { width: 500 });
  }

  // Footer
  doc.fontSize(8).text('This is a computer-generated prescription.', { align: 'center' }, doc.page.height - 50);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};
