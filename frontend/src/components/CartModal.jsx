import React, { useState, useEffect, useRef } from 'react';

export default function CartModal({ isOpen, onClose, cart, onUpdateQuantity, onClearCart }) {
  const [customerName, setCustomerName] = useState('Anjali Patil');
  const [customerEmail, setCustomerEmail] = useState('anjali@foodloop.test');
  const [loading, setLoading] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState(null);
  const [error, setError] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalConfig, setPaypalConfig] = useState({ clientId: 'sb', hasRealCredentials: false });

  const paypalContainerRef = useRef(null);
  const activeOrderIdRef = useRef(null);

  // Refs to access current state values in async callbacks without triggering PayPal button re-renders on keystroke
  const customerNameRef = useRef(customerName);
  const customerEmailRef = useRef(customerEmail);
  const cartRef = useRef(cart);

  useEffect(() => { customerNameRef.current = customerName; }, [customerName]);
  useEffect(() => { customerEmailRef.current = customerEmail; }, [customerEmail]);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  const totalAmount = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const totalSavings = cart.reduce((acc, it) => {
    if (it.isSurplus && it.originalPrice) {
      return acc + (it.originalPrice - it.price) * it.quantity;
    }
    return acc;
  }, 0);

  const totalAmountRef = useRef(totalAmount);
  const totalSavingsRef = useRef(totalSavings);
  useEffect(() => {
    totalAmountRef.current = totalAmount;
    totalSavingsRef.current = totalSavings;
  }, [totalAmount, totalSavings]);

  // Fetch PayPal Config from Backend
  useEffect(() => {
    fetch('http://localhost:5000/api/payments/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPaypalConfig(data);
        }
      })
      .catch(() => {});
  }, []);

  // Load Official PayPal SDK Script
  useEffect(() => {
    if (!isOpen || cart.length === 0) return;

    const clientId = paypalConfig.clientId || 'sb';
    const scriptId = 'paypal-sdk-script';

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons`;
      script.async = true;
      script.onload = () => setPaypalLoaded(true);
      script.onerror = () => {
        console.warn('PayPal SDK could not be loaded from CDN (check internet connection).');
        setPaypalLoaded(false);
      };
      document.body.appendChild(script);
    } else if (window.paypal) {
      setPaypalLoaded(true);
    }
  }, [isOpen, cart.length, paypalConfig.clientId]);

  // Render Official PayPal Smart Buttons when SDK is loaded
  useEffect(() => {
    if (!isOpen || !paypalLoaded || !window.paypal || !paypalContainerRef.current || cart.length === 0) {
      return;
    }

    paypalContainerRef.current.innerHTML = '';

    try {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 48
        },
        createOrder: async () => {
          const currentName = customerNameRef.current;
          const currentEmail = customerEmailRef.current;
          const currentCart = cartRef.current;
          const currentTotal = totalAmountRef.current;

          if (!currentName || !currentEmail) {
            setError('Please provide your name and email before proceeding.');
            throw new Error('Customer info missing');
          }

          setLoading(true);
          setError(null);

          // 1. Create order in Backend Database
          const orderPayload = {
            customerName: currentName,
            customerEmail: currentEmail,
            restaurantId: currentCart[0]?.restaurantId || 'rest_1',
            items: currentCart.map(it => ({
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
          const internalId = orderData.data._id;
          activeOrderIdRef.current = internalId;

          // 2. Call backend to create PayPal Sandbox order
          const paypalRes = await fetch('http://localhost:5000/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: internalId, amount: currentTotal })
          });
          const paypalData = await paypalRes.json();
          return paypalData.orderId;
        },
        onApprove: async (data) => {
          const currentName = customerNameRef.current;
          const currentTotal = totalAmountRef.current;
          const currentSavings = totalSavingsRef.current;
          const currentCart = cartRef.current;
          const internalId = activeOrderIdRef.current;

          // 3. User approved on PayPal! Capture payment in backend
          const captureRes = await fetch('http://localhost:5000/api/payments/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paypalOrderId: data.orderID,
              orderId: internalId
            })
          });
          const captureData = await captureRes.json();

          setOrderReceipt({
            orderId: internalId || 'ORD-COMPLETE',
            paypalTransactionId: captureData.data?.id || data.orderID,
            totalPaid: currentTotal,
            savings: currentSavings,
            customer: currentName,
            itemsCount: currentCart.length
          });

          onClearCart();
          setLoading(false);
        },
        onError: (err) => {
          console.error('[PAYPAL BUTTON ERROR]', err);
          setError('PayPal checkout encountered an issue. You can also use Quick Sandbox Test Pay below.');
          setLoading(false);
        }
      }).render(paypalContainerRef.current);
    } catch (e) {
      console.warn('Could not render PayPal buttons:', e);
    }
  }, [isOpen, paypalLoaded, cart.length === 0]);

  // Quick Sandbox Test Pay (Fallback)
  const handleQuickSandboxPay = async () => {
    if (cart.length === 0) return;
    if (!customerName || !customerEmail) {
      setError('Please provide your name and email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderRes = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          restaurantId: cart[0]?.restaurantId || 'rest_1',
          items: cart.map(it => ({
            foodItemId: it.foodItemId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            isSurplus: it.isSurplus
          }))
        })
      });
      const orderData = await orderRes.json();
      const internalOrderId = orderData.data._id;

      const paypalCreateRes = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: internalOrderId, amount: totalAmount })
      });
      const paypalOrder = await paypalCreateRes.json();

      const captureRes = await fetch('http://localhost:5000/api/payments/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId: paypalOrder.orderId,
          orderId: internalOrderId
        })
      });
      const captureData = await captureRes.json();

      setOrderReceipt({
        orderId: internalOrderId,
        paypalTransactionId: captureData.data?.id || paypalOrder.orderId,
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

  if (!isOpen) return null;

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
              <div className="receipt-line"><span>PayPal Status:</span> <span className="status-badge">COMPLETED (SANDBOX)</span></div>
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
                    <div key={item.foodItemId || idx} className="cart-item-row">
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
                    <label>Customer Name:</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="text-input"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Customer Email:</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="text-input"
                      required
                    />
                  </div>
                </div>

                <div className="total-summary-row">
                  <span>Grand Total:</span>
                  <span className="grand-total">₹{totalAmount}</span>
                </div>

                {error && <div className="error-banner">{error}</div>}

                {/* PayPal Smart Buttons Container */}
                <div className="paypal-checkout-section">
                  <div className="paypal-section-label">
                    <span>💳 Official PayPal Sandbox Checkout</span>
                  </div>

                  {/* Official PayPal Buttons render here */}
                  <div ref={paypalContainerRef} id="paypal-button-container" style={{ minHeight: '48px', marginBottom: '12px' }}>
                    {!paypalLoaded && (
                      <div style={{ textAlign: 'center', padding: '10px', fontSize: '13px', color: '#716453' }}>
                        Loading PayPal Sandbox SDK...
                      </div>
                    )}
                  </div>

                  <div className="or-divider"><span>OR QUICK TEST</span></div>

                  <button
                    className="quick-sandbox-btn"
                    onClick={handleQuickSandboxPay}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : '⚡ 1-Click Sandbox Test Pay (Bypass Popup)'}
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