const multer = require('multer');
const path = require('path');

// Common storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination based on the file type
    let uploadPath;
    if (file.fieldname === 'applicantPhoto') {
      uploadPath = 'uploads/applicantPhoto';
    } else if (file.fieldname === 'applicantSign') {
      uploadPath = 'uploads/applicantSign';
    } else if (file.fieldname === 'sponsorSign') {
      uploadPath = 'uploads/sponsorSign';
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = { upload };
