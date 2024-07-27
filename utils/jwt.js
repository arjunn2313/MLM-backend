const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const UserAccount = require("../models/login");

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",  
    }
  );
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // console.log("Authorization Header:", authHeader);

  if (!authHeader) {
    // console.error("No Authorization Header");
    return res.sendStatus(401);
  }

  const token = authHeader.split(" ")[1];
  // console.log("Token:", token);

  if (!token) {
    console.error("No Token Found");
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT Verification Error:", err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.sendStatus(403);
    }
    next();
  };
};

module.exports = {
  generateAccessToken,
  authenticateToken,
  checkRole,
};
