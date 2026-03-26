const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const adminMiddleware = require("../middlewares/admin-middleware");
const validate = require("../middlewares/validate-middleware");
const { createContactMessage, deleteContactMessage, getContactMessages } = require("../controllers/contact-controller");
const { contactSchema } = require("../validators/contact-validator");

const router = express.Router();

router
  .route("/")
  .post(validate(contactSchema), createContactMessage)
  .get(authMiddleware, adminMiddleware, getContactMessages);

router
  .route("/:id")
  .delete(authMiddleware, adminMiddleware, deleteContactMessage);

module.exports = router;
