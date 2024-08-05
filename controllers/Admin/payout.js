// const Razorpay = require('razorpay');
// const Payout = require('../../models/payout');

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const createPayout = async (req, res) => {
//   const { amount, method, accountDetails } = req.body;
//   try {
//     const payout = new Payout({ amount, method, accountDetails });
//     await payout.save();

//     const transfer = await razorpay.payouts.create({
//       account_number: '12345679945', // Replace with your actual account number
//       amount: amount * 100, // amount in smallest currency unit (e.g., paise for INR)
//       currency: 'INR',
//       mode: method,
//       purpose: 'payout',
//       fund_account: {
//         account_type: 'bank_account',
//         bank_account: accountDetails, // Include account details here
//       },
//       queue_if_low_balance: true,
//       reference_id: `payout_${payout._id}`,
//       narration: 'Payout for user',
//     });

//     payout.status = 'completed';
//     await payout.save();

//     res.json({ success: true, payout });
//   } catch (error) {
    
//     console.error('Payout creation error:', error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = { createPayout };
