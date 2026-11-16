import dns from "node:dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

let cachedConnection: Promise<typeof mongoose> | null = null;

const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!cachedConnection) {
    cachedConnection = mongoose.connect(mongoUri).catch((error) => {
      cachedConnection = null;
      throw error;
    });
  }

  await cachedConnection;

  console.log("MongoDB connected successfully");
};

export default connectDatabase;