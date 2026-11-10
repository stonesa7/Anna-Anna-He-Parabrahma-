# FoodLoop AI (Anna — Anna He Parabrahma)
## Full-Stack Architecture, APIs & Integration Guide

FoodLoop AI connects restaurants and food businesses with customers to reduce commercial food waste while making meals affordable.

---

## 1. Git Branch Roadmap & Team Division

| Branch | Purpose | Status on Remote (`origin`) |
| :--- | :--- | :--- |
| `feature/demand-prediction` | Random Forest ML model & Flask microservice | Pushed to GitHub |
| `feature/ai-ml-frontend` | Friend's React Frontend merged with Database | Pushed to GitHub |
| `feature/rescue-food` | Surplus food listings, discount filters & AI hook | Pushed to GitHub |
| `feature/paypal-checkout` | PayPal Sandbox order creation & capture | Pushed to GitHub |
| `feature/full-integration` | Complete connected platform (UI + Backend + ML) | Pushed to GitHub |

---

## 2. Platform Architecture

```text
       React + Vite Frontend (Port 5173)
       [ Browse Menus · Rescue Deals · PayPal Checkout · AI Predictor ]
                        │
                        │ HTTP REST (Port 5000)
                        ▼
       Node.js + Express Backend
       ├── /api/restaurants    -> Restaurant listings & Menus
       ├── /api/orders         -> Order placement & tracking
       ├── /api/rescue         -> Surplus food deals & urgency countdowns
       ├── /api/payments       -> PayPal Sandbox Create & Capture Order
       └── /api/demand         -> Forwards to Python ML service
                        │
                        │ HTTP REST (Port 5001)
                        ▼
       Python ML Microservice (Flask)
       └── POST /predict       -> Scikit-Learn Random Forest Regressor
```

---

## 3. How to Run the Complete FoodLoop AI Platform

### Step 1: Start Python ML Microservice (Terminal 1)
```bash
python ml/service/app.py
```
*Runs on `http://127.0.0.1:5001`.*

### Step 2: Start Express Backend (Terminal 2)
```bash
cd backend
node src/server.js
```
*Runs on `http://localhost:5000`.*

### Step 3: Start React Frontend (Terminal 3)
```bash
cd frontend
npm run dev
```
*Runs on `http://localhost:5173` (Open in browser to use the full app).*

---

## 4. Automated Verification Test Suites

Inside the `backend/` directory, run any of the automated test suites:

```bash
cd backend

# Test 1: Order Food integration (Restaurants, Menus, Orders):
node test_order_flow.js

# Test 2: Rescue Food integration (Surplus items, Urgency sort, AI hook):
node test_rescue_food.js

# Test 3: PayPal Sandbox integration (Create order, Capture payment):
node test_paypal.js

# Test 4: End-to-End ML + Express test:
node test_e2e.js
```
