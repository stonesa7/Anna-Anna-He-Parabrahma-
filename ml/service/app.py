"""
FoodLoop AI (Anna) - Demand Prediction Python Microservice
==========================================================
A lightweight HTTP API microservice that loads the trained Random Forest model
and serves real-time predictions to the FoodLoop Node.js/Express backend.

Endpoints:
  GET  /health         - Basic health status
  POST /predict        - Single food item demand prediction
  POST /batch-predict  - Multiple food items demand prediction
"""

import os
import sys
from flask import Flask, request, jsonify

# Add ml/src directory to sys.path so we can import predict module
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_src_dir = os.path.join(os.path.dirname(current_dir), "src")
sys.path.append(ml_src_dir)

from predict import predict_demand, get_model

app = Flask(__name__)

# Pre-load model on service startup
try:
    get_model()
    print("[INFO] Model loaded successfully on startup.")
except Exception as e:
    print(f"[WARN] Model could not be preloaded: {e}")

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify the service is running."""
    return jsonify({
        "status": "healthy",
        "service": "foodloop-demand-ml-service",
        "version": "1.0.0"
    }), 200

@app.route("/predict", methods=["POST"])
def predict_single():
    """
    Predict demand for a single food item.
    
    Expected JSON payload:
    {
      "item_name": "Veg Biryani",
      "category": "Main Course",
      "original_price": 180,
      "discount_percent": 30,
      "day_of_week": 4,
      "hour_of_day": 13,
      "shelf_life_hours_left": 6,
      "historical_average_demand": 24
    }
    """
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({
                "success": False,
                "error": "Missing JSON request body."
            }), 400

        # Validate basic required fields
        if not isinstance(data, dict):
            return jsonify({
                "success": False,
                "error": "Request body must be a JSON object."
            }), 400

        results = predict_demand(data)
        prediction = results[0]

        return jsonify({
            "success": True,
            "message": "Demand prediction calculated successfully.",
            "data": prediction
        }), 200

    except Exception as err:
        return jsonify({
            "success": False,
            "error": str(err)
        }), 500

@app.route("/batch-predict", methods=["POST"])
def predict_batch():
    """
    Predict demand for a list of food items.
    
    Expected JSON payload:
    {
      "items": [
        { "item_name": "Veg Biryani", "category": "Main Course", ... },
        { "item_name": "Samosa Box", "category": "Snacks", ... }
      ]
    }
    """
    try:
        data = request.get_json(force=True, silent=True)
        if not data or "items" not in data or not isinstance(data["items"], list):
            return jsonify({
                "success": False,
                "error": "Request body must contain an 'items' array."
            }), 400

        items = data["items"]
        if len(items) == 0:
            return jsonify({
                "success": True,
                "message": "No items provided.",
                "data": []
            }), 200

        predictions = predict_demand(items)

        return jsonify({
            "success": True,
            "message": f"Calculated predictions for {len(predictions)} items.",
            "data": predictions
        }), 200

    except Exception as err:
        return jsonify({
            "success": False,
            "error": str(err)
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"[START] Starting FoodLoop ML inference server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)

