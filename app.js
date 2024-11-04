const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const httpStatusText = require("./utils/httpStatusText");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, "views")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");

const userRouterRegister = require("./routes/users.register.route");
const userRouterLogin = require("./routes/users.login.route");
const userRouterProfile = require("./routes/users.profile.route");
app.use("/register", userRouterRegister);
app.use("/login", userRouterLogin);
app.use("/profile", userRouterProfile);

const db = require("./config/dbConnection");
try {
  db.authenticate();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

app.all("*", (req, res, next) => {
  return res.status(404).render("404-page", { title: "Page Not Found" });
});

app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    status: error.statusText || httpStatusText.ERROR,
    message: error.message,
    code: error.statusCode || 500,
    data: null,
  });
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
