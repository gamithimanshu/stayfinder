const ContactMessage = require("../models/contact-model");
const { hasMailConfig, sendContactEmail } = require("../utils/mailer");

const getMailErrorMessage = (error) => {
  const rawMessage = String(error?.message || "").trim();

  if (!rawMessage) {
    return "Message was saved, but email delivery failed. Please verify the SMTP settings and try again.";
  }

  if (error?.code === "EAUTH") {
    return "Message was saved, but Gmail rejected the server login. Please check the SMTP email and app password.";
  }

  if (error?.code === "ECONNECTION" || error?.code === "ETIMEDOUT") {
    return "Message was saved, but the server could not reach Gmail. Please check the SMTP host, port, and network access.";
  }

  return `Message was saved, but email delivery failed: ${rawMessage}`;
};

const createContactMessage = async (req, res, next) => {
  try {
    const contact = await ContactMessage.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      subject: req.body.subject?.trim() ?? "",
      message: req.body.message.trim(),
    });

    if (!hasMailConfig()) {
      return res.status(201).json({
        message: "Message saved, but email sending is not configured on the server yet.",
        contact,
      });
    }

    try {
      await sendContactEmail({
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
      });
    } catch (mailError) {
      console.error("Contact email delivery failed:", mailError.message);

      return res.status(502).json({
        message: getMailErrorMessage(mailError),
        contact,
        emailDelivered: false,
      });
    }

    return res.status(201).json({
      message: "Message sent successfully",
      contact,
      emailDelivered: true,
    });
  } catch (error) {
    return next(error);
  }
};

const getContactMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return res.status(200).json({ messages });
  } catch (error) {
    return next(error);
  }
};

const deleteContactMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Contact message not found" });
    }

    return res.status(200).json({ message: "Contact message deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Contact message not found" });
    }

    return next(error);
  }
};

module.exports = {
  createContactMessage,
  getContactMessages,
  deleteContactMessage,
};
