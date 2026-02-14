const nodemailer = require("nodemailer");
const { EmailTemplate } =require("../models/index.js");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Dynamic DB Template Email
exports.sendDynamicTemplateEmail = async ({
  to,
  templateKey,
  variables,
}) => {
  // 1️⃣ Get template from DB
  const template = await EmailTemplate.findOne({
    key: templateKey,
    isActive: true,
  });

  if (!template) {
    throw new Error("Email template not found or inactive");
  }

  let subject = template.subject;
  let body = template.body;

  // 2️⃣ Replace variables in subject + body
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, variables[key]);
    body = body.replace(regex, variables[key]);
  });

  // 3️⃣ Convert line breaks to HTML
  body = body.replace(/\n/g, "<br/>");

  // 4️⃣ Wrap in basic HTML layout
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      ${body}
      <br/><br/>
    </div>
  `;

  // 5️⃣ Send email
  await transporter.sendMail({
    from: `"NotesBytes" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};
