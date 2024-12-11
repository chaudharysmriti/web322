const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
    userName: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    loginHistory: [
        {
            dateTime: { type: Date, default: Date.now },
            userAgent: String
        }
    ]
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
