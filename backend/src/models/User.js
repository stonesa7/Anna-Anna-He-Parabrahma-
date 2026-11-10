/**
 * FoodLoop AI - User Schema
 * =========================
 * Represents customers and restaurant managers on FoodLoop AI.
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "User name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email address is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            default: ""
        },
        role: {
            type: String,
            enum: ["customer", "restaurant_owner", "admin"],
            default: "customer"
        }
    },
    {
        timestamps: true // Automatically creates createdAt and updatedAt
    }
);

module.exports = mongoose.model("User", userSchema);

