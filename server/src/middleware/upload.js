const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.png';
    const base = `room-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    cb(null, `${base}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
  cb(ok ? null : new Error('Only PNG/JPG/WEBP allowed'), ok);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { upload, uploadDir };

