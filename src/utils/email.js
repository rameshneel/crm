import nodemailer from "nodemailer";

const sendWelcomeEmail = async (email, password) => {
  try {

    const transporter = nodemailer.createTransport({
     
      host: "sandbox.smtp.mailtrap.io",
      port: 587,
      secure: false, 
      auth: {
        user: "2791fd57575442",
        pass: "4f14b5bb9a8625",
      },
    });

    const mailOptions = {
      from: "rkmahto151@gmail.com",
      to: email,
      subject: "Welcome to [Your Company Name] - Your Account Details Inside" ,
      html: `<p>Welcome! Your account has been successfully created.  email address: ${email} your password : ${password}</p>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(" email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; 
  }
};

export { sendWelcomeEmail };




// const sendVerificationEmail = async (email, verificationToken) => {
//   try {

//     const transporter = nodemailer.createTransport({
//       service:'gmail',
     
//       // port: 587,
//       // secure: false, 
//       auth: {
//         user: "rameshtest151@gmail.com",
//         pass: "myhg bieh owvf qnfz",
//       },
//     });

//     const mailOptions = {
//       from: "rkmahto151@gmail.com",
//       to: email,
//       subject: "Email Verification",
//       html: `<p>Please click the following link to verify your email address:</p><p><a href="http://localhost:8000/api/verify/${verificationToken}">Verify Email</a></p>`,
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);
//     console.log("Verification email sent successfully");
//   } catch (error) {
//     console.error("Error sending verification email:", error);
//     throw error; 
//   }
// };

// export { sendVerificationEmail };


