/**
 * FoodLoop AI (Anna) - Demand Prediction & Dynamic Retraining Routes
 * ================================================================
 * Express route handlers that:
 * 1. Serve demand predictions from Python ML microservice
 * 2. Log real customer sales and restaurant surplus data
 * 3. Trigger dynamic model retraining with updated user data
 * 4. Report model accuracy and dataset sample metrics
 */

const express = require("express");
const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

/**
 * Helper to call Python ML service
 */
async function callMLService(endpoint, bodyData, method = "POST") {
    const url = `${ML_SERVICE_URL}${endpoint}`;
    try {
        const options = {
            method,
            headers: { "Content-Type": "application/json" }
        };
        if (bodyData && method !== "GET") {
            options.body = JSON.stringify(bodyData);
        }

        const response = await fetch(url, options);
        const data = await response.json();
        return { status: response.status, data };
    } catch (err) {
        if (err.cause && (err.cause.code === "ECONNREFUSED" || err.cause.code === "ENOTFOUND")) {
            return {
                status: 503,
                data: {
                    success: false,
                    error: "ML Service offline.",
                    hint: `Run: python ml/service/app.py to start ML microservice on port 5001.`
                }
            };
        }
        return {
            status: 500,
            data: { success: false, error: `Failed to communicate with ML service: ${err.message}` }
        };
    }
}

/**
 * GET /api/demand
 * Root endpoint overview for Demand ML route
 */
router.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "FoodLoop Demand ML API is running.",
        endpoints: {
            status: "GET /api/demand/status",
            modelInfo: "GET /api/demand/model-info",
            predict: "POST /api/demand/predict",
            batchPredict: "POST /api/demand/batch-predict",
            logSale: "POST /api/demand/log-sale",
            retrain: "POST /api/demand/retrain"
        }
    });
});

/**
 * GET /api/demand/status
 */
router.get("/status", async (req, res) => {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/health`);
        const data = await response.json();
        return res.json({
            success: true,
            message: "Connected to FoodLoop ML service.",
            ml_service: data
        });
    } catch (err) {
        return res.status(503).json({
            success: false,
            message: "Cannot connect to ML service.",
            hint: "Run: python ml/service/app.py"
        });
    }
});

/**
 * GET /api/demand/model-info
 * Returns sample count and algorithm details.
 */
router.get("/model-info", async (req, res) => {
    const mlResponse = await callMLService("/model-info", null, "GET");
    return res.status(mlResponse.status).json(mlResponse.data);
});

/**
 * POST /api/demand/predict
 */
router.post("/predict", async (req, res) => {
    const { item_name, original_price } = req.body;
    if (!item_name || original_price === undefined) {
        return res.status(400).json({
            success: false,
            error: "Validation error: 'item_name' and 'original_price' are required."
        });
    }

    const mlResponse = await callMLService("/predict", req.body);
    return res.status(mlResponse.status).json(mlResponse.data);
});

/**
 * POST /api/demand/batch-predict
 */
router.post("/batch-predict", async (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            error: "Validation error: 'items' must be a non-empty array."
        });
    }

    const mlResponse = await callMLService("/batch-predict", req.body);
    return res.status(mlResponse.status).json(mlResponse.data);
});

/**
 * POST /api/demand/log-sale
 * Takes real sales / completed order data and appends it to the ML training dataset!
 */
router.post("/log-sale", async (req, res) => {
    const { item_name, units_sold } = req.body;
    if (!item_name || units_sold === undefined) {
        return res.status(400).json({
            success: false,
            error: "Validation error: 'item_name' and 'units_sold' are required to log sales."
        });
    }

    const mlResponse = await callMLService("/log-data", req.body);
    return res.status(mlResponse.status).json(mlResponse.data);
});

/**
 * POST /api/demand/retrain
 * Retrains the Random Forest Regressor on the accumulated dataset
 * so the platform adapts to real-world sales patterns!
 */
router.post("/retrain", async (req, res) => {
    console.log("[BACKEND] Forwarding request to retrain AI Demand model...");
    const mlResponse = await callMLService("/retrain", {});
    return res.status(mlResponse.status).json(mlResponse.data);
});

module.exports = router;