const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const ReminderSchedule = require('../models/ReminderSchedule');
const PDFDocument = require('pdfkit');

// Helper: format date
const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Helper: format currency
const formatCurrency = (amt) => {
  return '₹' + Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Export backup as PDF
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const customers = await Customer.find({ user_id: userId }).lean();
    const transactions = await Transaction.find({ user_id: userId }).sort({ date: -1 }).lean();
    const reminders = await ReminderSchedule.find({ user_id: userId }).lean();

    const filename = `smartkhata_backup_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Colors
    const purple = '#7C3AED';
    const darkGray = '#1F2937';
    const medGray = '#4B5563';
    const lightGray = '#9CA3AF';
    const green = '#059669';
    const red = '#DC2626';
    const blue = '#2563EB';
    const bgLight = '#F9FAFB';

    // ===== HEADER =====
    doc.rect(0, 0, doc.page.width, 120).fill('#7C3AED');
    doc.fontSize(28).fillColor('#FFFFFF').text('SmartKhata', 50, 35, { align: 'center' });
    doc.fontSize(12).fillColor('#E9D5FF').text('Backup Report', 50, 70, { align: 'center' });
    doc.fontSize(10).fillColor('#C4B5FD').text(`Generated: ${formatDate(new Date())}`, 50, 90, { align: 'center' });

    doc.moveDown(3);

    // ===== USER INFO =====
    doc.y = 140;
    doc.rect(50, doc.y, doc.page.width - 100, 50).fill(bgLight).stroke('#E5E7EB');
    doc.fontSize(11).fillColor(darkGray).text(`User: ${req.user.name}`, 65, doc.y + 10);
    doc.fontSize(10).fillColor(medGray).text(`Phone: ${req.user.phone}`, 65, doc.y + 5);
    doc.y += 60;

    // ===== SUMMARY =====
    let totalOutstanding = 0;
    const customerBalances = {};
    for (const c of customers) {
      const custTxns = transactions.filter(t => t.customer_id.toString() === c._id.toString());
      const credit = custTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
      const debit = custTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
      const balance = credit - debit;
      customerBalances[c._id.toString()] = balance;
      totalOutstanding += balance;
    }

    doc.moveDown(0.5);
    doc.fontSize(16).fillColor(purple).text('Summary', { underline: false });
    doc.moveDown(0.3);

    const summaryY = doc.y;
    const colW = (doc.page.width - 100) / 4;

    // Summary boxes
    const boxes = [
      { label: 'Total Customers', value: customers.length.toString(), color: purple },
      { label: 'Total Outstanding', value: formatCurrency(totalOutstanding), color: totalOutstanding >= 0 ? red : green },
      { label: 'Total Credit Given', value: formatCurrency(transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)), color: red },
      { label: 'Total Payment Received', value: formatCurrency(transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)), color: green }
    ];

    boxes.forEach((box, i) => {
      const x = 50 + i * colW;
      doc.rect(x, summaryY, colW - 5, 55).fill(bgLight).stroke('#E5E7EB');
      doc.fontSize(8).fillColor(lightGray).text(box.label, x + 8, summaryY + 8, { width: colW - 20 });
      doc.fontSize(12).fillColor(box.color).text(box.value, x + 8, summaryY + 25, { width: colW - 20 });
    });

    doc.y = summaryY + 70;

    // ===== CUSTOMERS LIST =====
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor(purple).text('Customers');
    doc.moveDown(0.3);

    // Table header
    const tableX = 50;
    let tableY = doc.y;
    doc.rect(tableX, tableY, doc.page.width - 100, 22).fill('#7C3AED');
    doc.fontSize(9).fillColor('#FFFFFF');
    doc.text('S.No', tableX + 5, tableY + 6, { width: 35 });
    doc.text('Name', tableX + 45, tableY + 6, { width: 150 });
    doc.text('Phone', tableX + 200, tableY + 6, { width: 110 });
    doc.text('Balance', tableX + 315, tableY + 6, { width: 100, align: 'right' });
    tableY += 22;

    customers.forEach((c, i) => {
      if (tableY > doc.page.height - 80) {
        doc.addPage();
        tableY = 50;
      }
      const balance = customerBalances[c._id.toString()] || 0;
      const rowBg = i % 2 === 0 ? '#FFFFFF' : bgLight;
      doc.rect(tableX, tableY, doc.page.width - 100, 20).fill(rowBg);
      doc.fontSize(9).fillColor(darkGray);
      doc.text(`${i + 1}`, tableX + 5, tableY + 5, { width: 35 });
      doc.text(c.name, tableX + 45, tableY + 5, { width: 150 });
      doc.text(c.phone, tableX + 200, tableY + 5, { width: 110 });
      doc.fontSize(9).fillColor(balance > 0 ? red : balance < 0 ? green : darkGray);
      doc.text(formatCurrency(Math.abs(balance)) + (balance > 0 ? ' DR' : balance < 0 ? ' CR' : ''), tableX + 315, tableY + 5, { width: 100, align: 'right' });
      tableY += 20;
    });

    doc.y = tableY + 10;

    // ===== TRANSACTIONS =====
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }

    doc.moveDown(0.5);
    doc.fontSize(16).fillColor(purple).text('Transactions');
    doc.moveDown(0.3);

    tableY = doc.y;
    doc.rect(tableX, tableY, doc.page.width - 100, 22).fill('#7C3AED');
    doc.fontSize(9).fillColor('#FFFFFF');
    doc.text('Date', tableX + 5, tableY + 6, { width: 75 });
    doc.text('Customer', tableX + 85, tableY + 6, { width: 130 });
    doc.text('Type', tableX + 220, tableY + 6, { width: 60 });
    doc.text('Note', tableX + 285, tableY + 6, { width: 100 });
    doc.text('Amount', tableX + 390, tableY + 6, { width: 80, align: 'right' });
    tableY += 22;

    transactions.forEach((t, i) => {
      if (tableY > doc.page.height - 60) {
        doc.addPage();
        tableY = 50;
      }
      const customer = customers.find(c => c._id.toString() === t.customer_id.toString());
      const rowBg = i % 2 === 0 ? '#FFFFFF' : bgLight;
      doc.rect(tableX, tableY, doc.page.width - 100, 20).fill(rowBg);
      doc.fontSize(8).fillColor(darkGray);
      doc.text(formatDate(t.date), tableX + 5, tableY + 5, { width: 75 });
      doc.text(customer ? customer.name : 'Unknown', tableX + 85, tableY + 5, { width: 130 });
      doc.fontSize(8).fillColor(t.type === 'credit' ? red : green);
      doc.text(t.type === 'credit' ? 'Credit' : 'Payment', tableX + 220, tableY + 5, { width: 60 });
      doc.fontSize(8).fillColor(medGray);
      doc.text(t.note || '-', tableX + 285, tableY + 5, { width: 100 });
      doc.fontSize(8).fillColor(t.type === 'credit' ? red : green);
      doc.text(formatCurrency(t.amount), tableX + 390, tableY + 5, { width: 80, align: 'right' });
      tableY += 20;
    });

    doc.y = tableY + 10;

    // ===== REMINDERS =====
    if (reminders.length > 0) {
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }

      doc.moveDown(0.5);
      doc.fontSize(16).fillColor(purple).text('Reminders');
      doc.moveDown(0.3);

      tableY = doc.y;
      doc.rect(tableX, tableY, doc.page.width - 100, 22).fill('#7C3AED');
      doc.fontSize(9).fillColor('#FFFFFF');
      doc.text('Customer', tableX + 5, tableY + 6, { width: 150 });
      doc.text('Frequency', tableX + 160, tableY + 6, { width: 100 });
      doc.text('Time', tableX + 265, tableY + 6, { width: 80 });
      doc.text('Status', tableX + 350, tableY + 6, { width: 80 });
      tableY += 22;

      reminders.forEach((r, i) => {
        if (tableY > doc.page.height - 60) {
          doc.addPage();
          tableY = 50;
        }
        const customer = customers.find(c => c._id.toString() === r.customer_id.toString());
        const rowBg = i % 2 === 0 ? '#FFFFFF' : bgLight;
        doc.rect(tableX, tableY, doc.page.width - 100, 20).fill(rowBg);
        doc.fontSize(9).fillColor(darkGray);
        doc.text(customer ? customer.name : 'Unknown', tableX + 5, tableY + 5, { width: 150 });
        doc.text(r.frequency, tableX + 160, tableY + 5, { width: 100 });
        doc.text(r.time_of_day, tableX + 265, tableY + 5, { width: 80 });
        doc.fontSize(9).fillColor(r.active ? green : lightGray);
        doc.text(r.active ? 'Active' : 'Inactive', tableX + 350, tableY + 5, { width: 80 });
        tableY += 20;
      });

      doc.y = tableY + 10;
    }

    // ===== FOOTER =====
    if (doc.y > doc.page.height - 80) {
      doc.addPage();
    }
    doc.moveDown(2);
    doc.rect(50, doc.y, doc.page.width - 100, 0.5).fill(lightGray);
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(lightGray).text('This is a computer-generated backup report from SmartKhata.', { align: 'center' });
    doc.text('SmartKhata - Digital Ledger for Your Business', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Backup export error:', error);
    res.status(500).json({ error: 'Backup export failed' });
  }
});

// Import backup - restore data from JSON
router.post('/import', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { backupData } = req.body;

    if (!backupData || !backupData.customers) {
      return res.status(400).json({ error: 'Invalid backup data' });
    }

    let imported = { customers: 0, transactions: 0, reminders: 0 };

    // Import customers
    const customerMap = {}; // old phone -> new customer id
    for (const cust of backupData.customers) {
      // Check if customer already exists
      let existing = await Customer.findOne({ user_id: userId, phone: cust.phone });
      if (!existing) {
        existing = new Customer({
          user_id: userId,
          name: cust.name,
          phone: cust.phone,
          createdAt: cust.createdAt || new Date()
        });
        await existing.save();
        imported.customers++;
      }
      customerMap[cust.phone] = existing._id;
    }

    // Import transactions
    if (backupData.transactions && backupData.transactions.length > 0) {
      for (const txn of backupData.transactions) {
        const customerId = customerMap[txn.customerPhone];
        if (!customerId) continue;

        // Check for duplicate transaction
        const exists = await Transaction.findOne({
          user_id: userId,
          customer_id: customerId,
          amount: txn.amount,
          type: txn.type,
          date: new Date(txn.date)
        });

        if (!exists) {
          await new Transaction({
            user_id: userId,
            customer_id: customerId,
            amount: txn.amount,
            type: txn.type,
            note: txn.note || '',
            date: new Date(txn.date)
          }).save();
          imported.transactions++;
        }
      }
    }

    // Import reminders
    if (backupData.reminders && backupData.reminders.length > 0) {
      for (const rem of backupData.reminders) {
        const customerId = customerMap[rem.customerPhone];
        if (!customerId) continue;

        const exists = await ReminderSchedule.findOne({
          user_id: userId,
          customer_id: customerId,
          frequency: rem.frequency
        });

        if (!exists) {
          await new ReminderSchedule({
            user_id: userId,
            customer_id: customerId,
            frequency: rem.frequency,
            day_of_week: rem.day_of_week,
            time_of_day: rem.time_of_day,
            active: rem.active !== undefined ? rem.active : true
          }).save();
          imported.reminders++;
        }
      }
    }

    res.json({
      message: 'Backup imported successfully',
      imported
    });
  } catch (error) {
    console.error('Backup import error:', error);
    res.status(500).json({ error: 'Backup import failed' });
  }
});

module.exports = router;
