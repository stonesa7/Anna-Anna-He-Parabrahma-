/**
 * FoodLoop AI - Restaurant Schema
 * ===============================
 * Represents food businesses, bakeries, and cloud kitchens partnering with FoodLoop.
 */

const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Restaurant name is required"],
            trim: true
        },
        cuisine: {
            type: String,
            required: [true, "Cuisine type is required (e.g., Indian, Bakery, Fast Food)"],
            trim: true
        },
        address: {
            type: String,
            required: [true, "Address is required"]
        },
        city: {
            type: String,
            default: "Pune"
        },
        rating: {
            type: Number,
            default: 4.5,
            min: 1.0,
            max: 5.0
        },
        isOpen: {
            type: Boolean,
            default: true
        },
        contactNumber: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);

