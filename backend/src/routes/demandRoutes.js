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
const DEFAULT_TIMEOUT_MS = 10000; // 10s default timeout

/**
 * Helper to call Python ML service with unified error handling and timeout
 */
async function callMLService(endpoint, bodyData = null, method = "POST", timeoutMs = DEFAULT_TIMEOUT_MS) {
    const url = `${ML_SERVICE_URL}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const options = {
            method,
            headers: { "Content-Type": "application/json" },
            signal: controller.signal
        };

        if (bodyData && method !== "GET") {
            options.body = JSON.stringify(bodyData);
        }

        const response = await fetch(url, options);
        clearTimeout(timer);

        const rawText = await response.text();
        let data;

        try {
            data = JSON.parse(rawText);
        } catch {
            data = {
                success: false,
                error: "Invalid JSON returned by ML microservice.",
                rawResponse: rawText.slice(0, 200)
            };
        }

        return { status: response.status, data };
    } catch (err) {
        clearTimeout(timer);

        if (err.name === "AbortError") {
            return {
                status: 504,
                data: { success: false, error: "ML Service request timed out." }
            };
        }

        const errCode = err.cause?.code || err.code;
        if (errCode === "ECONNREFUSED" || errCode === "ENOTFOUND" || errCode === "ETIMEDOUT") {
            return {
                status: 503,
                data: {
                    success: false,
                    error: "ML Service offline or unreachable.",
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
 * Base route handler to prevent 404s when navigating to /api/demand
 */
router.get("/", async (req, res) => {
    return res.json({
        success: true,
        message: "FoodLoop AI Demand Prediction API",
        available_endpoints: [
            { method: "GET", path: "/api/demand/status" },
            { method: "GET", path: "/api/demand/model-info" },
            { method: "POST", path: "/api/demand/predict" },
            { method: "POST", path: "/api/demand/batch-predict" },
            { method: "POST", path: "/api/demand/log-sale" },
            { method: "POST", path: "/api/demand/retrain" }
        ]
    });
});

/**
 * GET /api/demand/status
 */
router.get("/status", async (req, res) => {
    const mlResponse = await callMLService("/health", null, "GET");

    if (mlResponse.status === 200) {
        return res.json({
            success: true,
            message: "Connected to FoodLoop ML service.",
            ml_service: mlResponse.data
        });
    }

    return res.status(mlResponse.status).json({
        success: false,
        message: "Cannot connect to ML service.",
        hint: mlResponse.data?.hint || "Run: python ml/service/app.py"
    });
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
    
    if (!item_name || typeof original_price !== "number" || original_price < 0) {
        return res.status(400).json({
            success: false,
            error: "Validation error: 'item_name' (string) and 'original_price' (non-negative number) are required."
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
 * Takes real sales / completed order data and appends it to the ML training dataset
 */
router.post("/log-sale", async (req, res) => {
    const { item_name, units_sold } = req.body;
    if (!item_name || typeof units_sold !== "number" || units_sold < 0) {
        return res.status(400).json({
            success: false,
            error: "Validation error: 'item_name' and valid 'units_sold' (number) are required to log sales."
        });
    }

    const mlResponse = await callMLService("/log-data", req.body);
    return res.status(mlResponse.status).json(mlResponse.data);
});

/**
 * POST /api/demand/retrain
 * Retrains the Random Forest Regressor on the accumulated dataset (60s extended timeout)
 */
router.post("/retrain", async (req, res) => {
    console.log("[BACKEND] Forwarding request to retrain AI Demand model...");
    const mlResponse = await callMLService("/retrain", {}, "POST", 60000);
    return res.status(mlResponse.status).json(mlResponse.data);
});

module.exports = router;