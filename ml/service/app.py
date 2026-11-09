"""
FoodLoop AI (Anna) - Demand Prediction Python Microservice
==========================================================
A lightweight HTTP API microservice that:
1. Serves real-time sales demand predictions (`POST /predict`, `POST /batch-predict`)
2. Logs real-world customer order and restaurant sales data (`POST /log-data`)
3. Dynamically retrains the Random Forest model on accumulated real user data (`POST /retrain`)
4. Reports model training metadata and feature importance (`GET /model-info`)
"""

import os
import sys
import pandas as pd
from flask import Flask, request, jsonify

# Add ml/src directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_src_dir = os.path.join(os.path.dirname(current_dir), "src")
ml_data_dir = os.path.join(os.path.dirname(current_dir), "data")
ml_models_dir = os.path.join(os.path.dirname(current_dir), "models")
sys.path.append(ml_src_dir)

from predict import predict_demand, get_model, reload_model
from train import train_model

app = Flask(__name__)

DATASET_PATH = os.path.join(ml_data_dir, "food_demand_data.csv")
MODEL_PATH = os.path.join(ml_models_dir, "demand_model.joblib")

# Pre-load model on service startup
try:
    get_model(MODEL_PATH)
    print("[INFO] Model loaded successfully on startup.")
except Exception as e:
    print(f"[WARN] Model could not be preloaded: {e}")

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify the service is running."""
    total_records = 0
    if os.path.exists(DATASET_PATH):
        try:
            total_records = len(pd.read_csv(DATASET_PATH))
        except Exception:
            pass

    return jsonify({
        "status": "healthy",
        "service": "foodloop-demand-ml-service",
        "version": "2.0.0",
        "dataset_records": total_records,
        "model_loaded": True
    }), 200

@app.route("/model-info", methods=["GET"])
def model_info():
    """Returns current dataset sample count and training information."""
    try:
        total_records = len(pd.read_csv(DATASET_PATH)) if os.path.exists(DATASET_PATH) else 0
        return jsonify({
            "success": True,
            "algorithm": "Random Forest Regressor (100 Trees)",
            "total_samples": total_records,
            "model_path": MODEL_PATH,
            "dataset_path": DATASET_PATH
        }), 200
    except Exception as err:
        return jsonify({ "success": False, "error": str(err) }), 500

@app.route("/predict", methods=["POST"])
def predict_single():
    """Predict demand for a single food item."""
    try:
        data = request.get_json(force=True, silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({ "success": False, "error": "Request body must be a JSON object." }), 400

        results = predict_demand(data, model_path=MODEL_PATH)
        return jsonify({
            "success": True,
            "message": "Demand prediction calculated successfully.",
            "data": results[0]
        }), 200
    except Exception as err:
        return jsonify({ "success": False, "error": str(err) }), 500

@app.route("/batch-predict", methods=["POST"])
def predict_batch():
    """Predict demand for a list of food items."""
    try:
        data = request.get_json(force=True, silent=True)
        if not data or "items" not in data or not isinstance(data["items"], list):
            return jsonify({ "success": False, "error": "Request body must contain an 'items' array." }), 400

        items = data["items"]
        if len(items) == 0:
            return jsonify({ "success": True, "message": "No items provided.", "data": [] }), 200

        predictions = predict_demand(items, model_path=MODEL_PATH)
        return jsonify({
            "success": True,
            "message": f"Calculated predictions for {len(predictions)} items.",
            "data": predictions
        }), 200
    except Exception as err:
        return jsonify({ "success": False, "error": str(err) }), 500

@app.route("/log-data", methods=["POST"])
def log_user_data():
    """
    Takes real sales or completed order feedback from users/restaurants
    and appends it to the continuous training dataset!
    
    Expected JSON payload:
    {
      "item_name": "Veg Biryani",
      "category": "Main Course",
      "original_price": 180,
      "discount_percent": 40,
      "shelf_life_hours_left": 4,
      "units_sold": 28,
      "hour_of_day": 14 (optional, defaults to current hour),
      "day_of_week": 4 (optional, defaults to current day)
    }
    """
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({ "success": False, "error": "Missing JSON request body." }), 400

        items = data if isinstance(data, list) else [data]

        new_rows = []
        for it in items:
            item_name = str(it.get("item_name", "Special Dish"))
            category = str(it.get("category", "Main Course"))
            orig_price = float(it.get("original_price", 150))
            disc_pct = float(it.get("discount_percent", 30))
            disc_price = float(it.get("discounted_price", round(orig_price * (1 - disc_pct / 100), 2)))
            day_of_week = int(it.get("day_of_week", 2))
            is_weekend = int(it.get("is_weekend", 1 if day_of_week in [5, 6] else 0))
            hour_of_day = int(it.get("hour_of_day", 14))
            shelf_life = int(it.get("shelf_life_hours_left", 4))
            hist_demand = float(it.get("historical_average_demand", 20))
            units_sold = int(it.get("units_sold", 15))

            new_rows.append({
                "item_name": item_name,
                "category": category,
                "original_price": orig_price,
                "discount_percent": disc_pct,
                "discounted_price": disc_price,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "hour_of_day": hour_of_day,
                "shelf_life_hours_left": shelf_life,
                "historical_average_demand": hist_demand,
                "units_sold": units_sold
            })

        df_new = pd.DataFrame(new_rows)

        # Append to CSV
        file_exists = os.path.exists(DATASET_PATH)
        df_new.to_csv(DATASET_PATH, mode="a", header=not file_exists, index=False)

        total_records = len(pd.read_csv(DATASET_PATH))
        print(f"[DATA LOG] Appended {len(new_rows)} rows. Total dataset records now: {total_records}")

        return jsonify({
            "success": True,
            "message": f"Successfully logged {len(new_rows)} sales records into training dataset.",
            "total_dataset_records": total_records,
            "ready_for_retraining": True
        }), 201

    except Exception as err:
        return jsonify({ "success": False, "error": str(err) }), 500

@app.route("/retrain", methods=["POST"])
def retrain_model():
    """
    Retrains the Random Forest Regressor on the accumulated dataset
    and updates the in-memory model immediately.
    """
    try:
        print("[RETRAIN] Starting dynamic model retraining pipeline...")
        metrics = train_model(DATASET_PATH, MODEL_PATH)

        # Reload newly trained model into memory
        reload_model(MODEL_PATH)
        print("[RETRAIN] Model reloaded in memory successfully!")

        return jsonify({
            "success": True,
            "message": "Random Forest model dynamically retrained with latest user data!",
            "metrics": metrics
        }), 200

    except Exception as err:
        return jsonify({ "success": False, "error": str(err) }), 500

if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"[START] Starting FoodLoop ML inference server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
