const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller");

router.route("/").get(userController.currentUser);

router
  .route("/edit-info")
  .get(userController.getEditProfilePage)
  .post(userController.updateUser);

module.exports = router;
