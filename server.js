require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   RESEND CONFIG
========================= */

const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================
   ENSURE UPLOADS FOLDER
========================= */

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* =========================
   APPLY JOB API
========================= */

app.post("/apply-job", upload.single("resume"), async (req, res) => {
  try {

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
        message: "Resume file required"
      });
    }

    const filePath = path.join(uploadDir, resumeFile.filename);

    const fileBuffer = fs.readFileSync(filePath);

    await resend.emails.send({
      from: "Iconic Business <info@iconicbusinesssolution.com>",
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
          content: fileBuffer
        }
      ]
    });

    res.json({
      success: true,
      message: "Application sent successfully"
    });

  } catch (error) {

    console.error("EMAIL ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Email sending failed"
    });

  }
});

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});