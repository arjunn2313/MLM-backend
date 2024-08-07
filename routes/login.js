const {
  mobileVerification,
  createAccount,
  validateOTP,
  loginReqByPass,
  logReqByOtp,
  validateAndLogin,
} = require("../controllers/login");

const router = require("express").Router();

// Create account
router.post("/user/mobileverification", mobileVerification);
router.post("/user/create", createAccount);
router.post("/user/validate-otp", validateOTP);

//Login with mobile and password
router.post("/user/login-by-password", loginReqByPass);

// Login with Mobile and OTP
router.post("/user/login-otp-request", logReqByOtp);
router.post("/user/login-otp-validate", validateAndLogin);

// forget password and reset
router.post("/user/forget-password", logReqByOtp);
router.post("/user/reset-password", validateAndLogin);

module.exports = router;
