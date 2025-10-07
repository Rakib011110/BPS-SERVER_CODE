import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.DB_URL || "";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "CADD-CORE-DB", 
    });

    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1); 
  }
};
