/**
 * FoodLoop AI - Order Food Routes
 * ===============================
 * Handles placing customer orders and tracking order status.
 */

const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { getDBStatus } = require("../config/db");
const initialData = require("../data/initialData.json");

// In-Memory store for when running in development mode without MongoDB
const inMemoryOrders = [];

/**
 * POST /api/orders
 * Place a new food order.
 * 
 * Expected JSON payload:
 * {
 *   "customerName": "Anjali Patil",
 *   "customerEmail": "anjali@example.com",
 *   "restaurantId": "rest_1",
 *   "items": [
 *     { "foodItemId": "food_101", "name": "Veg Biryani", "price": 180, "quantity": 2 }
 *   ]
 * }
 */
router.post("/", async (req, res) => {
    try {
        const { customerName, customerEmail, restaurantId, items } = req.body;

        // 1. Validation
        if (!customerName || !customerEmail || !restaurantId) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: customerName, customerEmail, and restaurantId are mandatory."
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid order: 'items' must be a non-empty array of food items."
            });
        }

        // 2. Calculate total amount
        let calculatedTotal = 0;
        const validatedItems = [];

        for (const it of items) {
            if (!it.name || it.price === undefined || !it.quantity || it.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid item structure: each item must have 'name', 'price', and 'quantity' > 0.`
                });
            }

            const itemTotal = Number(it.price) * Number(it.quantity);
            calculatedTotal += itemTotal;

            validatedItems.push({
                foodItemId: String(it.foodItemId || `item_${Date.now()}`),
                name: String(it.name),
                price: Number(it.price),
                quantity: Number(it.quantity),
                isSurplus: Boolean(it.isSurplus || false)
            });
        }

        // Lookup restaurant name
        const rest = initialData.restaurants.find(r => r.id === restaurantId);
        const restaurantName = rest ? rest.name : "Partner Restaurant";

        // 3. Save order (MongoDB or In-Memory)
        if (getDBStatus()) {
            const dbOrder = await Order.create({
                customerName,
                customerEmail,
                restaurantId,
                restaurantName,
                items: validatedItems,
                totalAmount: calculatedTotal,
                paymentStatus: "PENDING",
                orderStatus: "PLACED"
            });

            return res.status(201).json({
                success: true,
                message: "Order placed successfully! Awaiting payment.",
                source: "mongodb",
                data: dbOrder
            });
        }

        // In-Memory Order
        const newOrder = {
            _id: `ord_${Date.now()}`,
            customerName,
            customerEmail,
            restaurantId,
            restaurantName,
            items: validatedItems,
            totalAmount: calculatedTotal,
            paymentStatus: "PENDING",
            orderStatus: "PLACED",
            createdAt: new Date().toISOString()
        };

        inMemoryOrders.push(newOrder);

        return res.status(201).json({
            success: true,
            message: "Order placed successfully! Awaiting payment.",
            source: "in-memory",
            data: newOrder
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/orders
 * Retrieve list of all orders.
 */
router.get("/", async (req, res) => {
    try {
        if (getDBStatus()) {
            const orders = await Order.find().sort({ createdAt: -1 });
            return res.json({ success: true, count: orders.length, source: "mongodb", data: orders });
        }

        return res.json({
            success: true,
            count: inMemoryOrders.length,
            source: "in-memory",
            data: inMemoryOrders
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/orders/:id
 * Retrieve details and status of a specific order.
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (getDBStatus()) {
            const order = await Order.findById(id);
            if (!order) {
                return res.status(404).json({ success: false, error: "Order not found." });
            }
            return res.json({ success: true, source: "mongodb", data: order });
        }

        const order = inMemoryOrders.find(o => o._id === id);
        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found." });
        }

        return res.json({ success: true, source: "in-memory", data: order });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PATCH /api/orders/:id/status
 * Update order preparation status (e.g., PLACED -> PREPARING -> COMPLETED).
 */
router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        const allowedStatuses = ["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"];
        if (!orderStatus || !allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
            });
        }

        if (getDBStatus()) {
            const updated = await Order.findByIdAndUpdate(
                id,
                { orderStatus },
                { new: true }
            );
            if (!updated) {
                return res.status(404).json({ success: false, error: "Order not found." });
            }
            return res.json({ success: true, message: "Order status updated.", data: updated });
        }

        const order = inMemoryOrders.find(o => o._id === id);
        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found." });
        }

        order.orderStatus = orderStatus;
        return res.json({ success: true, message: "Order status updated.", data: order });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

