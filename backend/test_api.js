/**
 * FoodLoop AI Backend - Automated Integration Test
 * ===============================================
 * Tests the Express server endpoints without requiring an open external port.
 */

const app = require("./src/server");
const http = require("http");

async function runTests() {
    console.log("====================================================");
    console.log(" Running FoodLoop AI Backend Integration Tests");
    console.log("====================================================");

    // Start server on an ephemeral random port for testing
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[SETUP] Test server running on ${baseUrl}`);

    try {
        // Test 1: Health check endpoint
        console.log("\n[TEST 1] Testing GET /api/health...");
        const healthRes = await fetch(`${baseUrl}/api/health`);
        const healthData = await healthRes.json();
        console.log("  Status:", healthRes.status);
        console.log("  Response:", healthData);
        if (healthRes.status !== 200 || !healthData.success) {
            throw new Error("Health check endpoint failed!");
        }
        console.log("  [PASS] GET /api/health verified!");

        // Test 2: Validation check - Missing required fields
        console.log("\n[TEST 2] Testing POST /api/demand/predict validation (missing item_name)...");
        const badRes = await fetch(`${baseUrl}/api/demand/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ discount_percent: 30 }) // missing item_name & price
        });
        const badData = await badRes.json();
        console.log("  Status:", badRes.status);
        console.log("  Error message:", badData.error);
        if (badRes.status !== 400) {
            throw new Error("Validation check should have returned 400 Bad Request");
        }
        console.log("  [PASS] Request validation verified!");

        // Test 3: 404 Route check
        console.log("\n[TEST 3] Testing 404 handler for undefined route...");
        const notFoundRes = await fetch(`${baseUrl}/api/unknown-route`);
        const notFoundData = await notFoundRes.json();
        console.log("  Status:", notFoundRes.status);
        if (notFoundRes.status !== 404) {
            throw new Error("Expected 404 for undefined route");
        }
        console.log("  [PASS] 404 handler verified!");

        console.log("\n====================================================");
        console.log(" ALL BACKEND INTEGRATION TESTS PASSED!");
        console.log("====================================================");

    } finally {
        server.close();
    }
}

runTests().catch((err) => {
    console.error("\n[FAIL] Test suite failed:", err);
    process.exit(1);
});

