const Ticket = require('../models/Ticket');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const qr = require('qrcode');
const nodemailer = require('nodemailer');

exports.createTicket = async (req, res) => {
  try {
    const { name, email, visitDate, numberOfVisitors, ticketNumber, visitingDate, numberOfChildren, numberOfMales, numberOfFemales, totalCharges } = req.body;

    const ticket = new Ticket({
      name,
      email,
      visitDate,
      numberOfVisitors,
      ticketNumber,
      visitingDate,
      numberOfChildren,
      numberOfMales,
      numberOfFemales,
      totalCharges,
      paymentStatus: true, 
      bookingDate: Date.now() 
    });

    await ticket.save();

   
    const qrData = JSON.stringify({
      name: ticket.name,
      ticketNumber: ticket.ticketNumber,
      visitDate: ticket.visitDate,
      numberOfVisitors: ticket.numberOfVisitors
     
    });

    const qrImagePath = `./tickets/${ticket.ticketNumber}-qr.png`;

    await new Promise((resolve, reject) => {
      qr.toFile(qrImagePath, qrData, (err) => {
        if (err) {
          console.error('Error generating QR code:', err);
          reject(err);
        } else {
          console.log('QR code generated successfully');
          resolve();
        }
      });
    });

  
    const pdfPath = `./tickets/${ticket.ticketNumber}.pdf`;
    const pdfDoc = new PDFDocument();
    const pdfStream = fs.createWriteStream(pdfPath);

    pdfDoc.pipe(pdfStream);

  
    pdfDoc.fontSize(16).text(`Ticket Information`, { align: 'center' });
    pdfDoc.text('------------------------------');
    pdfDoc.text(`Name: ${ticket.name}`);
    pdfDoc.text(`Ticket Number: ${ticket.ticketNumber}`);
    pdfDoc.text(`Visit Date: ${ticket.visitDate}`);
    pdfDoc.text(`Number of Visitors: ${ticket.numberOfVisitors}`);


   
    const qrImageBuffer = fs.readFileSync(qrImagePath);
    pdfDoc.image(qrImageBuffer, {
      fit: [150, 150],
      align: 'center',
      valign: 'center'
    });

    pdfDoc.end();

    // Send email with PDF attachment
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email, 
      subject: 'Ticket from heritage site',
      text: `
      Thank you for visiting our heritage site.
      We wish you a pleasant visit.
      Regards, 
      Heritage Site Team
      
      
      
      Please find your ticket attached.`,
      attachments: [{
        filename: `${ticket.ticketNumber}.pdf`,
        path: pdfPath
      }]
    };

    await transporter.sendMail(mailOptions);

    
    res.status(201).json({ message: 'Ticket created successfully and email sent', ticket });

  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getTicketByNumber = async (req, res) => {
  const ticketNumber = req.params.ticketNumber; 

  try {
    
    const ticket = await Ticket.findOne({ ticketNumber });

    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    
    res.status(200).json(ticket);
  } catch (error) {
   
    console.error('Error finding ticket:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.getTicketByNumber = async (req, res) => {
    const ticketNumber = req.params.ticketNumber; 
  
    try {
      
      const ticket = await Ticket.findOne({ ticketNumber });
  
     
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
  
      
      res.status(200).json(ticket);
    } catch (error) {
     
      console.error('Error finding ticket:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };
  