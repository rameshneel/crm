import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

const createTransporter = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS } = process.env;
  
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT, 10),
    secure: EMAIL_SECURE === "true",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
};

const sendEmail = async ({ to, subject, html, from, attachments = [] }) => {
  if (!to || !subject || !html) {
    throw new ApiError(400, "Missing required parameters");
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();

    const info = await transporter.sendMail({
      from: from || process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments,
    });

    if (!info || !info.messageId) {
      throw new ApiError(500, "Failed to send email");
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new ApiError(500, "Error sending email");
  }
};

export const sendWelcomeEmail = async (email, userName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
        <h1>Welcome to Our Service, ${userName}!</h1>
        <p>We're excited to have you on board.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Our Service',
    html,
  });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password-verify/${resetToken}`; 
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
        <h1>Password Reset Request</h1>
        <p>Hello,</p>
        <p>We received a request to reset the password for your account (${email}).</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Your Password</a>
        <p>If you didn't request this, please ignore this email.</p>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html,
  });
};

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
};

// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 587,
//   secure: false,
//   auth: {
//     user: "2791fd57575442",
//     pass: "4f14b5bb9a8625",
//   },
// });

// const sendPasswordResetEmail = async (email, resetToken) => {
//   try {

//     const mailOptions = {
//       from: "rkmahto151@gmail.com",
//       to: email,
//       subject: "Password Reset",
//        html: `<p>Please click the following link to reset your password:</p><p><a href=http://localhost:3000/auth/reset-password-verify/${resetToken}>Reset Password</a></p>`,
//       // html: `<p>Please click the following link to reset your password:</p><p><a href="https://crm-qg8c.onrender.com/api/users/reset-password-token/${resetToken}">Reset Password</a></p>`,
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);

//     console.log(`Password reset email sent to ${email}`);
//   } catch (error) {
//     console.error("Error sending password reset email:", error);
//     throw new Error("Failed to send password reset email");
//   }
// };

// export { sendPasswordResetEmail };



