const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { authenticateToken, checkRole } = require("./utils/jwt");
const login = require("./routes/login");
const register = require("./routes/Admin/register");
const district = require("./routes/Admin/district");
const agent = require("./routes/Admin/agent");
const payout = require("./routes/Admin/payout");
const settings = require("./routes/Admin/settings");
const section = require("./routes/Admin/tree");
const User = require("./routes/Agent/Register");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const connect = async () => {
  try {
    await mongoose.connect(process.env.mongoUri);
    console.log("Connected to DB");
  } catch (error) {
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});

// middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes

app.use("/login", login);
// app.use("/api", authenticateToken);

// Admin Routes
app.use("/api/admin/district", authenticateToken, checkRole("admin"), district);
app.use("/api/admin/agent", authenticateToken, checkRole("admin"), agent);
app.use("/api/admin/pay", payout);
app.use("/api/admin/settings", settings);
app.use("/api/admin/section", authenticateToken, checkRole("admin"), section);

// agent
app.use("/api/agent", authenticateToken, checkRole("agent"), User);

app.listen(6060, () => {
  connect();
  console.log("server started in localhost 6060");
});
