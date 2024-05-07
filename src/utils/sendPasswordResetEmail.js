import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: "2791fd57575442",
    pass: "4f14b5bb9a8625",
  },
});

const sendPasswordResetEmail = async (email, resetToken) => {
  try {

    const mailOptions = {
      from: "rkmahto151@gmail.com",
      to: email,
      subject: "Password Reset",
      html: `<p>Please click the following link to reset your password:</p><p><a href="https://crm-qg8c.onrender.com/api/users/reset-password-token/${resetToken}">Reset Password</a></p>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

export { sendPasswordResetEmail };
