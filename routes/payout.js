const express = require('express');
const { createPayout } = require('../controllers/payout');
const router = express.Router();

router.post('/create-payout', createPayout);

module.exports = router;
