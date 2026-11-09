# FoodLoop AI (Anna — Anna He Parabrahma)
## Platform Architecture & API Handbook

FoodLoop AI connects restaurants and bakeries with customers to reduce commercial food waste while making meals affordable.

---

## 1. Project Organization (Option 1: Modular Monorepo)

```text
Demand prdeiction/
├── ml/                                 # [Phase 0] Machine Learning Component
│   ├── data/
│   │   ├── generate_data.py           # Historical sales simulator
│   │   └── food_demand_data.csv       # 4,000 sales transactions
│   ├── models/
│   │   └── demand_model.joblib        # Trained Random Forest Regressor
│   ├── src/
│   │   ├── train.py                   # Training pipeline (MAE: 2.36, R²: 0.9255)
│   │   └── predict.py                 # In-memory inference engine
│   └── service/
│       └── app.py                     # Python Flask microservice (Port 5001)
│
├── backend/                            # [Phase 1 & 2] Node.js & Express APIs
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB Mongoose connection + In-Memory Fallback
│   │   ├── models/                    # Data Models
│   │   │   ├── User.js                # Customer & Restaurant accounts
│   │   │   ├── Restaurant.js          # Restaurant profiles & addresses
│   │   │   ├── FoodItem.js            # Standard dishes + Rescue surplus food
│   │   │   └── Order.js               # Order placement & tracking
│   │   ├── routes/                    # API Endpoints
│   │   │   ├── demandRoutes.js        # /api/demand (calls ML service)
│   │   │   ├── restaurantRoutes.js    # /api/restaurants (listings & menus)
│   │   │   └── orderRoutes.js         # /api/orders (place orders & track status)
│   │   ├── data/
│   │   │   └── initialData.json       # Preloaded FoodLoop partner restaurants & menus
│   │   ├── scripts/
│   │   │   └── seed.js                # Populates MongoDB with sample data
│   │   └── server.js                  # Express main server (Port 5000)
│   ├── test_api.js                    # Basic backend endpoint test
│   ├── test_order_flow.js             # Order Food integration test suite
│   └── test_e2e.js                    # Complete ML + Backend integration test
│
├── .gitignore
└── README.md
```

---

## 2. API Reference

### A. Restaurants & Menus (`/api/restaurants`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/restaurants` | Browse all partner restaurants (supports `?cuisine=Indian&search=Darbar`) |
| `GET` | `/api/restaurants/:id` | View specific restaurant profile & location |
| `GET` | `/api/restaurants/:id/menu` | View restaurant menu items (supports `?vegetarian=true`) |

### B. Food Orders (`/api/orders`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Place a new food order (auto-calculates total amount) |
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/:id` | View order details and payment status |
| `PATCH` | `/api/orders/:id/status` | Update preparation status (`PREPARING`, `COMPLETED`, etc.) |

### C. Demand Prediction AI (`/api/demand`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/demand/status` | Check Python ML microservice health |
| `POST` | `/api/demand/predict` | Predict sales quantity for a single surplus item |
| `POST` | `/api/demand/batch-predict`| Predict sales quantity for multiple surplus items |

---

## 3. How to Run & Test

### Run Express Backend:
```bash
cd backend
node src/server.js
```
The server will start on `http://localhost:5000`.

### Run Order Food Integration Tests:
```bash
cd backend
node test_order_flow.js
```

### Run Full End-to-End Test (Backend + ML Service):
```bash
cd backend
node test_e2e.js
```
