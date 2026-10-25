import mongoose from "mongoose";

const connectDB = async (mongoUri: string) => {
  try {
    const connectionInstance = await mongoose.connect(mongoUri);

    console.info(`MongoDB connected: ${connectionInstance.connection.host}`);

    mongoose.connection.on("error", (error: Error) => {
      console.error(`MongoDB runtime connection error: ${error.message}`);
    });

    return connectionInstance.connection;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Initial MongoDB connection error: ${error.message}`);
    } else {
      console.error("Initial MongoDB connection error:", error);
    }

    throw error;
  }
};

export default connectDB;
