const asyncWrapper = require("../middlewares/asyncWrapper");
const { User } = require("../models");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const bcrypt = require("bcryptjs");
const emailService = require("../services/emailService");
const { generateVerificationToken } = require("../utils/tokenGenerator");
const { Op } = require("sequelize");
let currentUserId;
let emailForResetPassword;

const register = asyncWrapper(async (req, res) => {
  const { name, email, password, confirmPassword, address, phone, age } =
    req.body;
  const errors = {};

  // Validate name
  if (!name || name.length < 3) {
    errors.name = "Name must be at least 3 characters long.";
  }

  // Validate email
  if (!email || !email.includes("@")) {
    errors.email = "Please provide a valid email address.";
  } else {
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      errors.email = "This email address is already in use";
    }
  }

  // Validate password
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  // Check if password and confirm password match
  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  // Validate phone
  if (!phone || phone.length !== 11) {
    errors.phone = "Phone number must be 11 digits long.";
  }

  if (!age || age < 0) {
    errors.age = "Age must be a positive integer.";
  }

  // If there are any errors, re-render the form with error messages
  if (Object.keys(errors).length > 0) {
    return res.status(400).render("register", {
      title: "Sign Up",
      errors,
      formData: { name, email, address, phone, age }, // Keep entered form data
    });
  }

  // No errors - proceed to create user
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Generate a verification token
  const verificationToken = generateVerificationToken();

  await User.create({
    name,
    email,
    password: hashedPassword,
    address,
    phone,
    age,
    verificationToken,
    isVerified: false, // Set initial verification status as false
  });

  // Send verification email
  await emailService.sendVerificationEmail(email, verificationToken);

  return res.redirect("/register/check-verification");

  // return res.send({
  //   status: httpStatusText.SUCCESS,
  //   data: { message: "User created successfully" },
  // });
});

const verifyUser = asyncWrapper(async (req, res, next) => {
  const { token } = req.query;

  // Find user with the matching verification token
  const user = await User.findOne({ where: { verificationToken: token } });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid or expired verification token." });
  }

  // Mark user as verified and clear the verification token
  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  res.render("verification-success", { title: "Verification Success" });
});

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  // Validate email
  if (!email || !email.includes("@")) {
    errors.email = "Please provide a valid email address.";
  }

  // Validate password
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  // If there are any errors, re-render the form with error messages
  if (Object.keys(errors).length > 0) {
    return res.status(400).render("login", {
      title: "Login",
      errors,
      formData: { email }, // Keep entered form data
    });
  }

  const user = await User.findOne({ where: { email } });

  if (!user || !user.isVerified) {
    errors.email = "Account not found or email not verified!";

    return res.status(400).render("login", {
      title: "Login",
      errors,
      formData: { email }, // Keep entered form data
    });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    errors.password = "Wrong Password, Try Again!";

    return res.status(400).render("login", {
      title: "Login",
      errors,
      formData: { email }, // Keep entered form data
    });
    // const error = appError.create(
    //   "Invalid credentials",
    //   400,
    //   httpStatusText.FAIL
    // );
    // return next(error);
  }

  currentUserId = user.id;
  return res.redirect("/profile");
  // return res.send({
  //   status: httpStatusText.SUCCESS,
  //   data: { message: "Logged in successfully" },
  // });
});

const currentUser = asyncWrapper(async (req, res) => {
  const user = await User.findByPk(currentUserId);

  return res.render("profile", { title: "Profile", user });
  // return res.send({
  //   status: httpStatusText.SUCCESS,
  //   data: { user },
  // });
});

const getEditProfilePage = asyncWrapper(async (req, res) => {
  const user = await User.findByPk(currentUserId);

  res.render("edit-profile", {
    title: "Edit Profile",
    user,
    errors: "",
    formData: "",
  });
});

const updateUser = asyncWrapper(async (req, res) => {
  const { name, email, password, confirmPassword, address, phone, age } =
    req.body;
  const errors = {};
  const user = await User.findByPk(currentUserId);

  // Validate name
  if (!name || name.length < 3) {
    errors.name = "Name must be at least 3 characters long.";
  }

  // Validate email
  if (!email || !email.includes("@")) {
    errors.email = "Please provide a valid email address.";
  } else {
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      errors.email = "This email address is already in use";
    }
  }

  // Validate password
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  // Check if password and confirm password match
  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  // Validate phone
  if (!phone || phone.length !== 11) {
    errors.phone = "Phone number must be 11 digits long.";
  }

  if (!age || age < 0) {
    errors.age = "Age must be a positive integer.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("edit-profile", {
      title: "Edit Profile",
      user,
      errors,
      formData: { name, email, address, phone, age }, // Keep entered form data
    });
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    req.body.password = hashedPassword;
  }

  const updateUser = await User.update(
    { ...req.body }, // Spread the request body to set new values
    {
      where: {
        id: currentUserId, // Condition to find the User by its ID
      },
    }
  );

  if (updateUser) {
    return res.redirect("/profile");
    // return res.send({
    //   status: httpStatusText.SUCCESS,
    //   data: { message: "User updated successfully" },
    // });
  }
});

const confirmEmail = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  let error;

  if (!user) {
    error = "User not found";

    return res.render("confirm-email", {
      title: "Confirm Email",
      error,
      formData: { email }, // Keep entered form data
    });
    // const error = appError.create("User not found", 400, httpStatusText.FAIL);
    // return next(error);
  }

  // Generate token and expiration
  const resetToken = generateVerificationToken();
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour
  await user.save();

  await emailService.sendResetPasswordEmail(email, resetToken);

  emailForResetPassword = email;
  return res.redirect("/login/check-verify-reset-password");
  // return res.redirect("/login/reset-password");
});

const forgetPassword = asyncWrapper(async (req, res, next) => {
  const { token, newPassword, confirmPassword } = req.body;
  const errors = {};

  if (!newPassword) {
    errors.newPassword = "Password is required";

    return res.render("reset-password", {
      title: "Reset Password",
      errors,
      formData: { newPassword, confirmPassword },
    });
  }

  if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";

    return res.render("reset-password", {
      title: "Reset Password",
      errors,
      formData: { newPassword, confirmPassword },
    });
    // const error = appError.create(
    //   "password field not equal confirm password",
    //   400,
    //   httpStatusText.FAIL
    // );
    // return next(error);
  }

  const user = await User.findOne({
    where: {
      resetToken: token,
      resetTokenExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const newHashedPassword = bcrypt.hashSync(newPassword, 10);

  const updateUser = await User.update(
    { password: newHashedPassword, resetToken: null, resetTokenExpires: null }, // Spread the request body to set new values
    {
      where: {
        email: emailForResetPassword, // Condition to find the User by its ID
      },
    }
  );

  if (updateUser) {
    res.redirect("/login");
    // return res.send({
    //   status: httpStatusText.SUCCESS,
    //   data: { message: "User password updated successfully" },
    // });
  }
});

module.exports = {
  login,
  verifyUser,
  register,
  currentUser,
  getEditProfilePage,
  updateUser,
  confirmEmail,
  forgetPassword,
};
