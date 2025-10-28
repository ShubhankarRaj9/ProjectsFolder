const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  instituteEmailId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["student", "admin", "faculty"],
    default: "student",
  },
  
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
