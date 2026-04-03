const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.ppt', '.pptx', '.mp4', '.mpeg', '.mov', '.avi', '.webm', '.wmv', '.mkv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new AppError('Only PDF, PPT, and Video files are allowed', 400), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 200 * 1024 * 1024 } });

module.exports = upload;