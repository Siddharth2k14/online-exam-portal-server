import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectQuesDB = () => {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("Connected to questionDB successfully"))
        .catch((error) => {
            console.error("Error connecting to questionDB:", error);
            process.exit(1);
        });
};

export default connectQuesDB;