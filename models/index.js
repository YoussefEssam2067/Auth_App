const Sequelize = require("sequelize");
const db = require("../config/dbConnection");
const UserModel = require("./user.model");

const User = UserModel(db, Sequelize);

db.sync({ force: false }).then(() => {
  console.log("Tables Created!");
});

module.exports = { User };
