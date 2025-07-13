require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Contact = require('./models/Contact');

const app = express();

// ✅ Allow your frontend domain only
app.use(cors({
  origin: 'https://www.exceptionz.in',
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// ✅ POST /api/contact
app.post('/api/contact', async (req, res) => {
  const { name, email, mobile, ask } = req.body;

  try {
    // ✅ Save contact to MongoDB
    await Contact.create({ name, email, mobile });

    // ✅ Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,     // e.g., exceptionz13@gmail.com
        pass: process.env.EMAIL_PASS,     // Gmail App Password
      },
    });

    // ✅ 1. Send welcome email to user
    const userMail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Exceptions!',
      html: `
        <h3>Hello ${name},</h3>
        <p>Thanks for contacting <strong>Exceptions</strong>!</p>
        <p>We're excited to connect and help with your tech journey.</p>
        ${ask ? `<hr/><h4>Your Question:</h4><p>${ask}</p>` : ''}
        <br/>
        <p>Best regards,<br/>Team Exceptions 🚀</p>
      `,
    };
    await transporter.sendMail(userMail);

    // ✅ 2. Send Ask Anything to internal team (FROM user's email via replyTo)
    if (ask) {
      const internalMail = {
        from: process.env.EMAIL_USER,  // still sent by server, but replyTo is user's
        to: process.env.EMAIL_USER,    // send to self (team inbox)
        subject: `❓ Question from ${name} (${email})`,
        replyTo: email,
        html: `
          <h3>${name} asked a question:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mobile:</strong> ${mobile}</p>
          <hr/>
          <p><strong>Question:</strong></p>
          <p>${ask}</p>
        `,
      };
      await transporter.sendMail(internalMail);
    }

    res.status(201).json({ message: 'Form submitted & emails sent!' });
  } catch (err) {
    console.error('❌ Error submitting contact:', err);
    res.status(500).json({ error: 'Server error. Try again later.' });
  }
});

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
