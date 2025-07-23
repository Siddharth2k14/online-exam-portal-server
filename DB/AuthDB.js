import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import process from "process";

let isConnected = false;

const connectAuthDB = async () => {
    try {
        if (isConnected) return;
        
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log("Connected to authDB successfully");
    } catch (error) {
        console.error("Database connection error:", error);
        throw error;
    }
};

export default connectAuthDB;