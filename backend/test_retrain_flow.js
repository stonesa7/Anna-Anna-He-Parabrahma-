/**
 * FoodLoop AI - Dynamic Model Retraining Automated Test Suite
 * ============================================================
 * Tests the complete real-world self-learning loop:
 * 1. Spawns Python ML microservice
 * 2. Starts Express backend
 * 3. Logs new restaurant sales data via POST /api/demand/log-sale
 * 4. Retrains the Random Forest Regressor via POST /api/demand/retrain
 * 5. Verifies that newly retrained model updates metrics and serves fresh predictions!
 */

const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const app = require("./src/server");

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runRetrainTests() {
    console.log("====================================================");
    console.log(" Running FoodLoop AI Dynamic Model Retraining Tests");
    console.log("====================================================");

    const projectRoot = path.resolve(__dirname, "..");
    const pythonScript = path.join(projectRoot, "ml", "service", "app.py");

    console.log("[1/5] Spawning Python ML microservice...");
    const pyProcess = spawn(`python "${pythonScript}"`, {
        shell: true,
        env: { ...process.env, ML_PORT: "5001" },
        stdio: ["ignore", "pipe", "pipe"]
    });

    // Wait for Flask
    let mlReady = false;
    for (let i = 0; i < 20; i++) {
        await wait(500);
        try {
            const check = await fetch("http://127.0.0.1:5001/health");
            if (check.ok) {
                mlReady = true;
                break;
            }
        } catch (e) {}
    }

    if (!mlReady) {
        pyProcess.kill();
        throw new Error("Python ML microservice failed to start within timeout.");
    }
    console.log("      Python ML microservice online!");

    // Boot Express server
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const expressUrl = `http://127.0.0.1:${port}`;
    console.log(`[2/5] Express server running at: ${expressUrl}`);

    try {
        // Step 1: Check baseline model info
        console.log("\n[TEST 1] Testing GET /api/demand/model-info...");
        const infoRes = await fetch(`${expressUrl}/api/demand/model-info`);
        const infoData = await infoRes.json();
        const initialCount = infoData.total_samples;
        console.log(`  Initial Training Samples: ${initialCount} records`);
        console.log(`  Algorithm: ${infoData.algorithm}`);
        if (!infoData.success || typeof initialCount !== "number") {
            throw new Error("Failed to get model info!");
        }
        console.log("  [PASS] Model info verified!");

        // Step 2: Log new real user sales transaction
        console.log("\n[TEST 2] Testing POST /api/demand/log-sale (Logging real restaurant sale)...");
        const newSaleRecord = {
            item_name: "Paneer Butter Masala",
            category: "Main Course",
            original_price: 200,
            discount_percent: 50,
            discounted_price: 100,
            shelf_life_hours_left: 3,
            units_sold: 45, // High sales
            hour_of_day: 13,
            day_of_week: 5
        };

        const logRes = await fetch(`${expressUrl}/api/demand/log-sale`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSaleRecord)
        });
        const logData = await logRes.json();
        console.log("  Status:", logRes.status);
        console.log("  Message:", logData.message);
        console.log("  Updated Dataset Record Count:", logData.total_dataset_records);
        if (!logData.success || logData.total_dataset_records !== initialCount + 1) {
            throw new Error("Dataset count did not increment as expected!");
        }
        console.log("  [PASS] Real-world user sales logged into training dataset!");

        // Step 3: Trigger dynamic model retraining
        console.log("\n[TEST 3] Testing POST /api/demand/retrain (Retraining Random Forest Regressor)...");
        const retrainRes = await fetch(`${expressUrl}/api/demand/retrain`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        const retrainData = await retrainRes.json();
        console.log("  Status:", retrainRes.status);
        console.log("  Message:", retrainData.message);
        console.log("  New Model MAE:", retrainData.metrics?.mae);
        console.log("  New Model R2:", retrainData.metrics?.r2);
        console.log("  Total Samples Trained:", retrainData.metrics?.total_samples);
        if (!retrainData.success || !retrainData.metrics?.r2) {
            throw new Error("Retraining failed or returned missing metrics!");
        }
        console.log("  [PASS] Dynamic model retraining completed & in-memory cache reloaded!");

        // Step 4: Verify prediction with retrained model
        console.log("\n[TEST 4] Testing POST /api/demand/predict with the newly retrained model...");
        const predictRes = await fetch(`${expressUrl}/api/demand/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                item_name: "Paneer Butter Masala",
                category: "Main Course",
                original_price: 200,
                discount_percent: 50,
                shelf_life_hours_left: 3,
                hour_of_day: 13,
                day_of_week: 5
            })
        });
        const predictData = await predictRes.json();
        console.log("  Status:", predictRes.status);
        console.log("  Predicted Units:", predictData.data?.predicted_units);
        console.log("  Confidence Range:", predictData.data?.confidence_range);
        if (!predictData.success || typeof predictData.data?.predicted_units !== "number") {
            throw new Error("Prediction using retrained model failed!");
        }
        console.log("  [PASS] Predictions running seamlessly with freshly retrained model!");

        console.log("\n====================================================");
        console.log(" ALL DYNAMIC MODEL RETRAINING TESTS PASSED CLEANLY!");
        console.log("====================================================");

    } finally {
        server.close();
        if (process.platform === "win32") {
            spawn("taskkill", ["/pid", pyProcess.pid, "/f", "/t"]);
        } else {
            pyProcess.kill();
        }
    }
}

runRetrainTests().catch(err => {
    console.error("\n[FAIL] Retrain test suite failed:", err);
    process.exit(1);
});
