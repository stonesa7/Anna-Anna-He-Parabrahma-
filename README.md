# FoodLoop AI (Anna — Anna He Parabrahma)
## Demand Prediction Model & API Integration

Welcome to the **FoodLoop AI Demand Prediction** component!

This module predicts how many units of surplus food items a restaurant or bakery is likely to sell within a specific future time window (e.g., lunch rush, evening snack, or dinner surplus). Accurate demand prediction enables businesses to reduce commercial food waste, optimize discount pricing, and make quality meals affordable for the community.

Developed on branch: **`feature/demand-prediction`**

---

## 1. Architecture & Design

To keep development clean, independent, and modular, the project is structured in two decoupled tiers:

```
+-----------------------------------------------------------+
|               FoodLoop Node.js/Express Backend            |
|                     (Runs on Port 5000)                   |
|                                                           |
|       Client / Dashboard / Mobile App                     |
|                      │                                    |
|                      ▼                                    |
|       POST /api/demand/predict                            |
+----------------------┬------------------------------------+
                       │ HTTP Internal Forwarding
                       ▼
+-----------------------------------------------------------+
|              Python ML Inference Microservice             |
|                     (Runs on Port 5001)                   |
|                                                           |
|       POST /predict                                       |
|       POST /batch-predict                                 |
|                      │                                    |
|                      ▼                                    |
|       Loads 'demand_model.joblib'                         |
|       Executes Random Forest Pipeline                     |
+-----------------------------------------------------------+
                       ▲
                       │ Trained Offline
+----------------------┴------------------------------------+
|               Machine Learning Pipeline                   |
|                                                           |
|  1. Data Generator: ml/data/generate_data.py              |
|  2. Training Script: ml/src/train.py                      |
|  3. Model Artifact: ml/models/demand_model.joblib         |
+-----------------------------------------------------------+
```

### Why Random Forest Regression?
- **Ensemble Learning**: Instead of relying on a single rule or tree, Random Forest builds an ensemble of 100 decision trees and computes their average, drastically cutting down on prediction variance and overfitting.
- **Mixed Feature Handling**: Handles both categorical variables (`item_name`, `category`) and numerical variables (`discount_percent`, `shelf_life_hours_left`, `hour_of_day`) seamlessly.
- **Explainability**: Allows inspecting feature importances so restaurant operators can understand *why* demand spikes or drops.

---

## 2. Project Structure

```text
Anna-Anna-He-Parabrahma-/
├── backend/
│   ├── package.json               # Node.js dependencies (express, cors, dotenv)
│   ├── .env.example               # Configuration template (PORT, ML_SERVICE_URL)
│   ├── test_api.js                # Integration test for backend API endpoints
│   └── src/
│       ├── server.js              # Express main entry point
│       └── routes/
│           └── demandRoutes.js    # Routes: /api/demand/predict & /api/demand/batch-predict
│
├── ml/
│   ├── requirements.txt           # Python libraries (scikit-learn, pandas, numpy, flask, joblib)
│   ├── test_prediction.py         # Automated verification tests for ML model logic
│   ├── data/
│   │   ├── generate_data.py       # Script to simulate realistic restaurant surplus sales
│   │   └── food_demand_data.csv   # Historical sales dataset (4,000 records)
│   ├── models/
│   │   └── demand_model.joblib    # Exported trained Random Forest pipeline
│   ├── src/
│   │   ├── train.py               # Complete ML training & evaluation script
│   │   └── predict.py             # Reusable inference function with in-memory caching
│   └── service/
│       └── app.py                 # Lightweight Flask HTTP microservice (Port 5001)
│
├── .gitignore                     # Excludes node_modules, __pycache__, model binaries, .env
└── README.md                      # Complete documentation and beginner's guide
```

---

## 3. Model Performance & Evaluation Metrics

The model was evaluated on an unseen 20% test split (800 transactions):

| Metric | Value | Beginner Explanation |
| :--- | :--- | :--- |
| **Mean Absolute Error (MAE)** | **2.36 units** | On average, predictions are off by only ~2.3 food portions. |
| **Root Mean Squared Error (RMSE)** | **2.99 units** | Measures average magnitude of error, penalizing rare large misses. |
| **$R^2$ Score (Goodness of Fit)** | **0.9255 (92.6%)** | The model explains 92.6% of the variance in food sales demand. |

### Top Influential Demand Drivers:
1. **Historical Average Demand (44.0%)**: Baseline item popularity is the strongest foundation.
2. **Hour of Day (26.1%)**: Lunch rush (12:00–14:00) and dinner rush (19:00–21:00) experience massive surge.
3. **Discount Percentage (8.7%)**: Deeper discounts significantly drive purchase volume for surplus food.
4. **Original Price (4.7%)**: Items in higher price brackets have different demand curves.
5. **Day of Week & Weekend (8.0% combined)**: Weekend dining habits increase overall demand.
6. **Shelf Life Remaining (3.0%)**: Short shelf life (< 3 hours) triggers flash-sale purchasing behavior.

---

## 4. Step-by-Step Setup & Usage Guide

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18+ or 24+

---

### Step 1: Install Python Dependencies
```bash
python -m pip install -r ml/requirements.txt
```

---

### Step 2: Generate Data & Train the Model (Optional / If re-training)
```bash
# 1. Generate fresh historical data
python ml/data/generate_data.py

# 2. Train the Random Forest Regressor and export demand_model.joblib
python ml/src/train.py
```

---

### Step 3: Run the Automated ML Test Suite
Verify that the model satisfies demand elasticity, weekend surge, and edge cases:
```bash
python ml/test_prediction.py
```
Expected output:
```text
[PASS] TEST 1 PASSED! (Single item lunch rush)
[PASS] TEST 2 PASSED! (Discount elasticity: 60% discount > 20% discount)
[PASS] TEST 3 PASSED! (Weekend traffic boost)
[PASS] TEST 4 PASSED! (Unseen new item resilience)
[PASS] TEST 5 PASSED! (Batch prediction)
ALL TESTS COMPLETED SUCCESSFULLY!
```

---

### Step 4: Start the Python ML Inference Microservice
```bash
python ml/service/app.py
```
This starts the microservice on **`http://localhost:5001`**.

---

### Step 5: Start the Express Backend
Open a new terminal window:
```bash
cd backend
npm install
node src/server.js
```
The Express backend starts on **`http://localhost:5000`**.

---

## 5. API Reference & Sample Payloads

### 1. Single Item Demand Prediction
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/demand/predict`
- **Headers:** `Content-Type: application/json`

**Sample Request Body:**
```json
{
  "item_name": "Veg Biryani",
  "category": "Main Course",
  "original_price": 180,
  "discount_percent": 40,
  "day_of_week": 4,
  "hour_of_day": 20,
  "shelf_life_hours_left": 4,
  "historical_average_demand": 24
}
```

**Sample Response (200 OK):**
```json
{
  "success": true,
  "message": "Demand prediction calculated successfully.",
  "data": {
    "item_name": "Veg Biryani",
    "predicted_units": 43,
    "confidence_range": {
      "min": 40,
      "max": 46
    },
    "input_features": {
      "category": "Main Course",
      "original_price": 180.0,
      "discount_percent": 40.0,
      "discounted_price": 108.0,
      "hour_of_day": 20,
      "day_of_week": 4,
      "shelf_life_hours_left": 4
    }
  }
}
```

---

### 2. Multi-Item Batch Prediction
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/demand/batch-predict`
- **Headers:** `Content-Type: application/json`

**Sample Request Body:**
```json
{
  "items": [
    {
      "item_name": "Chocolate Croissant",
      "category": "Bakery",
      "original_price": 95,
      "discount_percent": 50,
      "hour_of_day": 17
    },
    {
      "item_name": "Veg Burger Combo",
      "category": "Snacks",
      "original_price": 130,
      "discount_percent": 30,
      "hour_of_day": 18
    }
  ]
}
```

---

### 3. Service Status Check
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/demand/status`

**Sample Response:**
```json
{
  "success": true,
  "message": "Connected to FoodLoop ML inference service.",
  "ml_service": {
    "service": "foodloop-demand-ml-service",
    "status": "healthy",
    "version": "1.0.0"
  }
}
```

---

## 6. Git Workflow & Merging via Pull Request

All development has been done on `feature/demand-prediction` without altering `main`.

When you are ready to merge this feature into the main project:
1. Review all modified and created files using `git status`.
2. Commit your changes:
   ```bash
   git add .
   git commit -m "feat(demand-prediction): implement Random Forest model and Express integration API"
   ```
3. Push to your remote repository:
   ```bash
   git push -u origin feature/demand-prediction
   ```
4. On GitHub, open a **Pull Request** from `feature/demand-prediction` into `main`.

