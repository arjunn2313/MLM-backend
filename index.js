const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const register = require("./routes/register");
const district = require("./routes/district");
const section = require("./routes/tree");
const agent = require("./routes/agent");
const payout = require("./routes/payout");
const settings = require("./routes/settings");

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
app.use("/api/member", register);
app.use("/api/district", district);
app.use("/api/section", section);
app.use("/api/agent", agent);
app.use("/api/pay", payout);
app.use("/api/settings", settings);

app.listen(6060, () => {
  connect();
  console.log("server started in localhost 6060");
});
