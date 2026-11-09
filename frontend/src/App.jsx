import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import OrderFoodSection from './components/OrderFoodSection';
import RescueFoodSection from './components/RescueFoodSection';
import AiPredictionWidget from './components/AiPredictionWidget';
import ModelRetrainWidget from './components/ModelRetrainWidget';
import CartModal from './components/CartModal';
import ImpactStats from './components/ImpactStats';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Add item to cart
  const handleAddToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.foodItemId === item.foodItemId);
      if (existing) {
        return prev.map(i =>
          i.foodItemId === item.foodItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  // Update item quantity
  const handleUpdateQuantity = (foodItemId, delta) => {
    setCart(prev => {
      return prev
        .map(i => {
          if (i.foodItemId === foodItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  const handleClearCart = () => setCart([]);

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="app">
      {/* 1. Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 2. Main Content Based on Active Tab */}
      {activeTab === 'home' && (
        <>
          <section className="hero">
            <div className="hero-content">
              <span className="tagline">🌱 AI-POWERED ZERO FOOD WASTE PLATFORM</span>

              <h1>
                Good Food.
                <br />
                <span>Brighter Tomorrows.</span>
              </h1>

              <p>
                Order delicious meals from your favourite restaurants, rescue fresh surplus food at special discounts, and help build a world where no meal goes to waste.
              </p>

              <div className="hero-buttons">
                <button className="order-btn" onClick={() => setActiveTab('order')}>
                  🍽️ Order Food
                </button>
                <button className="rescue-btn" onClick={() => setActiveTab('rescue')}>
                  🌱 Rescue Food (Surplus Deals)
                </button>
              </div>

              <p className="hero-note">
                ✨ Pure Taste · ♻️ Zero Waste · 🤝 Community Impact
              </p>
            </div>

            <div className="hero-image">
              <img
                src="/anna-food.png"
                alt="Traditional Indian food platter"
                className="hero-food-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </section>

          <section className="features" id="about">
            <div onClick={() => setActiveTab('order')} style={{ cursor: 'pointer' }}>
              <h2>🍽️ Order Food</h2>
              <p>Freshly prepared meals from your favourite verified kitchens.</p>
            </div>

            <div onClick={() => setActiveTab('rescue')} style={{ cursor: 'pointer' }}>
              <h2>🌱 Rescue Food</h2>
              <p>Discover quality surplus meals with up to 60% discounts.</p>
            </div>

            <div onClick={() => setActiveTab('ai')} style={{ cursor: 'pointer' }}>
              <h2>🤖 AI Demand Forecast</h2>
              <p>Predict sales demand to eliminate commercial waste.</p>
            </div>

            <div onClick={() => setActiveTab('retrain')} style={{ cursor: 'pointer' }}>
              <h2>🧠 Retrain With Real Data</h2>
              <p>Log restaurant sales and dynamically update the ML model.</p>
            </div>
          </section>

          {/* Quick Preview of Rescue Food Deals */}
          <div style={{ padding: '0 7% 40px' }}>
            <RescueFoodSection onAddToCart={handleAddToCart} />
          </div>

          <ImpactStats />
        </>
      )}

      {activeTab === 'order' && (
        <OrderFoodSection onAddToCart={handleAddToCart} />
      )}

      {activeTab === 'rescue' && (
        <RescueFoodSection onAddToCart={handleAddToCart} />
      )}

      {activeTab === 'ai' && (
        <AiPredictionWidget />
      )}

      {activeTab === 'retrain' && (
        <ModelRetrainWidget />
      )}

      {/* 3. Cart & PayPal Checkout Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
      />
    </div>
  );
}

export default App;
