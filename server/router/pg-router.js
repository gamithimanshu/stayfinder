const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const validate = require("../middlewares/validate-middleware");
const { getPgById, getPublicPgStats, listAllPgs, reverseGeocode } = require("../controllers/pg-controller");
const {
  createOwnerPg,
  deleteOwnerPg,
  updateOwnerPg,
} = require("../controllers/owner-controller");
const { ownerPgSchema } = require("../validators/owner-validator");

const router = express.Router();

router.route("/all").get(listAllPgs);
router.route("/stats").get(getPublicPgStats);
router.route("/reverse-geocode").get(reverseGeocode);
router
  .route("/add")
  .post(authMiddleware, validate(ownerPgSchema), createOwnerPg);
router
  .route("/update")
  .put(
    authMiddleware,
    (req, _res, next) => {
      req.params.id = req.body.id || req.body.pgId || req.body._id || "";
      next();
    },
    validate(ownerPgSchema),
    updateOwnerPg
  );
router
  .route("/delete")
  .delete(authMiddleware, (req, _res, next) => {
    req.params.id = req.body.id || req.body.pgId || req.body._id || req.query.id || "";
    next();
  }, deleteOwnerPg);
router.route("/:id").get(getPgById);

module.exports = router;
