import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = "mongodb://localhost:27017/";

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};
