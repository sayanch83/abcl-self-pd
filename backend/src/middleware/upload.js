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
  if (isCloudinaryConfigured) {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'abcl-self-pd',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
        transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1920, crop: 'limit' }],
      },
    });

    return multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    });
  }

  // Fallback: store in memory, return base64 URLs for demo
  logger.warn('Cloudinary not configured — using memory storage (demo mode)');
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  });
}

function getFileUrl(file) {
  if (file.path) return file.path; // Cloudinary URL

  if (file.buffer) {
    // No Cloudinary — convert buffer to base64 data URL so the actual photo is preserved
    const base64 = file.buffer.toString('base64');
    const mime = file.mimetype || 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  }

  return null;
}

module.exports = { createUploadMiddleware, getFileUrl };
