const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const UserAccount = require("../models/login");

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.sendStatus(401); // Unauthorized if no token provided
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden if token is invalid
    }
    req.user = user;
    next(); // Proceed to next middleware or route handler
  });
};

module.exports = {
  generateAccessToken,
  authenticateToken,
};
