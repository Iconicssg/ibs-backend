require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.send("Backend running successfully 🚀");
});

/* =========================
   MULTER FILE UPLOAD
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* =========================
   EMAIL CONFIG
========================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* =========================
   APPLY JOB API
========================= */

app.post("/apply-job", upload.single("resume"), async (req, res) => {
  try {

    console.log("Form Data:", req.body);

    const {
      fullName,
      email,
      phone,
      city,
      experience,
      position,
      salary,
      notice
    } = req.body;

    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required"
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "info@iconicbusinesssolution.com",
      subject: `New Job Application - ${position}`,
      html: `
        <h2>New Job Application</h2>

        <p><b>Name:</b> ${fullName}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>City:</b> ${city}</p>
        <p><b>Experience:</b> ${experience}</p>
        <p><b>Position:</b> ${position}</p>
        <p><b>Expected Salary:</b> ${salary}</p>
        <p><b>Notice Period:</b> ${notice}</p>
      `,
      attachments: [
        {
          filename: resumeFile.originalname,
          path: resumeFile.path
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Application sent successfully"
    });

  } catch (error) {

    console.error("EMAIL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Error sending application"
    });

  }
});

/* =========================
   SERVER START
========================= */

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});