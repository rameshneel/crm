import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const createTransporter = () => {
//   return nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     secure: process.env.EMAIL_SECURE === "true",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });
// 
return nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525, 
    auth: {
      user: "e47754d0c631df", 
      pass: "4a3aaf25610b11", 
    },
  });};
  

const sendInvoiceEmail = async (email, pdfPath, orderNo) => {
  try {
    console.log("Sending invoice email", { email, pdfPath, orderNo });
    const transporter = createTransporter();
    await transporter.verify();
    await fs.access(pdfPath);
    const info = await transporter.sendMail({
      from: `"High Oaks Media" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `Invoice for Order #${orderNo}`,
      text: `Please find attached the invoice for your order #${orderNo}.`,
      html: `
        <h1>Invoice for Order #${orderNo}</h1>
        <p>Please find attached the invoice for your order #${orderNo}.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
      `,
      attachments: [
        {
          filename: `invoice_${orderNo}.pdf`,
          path: pdfPath,
        },
      ],
    });

    console.log("Message sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return { success: false, error: error.message };
  }
};

export default sendInvoiceEmail;