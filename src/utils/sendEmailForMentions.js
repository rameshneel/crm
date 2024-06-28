import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525, 
  auth: {
    user: "e47754d0c631df", 
    pass: "4a3aaf25610b11", 
  },
});

/**
 * Send emails to mentioned users.
 * @param {string} userEmail 
 * @param {Array<Object>} mentionedUsers - List of user objects mentioned in the update.
 * @param {string} entityType - The type of the entity (Customer, Order, Lead, Amendment).
 * @param {string} entityName - The name or identifier of the entity (e.g., Customer name, Order number).
 * @param {string} updateId - The ID of the update.
 * @param {string} content - The content of the update.
 */
const sendEmailForMentions = async (userEmail, mentionedUsers, entityType, entityName, updateId, content) => {
  try {
    const entityUrls = {
      Customer: `https://high-oaks-media-crm.vercel.app/customers/update/${updateId}`,
      Order: `https://high-oaks-media-crm.vercel.app/orders/update/${updateId}`,
      Lead: `https://high-oaks-media-crm.vercel.app/leads/update/${updateId}`,
      Amendment: `https://high-oaks-media-crm.vercel.app/amendments/update/${updateId}`,
    };

    const entityUrl = entityUrls[entityType];

    for (let user of mentionedUsers) {
      // const mailOptions = {
      //   from: userEmail,
      //   to: user.email,
      //   subject: `You were mentioned in an update for ${entityType} ${entityName}`,
      //   text: `You were mentioned in an update. Here is the content: "${content}". View it here: ${entityUrl}`,
      //   html: `
      //     <p>Hi,</p>
      //     <p>You were mentioned in an update for <strong>${entityType} ${entityName}</strong>.</p>
      //     <p>Here is the content:</p>
      //     <blockquote>${content}</blockquote>
      //     <p><a href="${entityUrl}">Click here to view the update</a></p>
      //     <p>Regards,<br />Your CRM Team</p>
      //   `,
      // };
 
      const mailOptions = {
        from: userEmail,
        to: user.email,
        subject: `You were mentioned in an update for ${entityType} ${entityName}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Notification</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f0f0f0;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
              .header {
                background-color: #007bff;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
              }
              .content {
                padding: 30px;
                line-height: 1.6;
              }
              .content p {
                margin-bottom: 15px;
              }
              .content blockquote {
                background-color: #f9f9f9;
                border-left: 5px solid #007bff;
                padding: 10px;
                margin: 15px 0;
              }
              .footer {
                background-color: #f0f0f0;
                padding: 20px;
                text-align: center;
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
                font-size: 0.8em;
                color: #666666;
              }
              .footer a {
                color: #007bff;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>You were mentioned in an update</h2>
              </div>
              <div class="content">
                <p>Hi,</p>
                <p>You were mentioned in an update for <strong>${entityType} ${entityName}</strong>.</p>
                <blockquote>${content}</blockquote>
                <p>View the update <a href="${entityUrl}" style="color: #007bff;">here</a>.</p>
              </div>
              <div class="footer">
                <p>Regards,<br>Your CRM Team</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
      
      
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${user.email}`);
    }
  } catch (error) {
    console.error("Error sending email notifications:", error);
  }
};

export default sendEmailForMentions;
















