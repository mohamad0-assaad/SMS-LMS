import mongoose from "mongoose";

// connect our db
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL as string, {
      maxPoolSize: 10,          // keep 10 connections warm in the pool
      minPoolSize: 2,           // never drop below 2
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1); // Exit process with failure
  }
};