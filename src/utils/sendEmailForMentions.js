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
      const mailOptions = {
        from: userEmail,
        to: user.email,
        subject: `You were mentioned in an update for ${entityType} ${entityName}`,
        text: `You were mentioned in an update. Here is the content: "${content}". View it here: ${entityUrl}`,
        html: `
          <p>Hi,</p>
          <p>You were mentioned in an update for <strong>${entityType} ${entityName}</strong>.</p>
          <p>Here is the content:</p>
          <blockquote>${content}</blockquote>
          <p><a href="${entityUrl}">Click here to view the update</a></p>
          <p>Regards,<br />Your CRM Team</p>
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
















