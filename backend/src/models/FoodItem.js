/**
 * FoodLoop AI - FoodItem Schema
 * =============================
 * Represents items on a restaurant's menu.
 * 
 * Contains properties for:
 * 1. Standard Menu Items (regular dining / takeaway)
 * 2. Surplus / Rescue Items (discounted to prevent food waste)
 */

const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        },
        name: {
            type: String,
            required: [true, "Food item name is required"],
            trim: true
        },
        category: {
            type: String,
            enum: ["Main Course", "Snacks", "Bakery", "Salads", "Desserts", "Beverages"],
            default: "Main Course"
        },
        description: {
            type: String,
            default: ""
        },
        originalPrice: {
            type: Number,
            required: [true, "Original price is required"],
            min: 0
        },
        isVegetarian: {
            type: Boolean,
            default: true
        },
        inStock: {
            type: Boolean,
            default: true
        },

        // --- FoodLoop Rescue Food Specific Properties ---
        isSurplus: {
            type: Boolean,
            default: false
        },
        discountPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 90
        },
        discountedPrice: {
            type: Number,
            default: function() {
                if (this.discountPercent > 0) {
                    return Math.round(this.originalPrice * (1 - this.discountPercent / 100));
                }
                return this.originalPrice;
            }
        },
        shelfLifeHoursLeft: {
            type: Number,
            default: 24
        },
        availableQuantity: {
            type: Number,
            default: 15,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);

