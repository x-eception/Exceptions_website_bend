require('dotenv').config(); // 1) Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Contact = require('./models/Contact');

const app = express();

// 2) Middleware
app.use(cors({
  origin: 'https://www.exceptionz.in',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// 3) POST route for contact form
app.post('/api/contact', async (req, res) => {
  const { name, email, mobile } = req.body;

  try {
    // a) Save to MongoDB
    await Contact.create({ name, email, mobile });

    // b) Send welcome email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,     // exceptionz13@gmail.com
        pass: process.env.EMAIL_PASS,     // App Password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Exceptions!',
      html: `
        <h3>Hello ${name},</h3>
        <p>Thanks for contacting <strong>Exceptions</strong>!</p>
        <p>We're excited to connect and help with your tech journey.</p>
        <br/>
        <p>Best regards,<br/>Team Exceptions 🚀</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Form submitted & email sent!' });
  } catch (err) {
    console.error('❌ Error in contact submission:', err);
    res.status(500).json({ error: 'Server error. Try again later.' });
  }
});

// 4) MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// 5) Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
