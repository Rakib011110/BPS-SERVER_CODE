import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure subscription images directory exists
const subscriptionImagesDir = 'uploads/images/subscriptions';

if (!fs.existsSync(subscriptionImagesDir)) {
  fs.mkdirSync(subscriptionImagesDir, { recursive: true });
}

// Configure multer for subscription image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, subscriptionImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `subscription-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for subscription images (images only)
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Multer configuration for subscription image upload
export const uploadSubscriptionImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for subscription images
  },
  fileFilter: fileFilter,
});

// For single subscription image
export const uploadSingleSubscriptionImage = uploadSubscriptionImage.single('image');

// For multiple subscription images (if needed in future)
export const uploadMultipleSubscriptionImages = uploadSubscriptionImage.array('images', 5); // Max 5 images