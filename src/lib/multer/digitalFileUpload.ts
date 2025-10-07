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

// File filter for digital files (accept common file types)
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Define allowed file types for digital products
  const allowedMimeTypes = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",

    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/gzip",

    // Images (for digital art, graphics)
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "image/webp",

    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",

    // Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",

    // Code/Text files
    "application/json",
    "application/javascript",
    "text/html",
    "text/css",
  ];

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    file.mimetype.startsWith("application/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type ${file.mimetype} is not allowed for digital products!`
      )
    );
  }
};

// Multer configuration for digital file upload
export const uploadDigitalFile = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for digital files
  },
  fileFilter: fileFilter,
});

// For single digital file
export const uploadSingleDigitalFile = uploadDigitalFile.single("file");

// For multiple digital files
export const uploadMultipleDigitalFiles = uploadDigitalFile.array("files", 20); // Max 20 files
