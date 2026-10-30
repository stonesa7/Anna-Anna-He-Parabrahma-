/**
 * FoodLoop AI (Anna) - Demand Prediction Routes
 * ============================================
 * Express route handlers that expose the demand prediction API to clients
 * (e.g., restaurant dashboard or inventory manager) and communicate with
 * the Python ML inference microservice.
 */

const express = require("express");
const router = express.Router();

// URL of the Python ML microservice (default: http://127.0.0.1:5001)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

/**
 * Helper function to forward requests to the Python ML microservice.
 * Uses native fetch (standard in Node.js 18+ and 24+).
 */
async function callMLService(endpoint, bodyData) {
    const url = `${ML_SERVICE_URL}${endpoint}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        return {
            status: response.status,
            data
        };
    } catch (err) {
        if (err.cause && (err.cause.code === "ECONNREFUSED" || err.cause.code === "ENOTFOUND")) {
            return {
                status: 503,
                data: {
                    success: false,
                    error: "ML Inference Service is offline.",
                    hint: "Please ensure the Python microservice is running at " + ML_SERVICE_URL + " by executing: python ml/service/app.py"
                }
            };
        }
        return {
            status: 500,
            data: {
                success: false,
                error: `Failed to communicate with ML service: ${err.message}`
            }
        };
    }
}

/**
 * GET /api/demand/status
 * Check if the Python ML microservice is online and healthy.
 */
router.get("/status", async (req, res) => {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/health`);
        const data = await response.json();
        return res.json({
            success: true,
            message: "Connected to FoodLoop ML inference service.",
            ml_service: data
        });
    } catch (err) {
        return res.status(503).json({
            success: false,
            message: "Cannot connect to ML inference service.",
            error: err.message,
            hint: "Run: python ml/service/app.py"
        });
    }
});

/**
 * POST /api/demand/predict
 * Estimate sales units for a single food item.
 *
 * Example Request Body:
 * {
 *   "item_name": "Veg Biryani",
 *   "category": "Main Course",
 *   "original_price": 180,
 *   "discount_percent": 40,
 *   "day_of_week": 5,
 *   "hour_of_day": 20,
 *   "shelf_life_hours_left": 4,
 *   "historical_average_demand": 24
 * }
 */
router.post("/predict", async (req, res) => {
    const { item_name, original_price } = req.body;

    // Beginner-friendly request validation
    if (!item_name || original_price === undefined) {
        return res.status(400).json({
            success: false,
            error: "Validation error: 'item_name' and 'original_price' are required fields."
        });
    }

    const mlResponse = await callMLService("/predict", req.body);
    return res.status(mlResponse.status).json(mlResponse.data);
});

/**
 * POST /api/demand/batch-predict
 * Estimate sales units for multiple food items at once.
 *
 * Example Request Body:
 * {
 *   "items": [
 *     { "item_name": "Veg Biryani", "original_price": 180, ... },
 *     { "item_name": "Chocolate Croissant", "original_price": 95, ... }
 *   ]
 * }
 */
router.post("/batch-predict", async (req, res) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            error: "Validation error: 'items' must be a non-empty array of food items."
        });
    }

    const mlResponse = await callMLService("/batch-predict", req.body);
    return res.status(mlResponse.status).json(mlResponse.data);
});

module.exports = router;

