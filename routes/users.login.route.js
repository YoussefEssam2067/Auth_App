const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller");

router
  .route("/")
  .get((req, res) => {
    res.render("login", { title: "Login", errors: "", formData: "" });
  })
  .post(userController.login);

router
  .route("/confirm-email")
  .get((req, res) => {
    res.render("confirm-email", {
      title: "Confirm Email",
      error: "",
      formData: "",
    });
  })
  .post(userController.confirmEmail);

router.route("/check-verify-reset-password").get((req, res) => {
  res.render("check-verify-reset-password", {
    title: "Check verify reset password",
  });
});

router
  .route("/reset-password")
  .get((req, res) => {
    res.render("reset-password", {
      title: "Reset Password",
      errors: "",
      formData: "",
      token: req.query.token, // Include token if it’s sent in the URL
    });
  })
  .post(userController.forgetPassword);

module.exports = router;
