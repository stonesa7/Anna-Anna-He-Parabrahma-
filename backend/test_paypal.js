/**
 * FoodLoop AI - PayPal Integration Automated Test Suite
 * ======================================================
 * Tests PayPal Sandbox order creation and payment capture flow.
 */

const http = require("http");
const app = require("./src/server");

async function runTests() {
    console.log("====================================================");
    console.log(" Running FoodLoop AI PayPal Integration Tests");
    console.log("====================================================");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[SETUP] Test server running on ${baseUrl}`);

    try {
        // Test 1: Validation on missing fields
        console.log("\n[TEST 1] Testing POST /api/payments/create-order validation...");
        const badRes = await fetch(`${baseUrl}/api/payments/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
        const badData = await badRes.json();
        console.log("  Status:", badRes.status);
        console.log("  Error:", badData.error);
        if (badRes.status !== 400) {
            throw new Error("Validation check should have returned 400!");
        }
        console.log("  [PASS] Missing parameter validation verified!");

        // Test 2: Create PayPal order
        console.log("\n[TEST 2] Testing POST /api/payments/create-order...");
        const createRes = await fetch(`${baseUrl}/api/payments/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId: "ord_demo_test",
                amount: 144,
                currency: "USD"
            })
        });
        const createData = await createRes.json();
        console.log("  Status:", createRes.status);
        console.log("  PayPal Order ID:", createData.orderId);
        console.log("  Mode:", createData.mode);
        if (createRes.status !== 200 || !createData.orderId) {
            throw new Error("Failed to create PayPal order!");
        }
        console.log("  [PASS] PayPal order creation verified!");

        // Test 3: Capture PayPal payment
        console.log("\n[TEST 3] Testing POST /api/payments/capture-order...");
        const captureRes = await fetch(`${baseUrl}/api/payments/capture-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                paypalOrderId: createData.orderId,
                orderId: "ord_demo_test"
            })
        });
        const captureData = await captureRes.json();
        console.log("  Status:", captureRes.status);
        console.log("  Capture Status:", captureData.paymentStatus);
        console.log("  Capture ID:", captureData.data?.id);
        if (captureRes.status !== 200 || captureData.paymentStatus !== "COMPLETED") {
            throw new Error("Failed to capture PayPal payment!");
        }
        console.log("  [PASS] PayPal payment capture verified!");

        console.log("\n====================================================");
        console.log(" ALL PAYPAL INTEGRATION TESTS PASSED CLEANLY!");
        console.log("====================================================");

    } finally {
        server.close();
    }
}

runTests().catch(err => {
    console.error("\n[FAIL] Test encountered error:", err);
    process.exit(1);
});
