import mongoose from "mongoose";

const AuthSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    confirmPassword: {
        type: String,
    },
    role: {
        type: String, 
        enum: ['admin', 'student'],
        default: 'student',
    },
    phoneNumber: {
        type: Number,
        required: true,
        unique: true
    }
});

const User = mongoose.model("Auth", AuthSchema);

export default User;