/**
 * FoodLoop AI - End-to-End Test Suite
 * ===================================
 * Starts the Python ML microservice, boots the Express backend,
 * tests the full request lifecycle from Express -> Python -> Model -> Express -> Client,
 * and then shuts down both cleanly.
 */

const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const app = require("./src/server");

async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runEndToEndTest() {
    console.log("====================================================");
    console.log(" Running FoodLoop AI End-to-End Integration Test");
    console.log("====================================================");

    const projectRoot = path.resolve(__dirname, "..");
    const pythonScript = path.join(projectRoot, "ml", "service", "app.py");

    console.log("[1/4] Spawning Python ML microservice...");
    const pyProcess = spawn("python", [pythonScript], {
        shell: true,
        env: { ...process.env, ML_PORT: "5001" },
        stdio: ["ignore", "pipe", "pipe"]
    });

    pyProcess.stdout.on("data", (data) => {
        console.log(`[Python ML] ${data.toString().trim()}`);
    });
    pyProcess.stderr.on("data", (data) => {
        console.error(`[Python ML ERR] ${data.toString().trim()}`);
    });

    // Poll until Python ML microservice is ready (up to 10 seconds)
    console.log("[2/4] Waiting for Python ML service to become ready...");
    let mlReady = false;
    for (let i = 0; i < 20; i++) {
        await wait(500);
        try {
            const check = await fetch("http://127.0.0.1:5001/health");
            if (check.ok) {
                mlReady = true;
                break;
            }
        } catch (e) {
            // still starting up
        }
    }

    if (!mlReady) {
        pyProcess.kill();
        throw new Error("Python ML microservice failed to start within timeout.");
    }
    console.log("      Python ML service is online and healthy!");

    // Boot Express server
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const expressUrl = `http://127.0.0.1:${port}`;
    console.log(`[3/4] Express server running at: ${expressUrl}`);

    try {
        // Test 1: ML status through Express
        console.log("\n[TEST 1] Testing GET /api/demand/status via Express...");
        const statusRes = await fetch(`${expressUrl}/api/demand/status`);
        const statusData = await statusRes.json();
        console.log("  Status response:", statusData);
        if (!statusData.success) {
            throw new Error("Failed to connect to ML service through Express!");
        }
        console.log("  [PASS] ML microservice connectivity confirmed!");

        // Test 2: Single item prediction through Express
        console.log("\n[TEST 2] Testing POST /api/demand/predict (Veg Biryani dinner rush)...");
        const predictPayload = {
            item_name: "Veg Biryani",
            category: "Main Course",
            original_price: 180,
            discount_percent: 40,
            day_of_week: 5,
            hour_of_day: 20,
            shelf_life_hours_left: 4,
            historical_average_demand: 24
        };
        const predictRes = await fetch(`${expressUrl}/api/demand/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(predictPayload)
        });
        const predictData = await predictRes.json();
        console.log("  Status:", predictRes.status);
        console.log("  Predicted Units:", predictData.data?.predicted_units);
        console.log("  Confidence Range:", predictData.data?.confidence_range);
        if (!predictData.success || typeof predictData.data?.predicted_units !== "number") {
            throw new Error("Single prediction failed or returned invalid format!");
        }
        console.log("  [PASS] Single item prediction succeeded!");

        // Test 3: Batch prediction through Express
        console.log("\n[TEST 3] Testing POST /api/demand/batch-predict...");
        const batchPayload = {
            items: [
                { item_name: "Chocolate Croissant", category: "Bakery", original_price: 95, discount_percent: 50 },
                { item_name: "Veg Burger Combo", category: "Snacks", original_price: 130, discount_percent: 30 }
            ]
        };
        const batchRes = await fetch(`${expressUrl}/api/demand/batch-predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(batchPayload)
        });
        const batchData = await batchRes.json();
        console.log("  Status:", batchRes.status);
        console.log(`  Received predictions for ${batchData.data?.length} items.`);
        if (!batchData.success || batchData.data?.length !== 2) {
            throw new Error("Batch prediction failed or returned unexpected count!");
        }
        console.log("  [PASS] Batch prediction succeeded!");

        console.log("\n====================================================");
        console.log(" ALL END-TO-END TESTS PASSED CLEANLY!");
        console.log("====================================================");

    } finally {
        server.close();
        // Gracefully kill Python process tree on Windows
        if (process.platform === "win32") {
            spawn("taskkill", ["/pid", pyProcess.pid, "/f", "/t"]);
        } else {
            pyProcess.kill();
        }
    }
}

runEndToEndTest().catch((err) => {
    console.error("\n[FAIL] End-to-end test encountered error:", err);
    process.exit(1);
});
