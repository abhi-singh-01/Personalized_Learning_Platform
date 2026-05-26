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
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isImageMime = file.mimetype?.startsWith('image/');

  if (isImageMime && allowedExt.includes(ext)) return cb(null, true);
  return cb(new AppError('Only image files are allowed for course thumbnails', 400), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
