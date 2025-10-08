import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure digital files directory exists
const digitalFilesDir = "uploads/digital-files";

if (!fs.existsSync(digitalFilesDir)) {
  fs.mkdirSync(digitalFilesDir, { recursive: true });
}

// Configure multer for digital file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, digitalFilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `digital-${uniqueSuffix}-${sanitizedName}`);
  },
});

// File filter for digital files - Accept ALL file types for maximum flexibility
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept ALL file types - no restrictions
  // This includes: documents, archives, images, videos, audio, executables, etc.
  cb(null, true);
};

// Multer configuration for digital file upload
export const uploadDigitalFile = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit for digital files (supports large videos, software, etc.)
  },
  fileFilter: fileFilter,
});

// For single digital file
export const uploadSingleDigitalFile = uploadDigitalFile.single("file");

// For multiple digital files
export const uploadMultipleDigitalFiles = uploadDigitalFile.array("files", 20); // Max 20 files
