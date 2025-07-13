require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Contact = require('./models/Contact');

const app = express();

// ✅ Allow only your frontend domain
app.use(cors({
  origin: 'https://www.exceptionz.in',
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

// ✅ POST: /api/contact
app.post('/api/contact', async (req, res) => {
  const { name, email, mobile, ask } = req.body;

  try {
    // ✅ Save to DB (only name, email, mobile)
    await Contact.create({ name, email, mobile });

    // ✅ Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your sender email
        pass: process.env.EMAIL_PASS, // App password (NOT your real password)
      },
    });

    // ✅ 1. Mail to Admin (you)
    const internalMail = {
      from: `"${name}" <${process.env.EMAIL_USER}>`, // shown as: John Doe <your@email>
      to: process.env.EMAIL_USER, // send to you
      replyTo: email, // reply goes to user
      subject: `❓ Question from ${name}`,
      html: `
        <h3>New Contact from ${name}</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        ${ask ? `<p><strong>Question:</strong> ${ask}</p>` : ''}
      `,
    };

    await transporter.sendMail(internalMail);

    // ✅ 2. Mail to User (welcome message)
    const welcomeMail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Exceptions!',
      html: `
        <h3>Hello ${name},</h3>
        <p>Thanks for contacting <strong>Exceptions</strong>!</p>
        <p>We're excited to connect and help with your tech journey.</p>
        ${ask ? `<hr/><h4>You asked:</h4><p>${ask}</p>` : ''}
        <br/>
        <p>Best regards,<br/>Team Exceptions 🚀</p>
      `,
    };

    await transporter.sendMail(welcomeMail);

    res.status(201).json({ message: 'Form submitted & emails sent!' });
  } catch (err) {
    console.error('❌ Error in contact submission:', err);
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
