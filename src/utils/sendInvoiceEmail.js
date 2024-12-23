import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

const createTransporter = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS } =
    process.env;

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT, 10),
    secure: EMAIL_SECURE === "true",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
};

const sendInvoiceEmail = async ({
  to,
  subject,
  html,
  from,
  pdfBuffer,
  pdfFilename,
}) => {
  if (!to || !subject || !pdfBuffer) {
    throw new ApiError(400, "Missing required parameters");
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (!info || !info.messageId) {
      throw new ApiError(500, "Failed to send email");
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending invoice email:", error);
    throw new ApiError(500, "Error sending invoice email");
  }
};
console.log("sending ivoice   bbbb", sendInvoiceEmail);
export default sendInvoiceEmail;

//form axios

// import nodemailer from "nodemailer";
// import axios from "axios";
// import { ApiError } from "./ApiError.js";

// const createTransporter = () => {
//   const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS } = process.env;

//   return nodemailer.createTransport({
//     host: EMAIL_HOST,
//     port: parseInt(EMAIL_PORT, 10),
//     secure: EMAIL_SECURE === "true",
//     auth: { user: EMAIL_USER, pass: EMAIL_PASS },
//   });
// };

// const fetchPdf = async (url) => {
//   try {
//     const response = await axios.get(url, {
//       responseType: "arraybuffer",
//       timeout: 40000,
//     });
//     return Buffer.from(response.data);
//   } catch (error) {
//     throw new ApiError(500, `Failed to fetch PDF: ${error.message}`);
//   }
// };

// export const sendInvoiceEmail = async ({ to, subject, html, from, invoicePdfUrl }) => {
//   if (!to || !subject || !invoicePdfUrl) {
//     throw new ApiError(400, "Missing required parameters");
//   }

//   try {
//     const transporter = createTransporter();
//     await transporter.verify();

//     const pdfBuffer = await fetchPdf(invoicePdfUrl);

//     const info = await transporter.sendMail({
//       from,
//       to,
//       subject,
//       html,
//       attachments: [
//         {
//           filename: `invoice_${Date.now()}.pdf`,
//           content: pdfBuffer,
//           contentType: "application/pdf",
//         },
//       ],
//     });

//     if (!info || !info.messageId) {
//       throw new ApiError(500, "Failed to send email");
//     }

//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error("Error sending invoice email:", error);
//     throw new ApiError(500, "Error sending invoice email");
//   }
// };

// import nodemailer from "nodemailer";
// import axios from "axios";
// import { ApiError } from "./ApiError.js";

// const createTransporter = () => {
//   const host = process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io";
//   const port = parseInt(process.env.EMAIL_PORT, 10) || 2525;
//   const secure = process.env.EMAIL_SECURE === "true";
//   const user = process.env.EMAIL_USER || "e47754d0c631df";
//   const pass = process.env.EMAIL_PASS || "4a3aaf25610b11";

//   return nodemailer.createTransport({
//     host,
//     port,
//     secure,
//     auth: { user, pass },
//   });
// };

// /**
//  * Send emails to mentioned all detiled.
//  * @param {string} toemail
//  * @param {string} subject
//  * @param {string} text
//  * @param {string} html
//  * @param {string} from
//  * @param {string} invoicePdfUrl
//  */

// const fetchPdf = async (url) => {
//   try {
//     const response = await axios.get(url, {
//       responseType: "arraybuffer",
//       timeout: 40000,
//     });
//     return Buffer.from(response.data, "binary");
//   } catch (error) {
//     throw new Error(`Failed to fetch PDF: ${error.message}`);
//   }
// };

// const sendInvoiceEmail = async (
//   toemail,
//   subject,
//   text,
//   html,
//   from,
//   invoicePdfUrl
// ) => {
//   console.log("to", toemail);
//   if (!toemail || !subject || !invoicePdfUrl) {
//     throw new ApiError(400, "Missing required parameters");  // Changed to ApiError
//   }
//   try {
//     console.log("Preparing to send invoice email", {
//       to: toemail ,
//       subject,
//       invoicePdfUrl,
//     });

//     const transporter = createTransporter();
//     await transporter.verify();

//     const pdfBuffer = await fetchPdf(invoicePdfUrl);

//     const info = await transporter.sendMail({
//       from: from || `"High Oaks Media" <${process.env.EMAIL_FROM}>`,
//       to: toemail,
//       subject,
//       text,
//       html,
//       attachments: [
//         {
//           filename: `invoice_${Date.now()}.pdf`,
//           content: pdfBuffer,
//           contentType: "application/pdf",
//         },
//       ],
//     });
//     if (!info || !info.messageId) {
//       throw new ApiError(500, "Failed to send email");
//     }

//     console.log("Message sent successfully:", info.messageId);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error("Error sending invoice email:", error);
//      throw new ApiError(500,"Error sending invoice email")
//   }
// };

// export default sendInvoiceEmail;


// import nodemailer from "nodemailer";

// export const sendInvoiceEmail = async (order, filePath) => {
//   console.log("email", order, filePath);

//   var transporter = nodemailer.createTransport({
//     host: "sandbox.smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//       user: "16def67a96f9dd",
//       pass: "a76727e7b8b3f3",
//     },
//   });

//   let mailOptions = {
//     from: "rkmahto151@gmail.com",
//     to: "rkmahto@gmail.com", // Ensure you use the customer's email from the order
//     subject: `Invoice for Order ${order.orderNo}`,
//     text: `Dear ${order.customer.name},\n\nPlease find attached the invoice for your recent order.\n\nThank you for your business.`,
//     html: `
//       <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
//         <h2 style="color: #0056b3;">Invoice for Order ${order.orderNo}</h2>
//         <p>Dear ${order.customer.name},</p>
//         <p>Please find attached the invoice for your recent order.</p>
//         <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
//           <tr>
//             <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Description</th>
//             <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Amount</th>
//           </tr>
//           <tr>
//             <td style="border: 1px solid #ddd; padding: 8px;">Order Value</td>
//             <td style="border: 1px solid #ddd; padding: 8px;">£${order.orderValue.toFixed(
//               2
//             )}</td>
//           </tr>
//           <tr>
//             <td style="border: 1px solid #ddd; padding: 8px;">VAT @ 20%</td>
//             <td style="border: 1px solid #ddd; padding: 8px;">£${(
//               order.orderValue * 0.2
//             ).toFixed(2)}</td>
//           </tr>
//           <tr>
//             <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Total</td>
//             <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">£${(
//               order.orderValue * 1.2
//             ).toFixed(2)}</td>
//           </tr>
//         </table>
//         <p>Thank you for your business.</p>
//         <p>Best regards,</p>
//         <p>Your Company Name</p>
//       </div>
//     `,
//     attachments: [
//       {
//         filename: `Invoice_${order.orderNo}.pdf`,
//         path: filePath,
//       },
//     ],
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log("Email sent successfully");
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw error;
//   }
// };
