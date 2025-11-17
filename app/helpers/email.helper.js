const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

module.exports.sendTemplateEmail = async ({ 
  to, 
  subject, 
  templateName, 
  variables 
}) => {

  // Load template file
  const templateFile = path.join(
    __dirname,
    "email-templates",
    `${templateName}.html`
  );

  let html = fs.readFileSync(templateFile, "utf8");

  // Replace {{variables}}
  for (const key in variables) {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, variables[key]);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter.sendMail({
    from: `"Admin Panel" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  });
};
