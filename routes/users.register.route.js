const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller");

router
  .route("/")
  .get((req, res) => {
    res.render("register", { title: "Sign Up", errors: "", formData: "" });
  })
  .post(userController.register);

router.route("/check-verification").get((req, res) => {
  res.render("check-verification", { title: "Check verification" });
});

router.route("/verify").get(userController.verifyUser);

module.exports = router;
