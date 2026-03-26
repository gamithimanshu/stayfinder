const ContactMessage = require("../models/contact-model");
const { hasMailConfig, sendContactEmail } = require("../utils/mailer");

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

    await sendContactEmail({
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
    });

    return res.status(201).json({
      message: "Message sent successfully",
      contact,
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
