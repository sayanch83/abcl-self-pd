const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const logger = require('../utils/logger');

// Configure Cloudinary
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_');

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function createUploadMiddleware() {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for video
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are allowed'), false);
      }
    },
  });
}

function getFileUrl(file) {
  if (file.path) return file.path; // Cloudinary URL

  if (file.buffer) {
    const mime = file.mimetype || 'image/jpeg';
    const base64 = file.buffer.toString('base64');
    return `data:${mime};base64,${base64}`;
  }

  return null;
}

module.exports = { createUploadMiddleware, getFileUrl };
