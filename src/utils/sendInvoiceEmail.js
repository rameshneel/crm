

import nodemailer from "nodemailer";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); 

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io";
  const port = parseInt(process.env.EMAIL_PORT, 10) || 2525;
  const secure = process.env.EMAIL_SECURE === "true";
  const user = process.env.EMAIL_USER || "e47754d0c631df";
  const pass = process.env.EMAIL_PASS || "4a3aaf25610b11";

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
};

const fetchPdf = async (url) => {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 10000 // 10 seconds timeout
    });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    throw new Error(`Failed to fetch PDF: ${error.message}`);
  }
};

const sendInvoiceEmail = async (to, subject, text, html, from, invoicePdfUrl) => {
  console.log("to",to,subject,text,html,from,invoicePdfUrl);
  if (!to || !subject || !invoicePdfUrl) {
    // throw new ApiError(302,'Missing required parameters');
    throw new Error('Missing required parameters');
  }
  try {
    console.log("Preparing to send invoice email", { to, subject, invoicePdfUrl });

    const transporter = createTransporter();
    await transporter.verify();

    const pdfBuffer = await fetchPdf(invoicePdfUrl);

    const info = await transporter.sendMail({
      from: from || `"High Oaks Media" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `invoice_${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        },
      ],
    });
    if (!info || !info.messageId) {
            throw new ApiError(500, 'Failed to send email');
          }
      
          console.log("Message sent successfully:", info.messageId);
          return { success: true, messageId: info.messageId };
        } catch (error) {
          console.error("Error sending invoice email:", error);
          if (error instanceof ApiError) {
            throw error;
          } else {
            throw new ApiError(500, `Failed to send email: ${error.message}`);
          }
        }
      };

export default sendInvoiceEmail;




















// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import {ApiError} from "./ApiError.js"; 

// dotenv.config();

// const createTransporter = () => {
//   const host = process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io";
//   const port = parseInt(process.env.EMAIL_PORT, 10) || 2525;
//   const secure = process.env.EMAIL_SECURE === "true";
//   const user = process.env.EMAIL_USER || "e47754d0c631df";
//   const pass = process.env.EMAIL_PASS || "4a3aaf25610b11";

//   return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
// };

// const sendInvoiceEmail = async (to, subject, text, html, from, attachments) => {
//   console.log("Sending invoice email", { to, subject, from });

//   if (!to || !subject || !attachments || attachments.length === 0) {
//     throw new ApiError(400, 'Missing required parameters');
//   }

//   try {
//     const transporter = createTransporter();
//     await transporter.verify();

//     const info = await transporter.sendMail({
//       from: from || `"High Oaks Media" <${process.env.EMAIL_FROM}>`,
//       to,
//       subject,
//       text,
//       html,
//       attachments,
//     });

//     if (!info || !info.messageId) {
//       throw new ApiError(500, 'Failed to send email');
//     }

//     console.log("Message sent successfully:", info.messageId);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error("Error sending invoice email:", error);
//     if (error instanceof ApiError) {
//       throw error;
//     } else {
//       throw new ApiError(500, `Failed to send email: ${error.message}`);
//     }
//   }
// };

// export default sendInvoiceEmail;







// import nodemailer from "nodemailer";
// import fs from "fs/promises";
// import path from "path";
// import dotenv from "dotenv";

// dotenv.config();

// const createTransporter = () => {
// //   return nodemailer.createTransport({
// //     host: process.env.EMAIL_HOST,
// //     port: process.env.EMAIL_PORT,
// //     secure: process.env.EMAIL_SECURE === "true",
// //     auth: {
// //       user: process.env.EMAIL_USER,
// //       pass: process.env.EMAIL_PASS,
// //     },
// //   });
// // 
// return nodemailer.createTransport({
//     host: "sandbox.smtp.mailtrap.io",
//     port: 2525, 
//     auth: {
//       user: "e47754d0c631df", 
//       pass: "4a3aaf25610b11", 
//     },
//   });};
  

// const sendInvoiceEmail = async (email, pdfPath, orderNo) => {
//   try {
//     console.log("Sending invoice email", { email, pdfPath, orderNo });
//     const transporter = createTransporter();
//     await transporter.verify();
//     await fs.access(pdfPath);
//     const info = await transporter.sendMail({
//       from: `"High Oaks Media" <${process.env.EMAIL_FROM}>`,
//       to: email,
//       subject: `Invoice for Order #${orderNo}`,
//       text: `Please find attached the invoice for your order #${orderNo}.`,
//       html: `
//         <h1>Invoice for Order #${orderNo}</h1>
//         <p>Please find attached the invoice for your order #${orderNo}.</p>
//         <p>If you have any questions, please don't hesitate to contact us.</p>
//       `,
//       attachments: [
//         {
//           filename: `invoice_${orderNo}.pdf`,
//           path: pdfPath,
//         },
//       ],
//     });

//     console.log("Message sent successfully:", info.messageId);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error("Error sending invoice email:", error);
//     return { success: false, error: error.message };
//   }
// };

// export default sendInvoiceEmail;