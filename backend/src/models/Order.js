/**
 * FoodLoop AI - Order Schema
 * ==========================
 * Records food orders placed by customers.
 */

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    foodItemId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    isSurplus: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const orderSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true
        },
        customerEmail: {
            type: String,
            required: [true, "Customer email is required"],
            trim: true
        },
        restaurantId: {
            type: String,
            required: [true, "Restaurant ID is required"]
        },
        restaurantName: {
            type: String,
            default: ""
        },
        items: {
            type: [orderItemSchema],
            required: [true, "At least one item is required in the order"],
            validate: [v => Array.isArray(v) && v.length > 0, "Order must contain at least 1 item"]
        },
        totalAmount: {
            type: Number,
            required: [true, "Total amount is required"],
            min: 0
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
            default: "PENDING"
        },
        orderStatus: {
            type: String,
            enum: ["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"],
            default: "PLACED"
        },
        paypalOrderId: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);

