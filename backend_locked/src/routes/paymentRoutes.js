const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const { getDBStatus } = require("../config/db");

// Helper function to dynamically retrieve PayPal OAuth2 Access Token
async function getPayPalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const apiBase = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

    if (!clientId || !clientSecret) {
        throw new Error("PayPal Sandbox credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are missing in .env");
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
        throw new Error(data.error_description || "PayPal authentication failed");
    }

    return data.access_token;
}

// GET /api/payments
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "FoodLoop AI PayPal payment service",
        configEndpoint: "/api/payments/config"
    });
});

// GET /api/payments/config
router.get("/config", (req, res) => {
    const clientId = process.env.PAYPAL_CLIENT_ID || "";
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";

    res.json({
        success: true,
        clientId: clientId,
        currency: "USD",
        hasRealCredentials: Boolean(clientId && clientSecret),
        mode: "sandbox"
    });
});

// POST /api/payments/create-order
router.post("/create-order", async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        if (!orderId || amount === undefined) {
            return res.status(400).json({
                success: false,
                error: "orderId and amount are required"
            });
        }

        const inrAmount = Number(amount);

        if (!Number.isFinite(inrAmount) || inrAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Amount must be greater than zero"
            });
        }

        // Convert INR to USD (Rate: 1 USD = 80 INR)
        const usdAmount = Number((inrAmount / 80).toFixed(2));

        if (usdAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Converted payment amount is too small"
            });
        }

        const accessToken = await getPayPalAccessToken();
        const apiBase = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

        const response = await fetch(`${apiBase}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [
                    {
                        reference_id: String(orderId),
                        description: "FoodLoop AI - Surplus Food Rescue Order",
                        amount: {
                            currency_code: "USD",
                            value: usdAmount.toFixed(2)
                        }
                    }
                ],
                application_context: {
                    brand_name: "FoodLoop AI (Anna)",
                    landing_page: "NO_PREFERENCE",
                    user_action: "PAY_NOW",
                    return_url: "http://localhost:5173",
                    cancel_url: "http://localhost:5173"
                }
            })
        });

        const paypalOrder = await response.json();

        if (!response.ok || !paypalOrder.id) {
            console.error("[PAYPAL CREATE ERROR]", paypalOrder);

            return res.status(502).json({
                success: false,
                error: "PayPal could not create the order",
                details: paypalOrder
            });
        }

        console.log("[PAYPAL SANDBOX] Created order:", paypalOrder.id);

        return res.json({
            success: true,
            mode: "sandbox",
            id: paypalOrder.id, // Required by @paypal/react-paypal-js SDK
            orderId: paypalOrder.id,
            status: paypalOrder.status,
            amount: usdAmount,
            currency: "USD"
        });

    } catch (error) {
        console.error("[PAYPAL CREATE ERROR]", error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/payments/capture-order
router.post("/capture-order", async (req, res) => {
    try {
        const { paypalOrderId, orderId } = req.body;

        if (!paypalOrderId) {
            return res.status(400).json({
                success: false,
                error: "paypalOrderId is required"
            });
        }

        if (
            typeof paypalOrderId !== "string" ||
            !/^[A-Z0-9]+$/.test(paypalOrderId)
        ) {
            return res.status(400).json({
                success: false,
                error: "Invalid PayPal order ID"
            });
        }

        const accessToken = await getPayPalAccessToken();
        const apiBase = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";

        const response = await fetch(
            `${apiBase}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const captureData = await response.json();

        if (!response.ok) {
            console.error("[PAYPAL CAPTURE ERROR]", captureData);

            return res.status(502).json({
                success: false,
                error: "PayPal payment capture failed",
                details: captureData
            });
        }

        if (captureData.status !== "COMPLETED") {
            return res.status(400).json({
                success: false,
                paymentStatus: captureData.status,
                error: "Payment has not been completed"
            });
        }

        // Update database order state upon confirmation
        if (orderId && getDBStatus()) {
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                {
                    paymentStatus: "COMPLETED",
                    orderStatus: "CONFIRMED",
                    paypalOrderId
                },
                { new: true }
            );

            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    error: "Local order was not found"
                });
            }
        }

        console.log("[PAYPAL SANDBOX] Payment completed:", paypalOrderId);

        return res.json({
            success: true,
            message: "PayPal Sandbox payment captured successfully",
            paymentStatus: "COMPLETED",
            data: captureData
        });

    } catch (error) {
        console.error("[PAYPAL CAPTURE ERROR]", error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;