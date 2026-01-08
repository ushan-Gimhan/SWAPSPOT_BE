// server.ts
import express, { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import cors from 'cors';

// Use the same interface as your frontend
export interface User {
  _id: string;
  fullName: string;
  email: string;
  roles?: string[];
  approved?: "APPROVED" | "PENDING" | "REJECTED";
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/reports/users', (req: Request<{}, {}, { users: User[] }>, res: Response) => {
  const { users } = req.body;

  // Create a new PDF document
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // HTTP Headers for file download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=User_Report.pdf');

  // Pipe the PDF stream to the response
  doc.pipe(res);

  // --- Title & Header ---
  doc.fillColor('#0f172a').fontSize(20).text('User Directory Report', { align: 'left' });
  doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()}`);
  doc.moveDown(2);

  // --- Table Headers ---
  const tableTop = 150;
  const col1 = 50;  // Identity
  const col2 = 200; // Email
  const col3 = 400; // Role
  const col4 = 480; // Approval Status

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#475569');
  doc.text('NAME', col1, tableTop);
  doc.text('EMAIL', col2, tableTop);
  doc.text('ROLE', col3, tableTop);
  doc.text('STATUS', col4, tableTop);
  
  // Horizontal Line
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#e2e8f0').stroke();

  // --- Table Body ---
  let currentY = tableTop + 25;
  doc.font('Helvetica').fontSize(10).fillColor('#1e293b');

  users.forEach((user) => {
    // Page breaking logic
    if (currentY > 750) {
      doc.addPage();
      currentY = 50;
    }

    doc.text(user.fullName, col1, currentY);
    doc.text(user.email, col2, currentY);
    doc.text(user.roles?.[0] || 'USER', col3, currentY);
    
    // Conditional styling for status
    const status = user.approved || 'PENDING';
    const color = status === 'APPROVED' ? '#10b981' : status === 'REJECTED' ? '#f43f5e' : '#f59e0b';
    
    doc.fillColor(color).text(status, col4, currentY).fillColor('#1e293b');

    currentY += 25; // Row spacing
  });

  doc.end();
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Report Server running on port ${PORT}`));