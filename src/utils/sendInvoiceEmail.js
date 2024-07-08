import nodemailer from "nodemailer";
import axios from "axios";
import { ApiError } from "./ApiError.js";

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io";
  const port = parseInt(process.env.EMAIL_PORT, 10) || 2525;
  const secure = process.env.EMAIL_SECURE === "true";
  const user = process.env.EMAIL_USER || "e47754d0c631df";
  const pass = process.env.EMAIL_PASS || "4a3aaf25610b11";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

/**
 * Send emails to mentioned users.
 * @param {string} toemail 
 * @param {string} subject - The type of the entity (Customer, Order, Lead, Amendment).
 * @param {string} text - The name or identifier of the entity (e.g., Customer name, Order number).
 * @param {string} html - The ID of the update.
 * @param {string} from - The content of the update.
 * @param {string} invoicePdfUrl - The content of the update.
 */

const fetchPdf = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000, // 10 seconds timeout
    });
    return Buffer.from(response.data, "binary");
  } catch (error) {
    throw new Error(`Failed to fetch PDF: ${error.message}`);
  }
};

const sendInvoiceEmail = async (
  toemail,  // Changed from 'to' to 'toemail' to match the parameter name
  subject,
  text,
  html,
  from,
  invoicePdfUrl
) => {
  console.log("to", toemail);
  if (!toemail || !subject || !invoicePdfUrl) {
    throw new ApiError(400, "Missing required parameters");  // Changed to ApiError
  }
  try {
    console.log("Preparing to send invoice email", {
      to: toemail,  // Changed from 'to' to 'toemail'
      subject,
      invoicePdfUrl,
    });

    const transporter = createTransporter();
    await transporter.verify();

    const pdfBuffer = await fetchPdf(invoicePdfUrl);

    const info = await transporter.sendMail({
      from: from || `"High Oaks Media" <${process.env.EMAIL_FROM}>`,
      to: toemail,  // Changed from 'to' to 'toemail'
      subject,
      text,
      html,
      attachments: [
        {
          filename: `invoice_${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    if (!info || !info.messageId) {
      throw new ApiError(500, "Failed to send email");
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


