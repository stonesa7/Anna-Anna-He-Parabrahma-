import React, { useState } from 'react';

export default function CartModal({ isOpen, onClose, cart, onUpdateQuantity, onClearCart }) {
  const [customerName, setCustomerName] = useState('Anjali Patil');
  const [customerEmail, setCustomerEmail] = useState('anjali@foodloop.test');
  const [loading, setLoading] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const totalSavings = cart.reduce((acc, it) => {
    if (it.isSurplus && it.originalPrice) {
      return acc + (it.originalPrice - it.price) * it.quantity;
    }
    return acc;
  }, 0);

  const handlePayPalCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName || !customerEmail) {
      setError('Please provide your name and email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create order in Backend Database
      const orderPayload = {
        customerName,
        customerEmail,
        restaurantId: cart[0].restaurantId || 'rest_1',
        items: cart.map(it => ({
          foodItemId: it.foodItemId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          isSurplus: it.isSurplus
        }))
      };

      const orderRes = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize order.');
      }

      const internalOrderId = orderData.data._id;

      // 2. Initiate PayPal Order
      const paypalCreateRes = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: internalOrderId,
          amount: totalAmount,
          currency: 'USD'
        })
      });
      const paypalOrder = await paypalCreateRes.json();

      if (!paypalOrder.success) {
        throw new Error(paypalOrder.error || 'PayPal order creation failed.');
      }

      const paypalId = paypalOrder.orderId;

      // 3. Capture Payment (Simulating immediate sandbox approval)
      const captureRes = await fetch('http://localhost:5000/api/payments/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId: paypalId,
          orderId: internalOrderId
        })
      });
      const captureData = await captureRes.json();

      if (!captureData.success) {
        throw new Error(captureData.error || 'Payment capture failed.');
      }

      // Order Complete!
      setOrderReceipt({
        orderId: internalOrderId,
        paypalTransactionId: captureData.data?.id || paypalId,
        totalPaid: totalAmount,
        savings: totalSavings,
        customer: customerName,
        itemsCount: cart.length
      });

      onClearCart();

    } catch (err) {
      setError(err.message || 'Payment processing error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>🛒 Your FoodLoop Cart</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {orderReceipt ? (
          <div className="receipt-view">
            <div className="success-icon">🎉</div>
            <h4>Order & Payment Confirmed!</h4>
            <p className="receipt-subtitle">Thank you for rescuing food and reducing waste!</p>

            <div className="receipt-box">
              <div className="receipt-line"><span>Order Reference:</span> <strong>{orderReceipt.orderId}</strong></div>
              <div className="receipt-line"><span>PayPal Transaction:</span> <strong>{orderReceipt.paypalTransactionId}</strong></div>
              <div className="receipt-line"><span>Customer:</span> <strong>{orderReceipt.customer}</strong></div>
              <div className="receipt-line"><span>Total Paid:</span> <strong>₹{orderReceipt.totalPaid}</strong></div>
              {orderReceipt.savings > 0 && (
                <div className="receipt-line savings-highlight">
                  <span>Community Savings:</span> <strong>₹{orderReceipt.savings} saved!</strong>
                </div>
              )}
              <div className="receipt-line"><span>Pickup Status:</span> <span className="status-badge">READY FOR PREPARATION</span></div>
            </div>

            <button className="done-btn" onClick={() => { setOrderReceipt(null); onClose(); }}>
              Done & Return to Menu
            </button>
          </div>
        ) : (
          <div className="cart-content">
            {cart.length === 0 ? (
              <div className="empty-cart-message">
                <p>Your cart is empty!</p>
                <p>Browse <strong>Order Food</strong> or <strong>Rescue Food</strong> to add fresh meals.</p>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map((item, idx) => (
                    <div key={idx} className="cart-item-row">
                      <div className="cart-item-info">
                        <span className="cart-item-name">
                          {item.isSurplus ? '🌱 ' : '🍽️ '}{item.name}
                        </span>
                        <span className="cart-item-price">₹{item.price} each</span>
                      </div>

                      <div className="qty-controls">
                        <button onClick={() => onUpdateQuantity(item.foodItemId, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.foodItemId, 1)}>+</button>
                      </div>

                      <div className="cart-item-total">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                {totalSavings > 0 && (
                  <div className="savings-banner">
                    🌟 You are saving <strong>₹{totalSavings}</strong> by rescuing surplus food!
                  </div>
                )}

                <div className="cart-customer-fields">
                  <div className="input-group">
                    <label>Your Name:</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="text-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Your Email:</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="text-input"
                    />
                  </div>
                </div>

                <div className="total-summary-row">
                  <span>Grand Total:</span>
                  <span className="grand-total">₹{totalAmount}</span>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="modal-actions">
                  <button
                    className="paypal-checkout-btn"
                    onClick={handlePayPalCheckout}
                    disabled={loading}
                  >
                    {loading ? 'Processing via PayPal...' : '💳 Pay with PayPal Sandbox'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
