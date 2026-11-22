import multer from 'multer';

// Files are kept in memory only for the duration of the request and then
// written to MongoDB GridFS. Nothing is ever written to the server's disk,
// which is important for serverless deployments (e.g. Vercel).

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

const storage = multer.memoryStorage();

const pdfFilter = (_req, file, cb) => {
  const name = String(file.originalname || '').toLowerCase();
  const type = String(file.mimetype || '').toLowerCase();
  const ok =
    name.endsWith('.pdf') &&
    (type === 'application/pdf' || type === 'application/octet-stream' || type === '');
  if (!ok) {
    cb(Object.assign(new Error('Only PDF files up to 10 MB are allowed.'), { status: 400 }));
    return;
  }
  cb(null, true);
};

const imageFilter = (_req, file, cb) => {
  const name = String(file.originalname || '').toLowerCase();
  const type = String(file.mimetype || '').toLowerCase();
  const allowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
  const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
  const ok = allowedExt.some((ext) => name.endsWith(ext)) && allowedMime.includes(type);
  if (!ok) {
    cb(Object.assign(new Error('Choose a PNG, JPG, WebP, GIF or SVG image.'), { status: 400 }));
    return;
  }
  cb(null, true);
};

function makeUpload(maxBytes, fileFilter) {
  const upload = multer({
    storage,
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter,
  });

  return (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'That file is too large. The limit is 10 MB.' });
      }
      return res
        .status(err.status || 400)
        .json({ success: false, message: err.message || 'Upload failed.' });
    });
  };
}

export const uploadResumeFile = makeUpload(MAX_RESUME_BYTES, pdfFilter);
export const uploadMediaFile = makeUpload(MAX_MEDIA_BYTES, imageFilter);
