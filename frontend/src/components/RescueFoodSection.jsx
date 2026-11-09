import React, { useState, useEffect } from 'react';

export default function RescueFoodSection({ onAddToCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('urgency');

  useEffect(() => {
    fetchSurplusItems();
  }, [sortBy]);

  const fetchSurplusItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/rescue/items?sortBy=${sortBy}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else {
        setError('Could not load surplus food.');
      }
    } catch (err) {
      setError('Backend server offline. Please start backend on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Main Course', 'Snacks', 'Bakery', 'Salads'];

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter(it => it.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <section className="section-container" id="rescue-section">
      <div className="section-header">
        <span className="section-badge">🌱 ZERO FOOD WASTE INITIATIVE</span>
        <h2>Rescue Surplus Food at Special Prices</h2>
        <p>Fresh, safe, delicious surplus meals prepared today by partner restaurants. Save up to 60% and prevent commercial food waste.</p>
      </div>

      {/* Filter and Sort Controls */}
      <div className="controls-bar">
        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="sort-controls">
          <label>Sort By: </label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-dropdown">
            <option value="urgency">⚡ Highest Urgency (Shortest Shelf-Life)</option>
            <option value="discount">🏷️ Highest Discount %</option>
          </select>
        </div>
      </div>

      {loading && <div className="loading-state">Loading fresh surplus deals...</div>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && filteredItems.length === 0 && (
        <div className="empty-state">No surplus items available in this category right now! Check back soon.</div>
      )}

      {/* Grid of Surplus Cards */}
      <div className="cards-grid">
        {filteredItems.map(item => (
          <div key={item.id || item._id} className="food-card surplus-card">
            <div className="card-top-badges">
              <span className="discount-tag">🏷️ {item.discountPercent}% OFF</span>
              <span className="urgency-badge">⚡ {item.shelfLifeHoursLeft}h left</span>
            </div>

            <div className="card-body">
              <h3 className="item-title">{item.name}</h3>
              <p className="restaurant-name">📍 {item.restaurantName || "Partner Restaurant"}</p>
              <p className="item-desc">{item.description}</p>

              <div className="pricing-row">
                <div>
                  <span className="old-price">₹{item.originalPrice}</span>
                  <span className="new-price">₹{item.discountedPrice}</span>
                </div>
                <span className="savings-pill">Save ₹{item.originalPrice - item.discountedPrice}</span>
              </div>

              <div className="card-footer">
                <span className="stock-info">Only {item.availableQuantity} portions left</span>
                <button
                  className="rescue-action-btn"
                  onClick={() => onAddToCart({
                    foodItemId: item.id || item._id,
                    name: item.name,
                    price: item.discountedPrice,
                    originalPrice: item.originalPrice,
                    isSurplus: true,
                    restaurantId: item.restaurantId
                  })}
                >
                  Rescue Meal 🛒
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
