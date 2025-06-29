import mongoose from "mongoose";
import dotenv from "dotenv";
import process from "process";

dotenv.config();

const connectAuthDB = () => {
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("Connected to authDB successfully");
    }).catch((error) => {
        console.error("Error connecting to authDB:", error);
        process.exit(1);
    });
};

export default connectAuthDB;