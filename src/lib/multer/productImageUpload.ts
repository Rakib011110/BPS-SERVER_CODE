import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure product images directory exists
const productImagesDir = 'uploads/images/products';

if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

// Configure multer for product image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for product images (images only)
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

// Multer configuration for product image upload
export const uploadProductImage = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// For single product image (thumbnail)
export const uploadSingleProductImage = uploadProductImage.single('image');

// For multiple product images
export const uploadMultipleProductImages = uploadProductImage.array('images', 10); // Max 10 images

// For product form with thumbnail and multiple images
export const uploadProductImages = uploadProductImage.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);