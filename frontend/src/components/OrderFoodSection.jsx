import React, { useState, useEffect } from 'react';

export default function OrderFoodSection({ onAddToCart }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingRest, setLoadingRest] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/restaurants');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setRestaurants(data.data);
        // Default to first restaurant
        selectRestaurant(data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setLoadingRest(false);
    }
  };

  const selectRestaurant = async (rest) => {
    setSelectedRest(rest);
    setLoadingMenu(true);
    try {
      const restId = rest.id || rest._id;
      const res = await fetch(`http://localhost:5000/api/restaurants/${restId}/menu`);
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.data);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  const displayedMenu = vegOnly ? menuItems.filter(i => i.isVegetarian) : menuItems;

  return (
    <section className="section-container" id="order-section">
      <div className="section-header">
        <span className="section-badge">🍽️ FRESH DINING</span>
        <h2>Order from Partner Kitchens</h2>
        <p>Explore daily menus crafted with authentic ingredients from verified local partners.</p>
      </div>

      {loadingRest && <div className="loading-state">Loading partner restaurants...</div>}

      {/* Restaurant Tabs */}
      <div className="restaurant-tabs">
        {restaurants.map(rest => {
          const restId = rest.id || rest._id;
          const isSelected = selectedRest && (selectedRest.id || selectedRest._id) === restId;
          return (
            <div
              key={restId}
              className={`restaurant-pill ${isSelected ? 'active' : ''}`}
              onClick={() => selectRestaurant(rest)}
            >
              <div className="rest-pill-name">{rest.name}</div>
              <div className="rest-pill-meta">⭐ {rest.rating} · {rest.cuisine}</div>
            </div>
          );
        })}
      </div>

      {selectedRest && (
        <div className="menu-container">
          <div className="menu-header">
            <div>
              <h3>Menu for {selectedRest.name}</h3>
              <p className="menu-subtitle">📍 {selectedRest.address} · 📞 {selectedRest.contactNumber}</p>
            </div>
            <label className="toggle-veg-label">
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={(e) => setVegOnly(e.target.checked)}
              />
              🥬 Pure Veg Only
            </label>
          </div>

          {loadingMenu && <div className="loading-state">Loading menu items...</div>}

          <div className="cards-grid">
            {displayedMenu.map(item => (
              <div key={item.id || item._id} className="food-card">
                <div className="card-body">
                  <div className="item-header-row">
                    <span className="veg-badge">{item.isVegetarian ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                    <span className="category-label">{item.category}</span>
                  </div>
                  <h4 className="item-title">{item.name}</h4>
                  <p className="item-desc">{item.description}</p>
                  <div className="pricing-row">
                    <span className="price-tag">₹{item.originalPrice}</span>
                    <button
                      className="add-to-cart-btn"
                      onClick={() => onAddToCart({
                        foodItemId: item.id || item._id,
                        name: item.name,
                        price: item.originalPrice,
                        isSurplus: false,
                        restaurantId: selectedRest.id || selectedRest._id,
                        restaurantName: selectedRest.name
                      })}
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
