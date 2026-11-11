import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Checkout() {

    const {
        cart,
        increaseQuantity,
        decreaseQuantity,
        removeItem,
        totalItems,
        subtotal
    } = useCart();

    const [customer, setCustomer] = useState({
        fullName: "",
        phone: "",
        address: "",
        city: "",
        pincode: ""
    });

    const deliveryFee = cart.length > 0 ? 40 : 0;
    const platformFee = cart.length > 0 ? 10 : 0;
    const total = subtotal + deliveryFee + platformFee;

    const handleChange = (event) => {
        const { name, value } = event.target;

        setCustomer((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handlePlaceOrder = (event) => {
        event.preventDefault();

        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        if (!/^\d{10}$/.test(customer.phone)) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        if (!/^\d{6}$/.test(customer.pincode)) {
            alert("Please enter a valid 6-digit pincode.");
            return;
        }

        alert(
            "Your checkout details are ready!\n\n" +
            "PayPal integration will be added in a separate branch."
        );
    };

    // Empty cart
    if (cart.length === 0) {
        return (
            <div className="checkout-page">

                <div className="empty-checkout">

                    <div className="empty-cart-icon">🛒</div>

                    <h2>Your Cart is Empty</h2>

                    <p>
                        Delicious food is waiting for you!
                        Explore restaurants or rescue surplus food.
                    </p>

                    <div className="empty-cart-buttons">

                        <Link to="/order" className="continue-shopping">
                            Explore Restaurants
                        </Link>

                        <Link
                            to="/rescue"
                            className="continue-shopping rescue-link"
                        >
                            Explore Rescue Food
                        </Link>

                    </div>

                </div>

            </div>
        );
    }

    return (

        <div className="checkout-page">

            {/* PAGE HEADING */}
            <div className="checkout-header">

                <div>
                    <h1>🛒 Your Shopping Cart</h1>

                    <p>
                        Review your items and complete your order.
                    </p>
                </div>

                <div className="checkout-item-count">
                    {totalItems} Items
                </div>

            </div>


            {/* MAIN CHECKOUT LAYOUT */}
            <div className="checkout-layout">


                {/* LEFT COLUMN */}
                <div className="checkout-left">


                    {/* CART ITEMS */}
                    <section className="checkout-card">

                        <div className="section-heading">
                            <h2>🛍️ Order Items</h2>
                            <span>{totalItems} items</span>
                        </div>


                        <div className="checkout-items-list">

                            {cart.map((item) => (

                                <div
                                    className="checkout-item"
                                    key={item.itemId}
                                >

                                    <div className="checkout-item-image">

                                        {item.image ? (

                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                onError={(event) => {
                                                    event.currentTarget.style.display = "none";
                                                }}
                                            />

                                        ) : (

                                            <span>🍽️</span>

                                        )}

                                    </div>


                                    <div className="checkout-item-info">

                                        <h3>{item.name}</h3>

                                        <p className="item-source">

                                            {item.sourceType === "rescue"
                                                ? "♻️ Rescue Food"
                                                : "🍽️ Restaurant Food"}

                                        </p>

                                        {item.sourceName && (
                                            <p className="item-restaurant">
                                                {item.sourceName}
                                            </p>
                                        )}

                                        <p className="item-unit-price">
                                            ₹{item.price.toFixed(2)} per item
                                        </p>

                                        {item.originalPrice > item.price && (
                                            <p className="discount-price">
                                                Original price: ₹{item.originalPrice}
                                            </p>
                                        )}

                                    </div>


                                    <div className="checkout-item-actions">

                                        <div className="checkout-quantity">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    decreaseQuantity(item.itemId)
                                                }
                                            >
                                                −
                                            </button>

                                            <span>{item.quantity}</span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    increaseQuantity(item.itemId)
                                                }
                                            >
                                                +
                                            </button>

                                        </div>

                                        <strong className="checkout-item-price">
                                            ₹{(
                                                item.price * item.quantity
                                            ).toFixed(2)}
                                        </strong>

                                        <button
                                            type="button"
                                            className="checkout-remove"
                                            onClick={() =>
                                                removeItem(item.itemId)
                                            }
                                        >
                                            Remove
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>


                        <div className="shopping-links">

                            <Link to="/order">
                                + Order Restaurant Food
                            </Link>

                            <Link to="/rescue">
                                + Explore Rescue Food
                            </Link>

                        </div>

                    </section>


                    {/* DELIVERY DETAILS */}
                    <section className="checkout-card">

                        <div className="section-heading">
                            <h2>📍 Delivery Details</h2>
                        </div>

                        <form
                            id="checkout-form"
                            onSubmit={handlePlaceOrder}
                        >

                            <div className="delivery-form-grid">

                                <div className="form-group">

                                    <label>Full Name</label>

                                    <input
                                        type="text"
                                        name="fullName"
                                        placeholder="Enter your full name"
                                        value={customer.fullName}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>Phone Number</label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="10-digit mobile number"
                                        value={customer.phone}
                                        onChange={handleChange}
                                        maxLength="10"
                                        pattern="[0-9]{10}"
                                        required
                                    />

                                </div>


                                <div className="form-group full-width">

                                    <label>Delivery Address</label>

                                    <textarea
                                        name="address"
                                        placeholder="House number, street, area..."
                                        value={customer.address}
                                        onChange={handleChange}
                                        rows="3"
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>City</label>

                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="Enter city"
                                        value={customer.city}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>Pincode</label>

                                    <input
                                        type="text"
                                        name="pincode"
                                        placeholder="6-digit pincode"
                                        value={customer.pincode}
                                        onChange={handleChange}
                                        maxLength="6"
                                        pattern="[0-9]{6}"
                                        required
                                    />

                                </div>

                            </div>

                        </form>

                    </section>

                </div>


                {/* RIGHT COLUMN */}
                <aside className="checkout-right">


                    {/* ORDER SUMMARY */}
                    <section className="checkout-card order-summary">

                        <h2>📋 Order Summary</h2>

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Delivery Fee</span>
                            <span>₹{deliveryFee.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Platform Fee</span>
                            <span>₹{platformFee.toFixed(2)}</span>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-total">
                            <span>Total Amount</span>
                            <strong>₹{total.toFixed(2)}</strong>
                        </div>

                        <p className="summary-note">
                            Inclusive of all listed charges.
                        </p>

                    </section>


                    {/* PAYMENT METHOD */}
                    <section className="checkout-card payment-section">

                        <h2>💳 Payment Method</h2>

                        <div className="paypal-placeholder">

                            <div className="paypal-logo">
                                Pay<span>Pal</span>
                            </div>

                            <div>
                                <strong>PayPal Checkout</strong>

                                <p>
                                    Secure online payment.
                                </p>
                            </div>

                        </div>

                        <button
                            type="submit"
                            form="checkout-form"
                            className="place-order-btn"
                        >
                            Continue to Payment

                            <span>
                                ₹{total.toFixed(2)}
                            </span>

                        </button>

                        <p className="payment-note">
                            🔒 Secure checkout experience.
                            Payment integration will be added in the PayPal branch.
                        </p>

                    </section>


                    <div className="checkout-trust">

                        <span>🌿</span>

                        <p>
                            Every order with ANNA supports
                            responsible food consumption.
                        </p>

                    </div>

                </aside>

            </div>

        </div>

    );
}

export default Checkout;