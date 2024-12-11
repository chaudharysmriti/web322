const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./users');  // Import the User model
require('dotenv').config(); // Load environment variables from .env

// Initialize the database connection
function initialize() {
    return new Promise((resolve, reject) => {
        mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => {
                console.log("Connected to MongoDB via auth-service");
                resolve();
            })
            .catch(err => {
                console.error("Error connecting to MongoDB via auth-service:", err);
                reject(err);
            });
    });
}

// Register user function with password hashing
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // Validate that passwords match
        if (userData.password !== userData.password2) {
            return reject("Passwords do not match");
        }

        // Hash the password
        bcrypt.hash(userData.password, 10)
            .then(hash => {
                // Create a new user with the hashed password
                const newUser = new User({
                    userName: userData.userName,
                    email: userData.email,
                    password: hash
                });

                // Save the new user to the database
                return newUser.save();
            })
            .then(() => {
                resolve();
            })
            .catch(err => {
                if (err.code === 11000) { // Duplicate key error
                    reject("User Name already taken");
                } else {
                    reject("There was an error creating the user: " + err);
                }
            });
    });
}

// Check user function with password comparison
function checkUser(userData) {
    return new Promise((resolve, reject) => {
        // Find the user by userName
        User.findOne({ userName: userData.userName })
            .then(user => {
                if (!user) {
                    return reject("Unable to find user: " + userData.userName);
                }

                // Compare the entered password with the hashed password
                return bcrypt.compare(userData.password, user.password)
                    .then(result => {
                        if (result) {
                            // Update login history
                            if (user.loginHistory.length === 8) {
                                user.loginHistory.pop(); // Remove the oldest entry
                            }
                            user.loginHistory.unshift({
                                dateTime: new Date(),
                                userAgent: userData.userAgent
                            });

                            // Save the updated user document
                            return user.save()
                                .then(() => resolve(user));
                        } else {
                            return reject(`Incorrect Password for user: ${userData.userName}`);
                        }
                    });
            })
            .catch(err => {
                reject("There was an error verifying the user: " + err);
            });
    });
}

// Export the functions
module.exports = { initialize, registerUser, checkUser };
