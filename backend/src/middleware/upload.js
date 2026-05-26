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
  const allowed = {
    '.pdf': ['application/pdf'],
    '.ppt': ['application/vnd.ms-powerpoint'],
    '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    '.mp4': ['video/mp4'],
    '.mpeg': ['video/mpeg'],
    '.mov': ['video/quicktime'],
    '.avi': ['video/x-msvideo'],
    '.webm': ['video/webm'],
    '.wmv': ['video/x-ms-wmv'],
    '.mkv': ['video/x-matroska', 'application/octet-stream'],
  };
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedTypes = allowed[ext];
  const mime = String(file.mimetype || '').split(';')[0].toLowerCase();
  if (allowedTypes && allowedTypes.includes(mime)) cb(null, true);
  else cb(new AppError('Only valid PDF, PPT, and video files are allowed', 400), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 200 * 1024 * 1024 } });

module.exports = upload;