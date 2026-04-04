const nodemailer = require("nodemailer");

const requiredKeys = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM",
  "MAIL_TO",
];

const getEnv = (key) => String(process.env[key] || "").trim();

const getSecretEnv = (key) => getEnv(key).replace(/\s+/g, "");

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getRecipients = () =>
  getEnv("MAIL_TO")
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);

const hasMailConfig = () =>
  requiredKeys.every((key) => {
    if (key === "SMTP_PASS") {
      return Boolean(getSecretEnv(key));
    }

    return Boolean(getEnv(key));
  });

let transporter;
let verifyPromise;

const createTransporter = () => {
  if (!hasMailConfig()) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, and MAIL_TO.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: getEnv("SMTP_HOST"),
      port: Number(getEnv("SMTP_PORT")),
      secure: getEnv("SMTP_SECURE").toLowerCase() === "true" || Number(getEnv("SMTP_PORT")) === 465,
      auth: {
        user: getEnv("SMTP_USER"),
        pass: getSecretEnv("SMTP_PASS"),
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return transporter;
};

const verifyMailTransport = async () => {
  const transporter = createTransporter();
  verifyPromise ??= transporter.verify().catch((error) => {
    verifyPromise = undefined;
    throw error;
  });

  await verifyPromise;
  return transporter;
};

const sendContactEmail = async ({ name, email, subject, message }) => {
  const transporter = await verifyMailTransport();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject || "No subject");
  const safeMessage = escapeHtml(message);

  return transporter.sendMail({
    from: getEnv("MAIL_FROM"),
    to: getRecipients(),
    replyTo: email,
    subject: `StayFinder Contact: ${subject || "New Message"}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject || "No subject"}`,
      "",
      "Message:",
      message,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 16px;">New StayFinder Contact Message</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <div style="margin-top: 20px;">
          <strong>Message:</strong>
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        </div>
      </div>
    `,
  });
};

module.exports = {
  hasMailConfig,
  sendContactEmail,
  verifyMailTransport,
};
