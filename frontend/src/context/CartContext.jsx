import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {

    // Load previously saved cart
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem("anna-cart");
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error("Unable to load saved cart:", error);
            return [];
        }
    });

    // Save cart whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem("anna-cart", JSON.stringify(cart));
        } catch (error) {
            console.error("Unable to save cart:", error);
        }
    }, [cart]);


    // Add restaurant food or rescue food
    const addToCart = (food) => {

        const price = Number(food.price);

        if (
            !food.name ||
            !food.itemId ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            console.error("Invalid food item:", food);
            return false;
        }

        const itemId = String(food.itemId);

        setCart((previousCart) => {

            const existingItem = previousCart.find(
                (item) => item.itemId === itemId
            );

            // If item already exists, increase quantity
            if (existingItem) {

                return previousCart.map((item) =>
                    item.itemId === itemId
                        ? {
                            ...item,
                            quantity: item.quantity + 1
                        }
                        : item
                );
            }

            // Otherwise add a new item
            return [
                ...previousCart,
                {
                    ...food,
                    itemId,
                    price,
                    quantity: 1
                }
            ];
        });

        return true;
    };


    // Increase quantity
    const increaseQuantity = (itemId) => {

        setCart((previousCart) =>
            previousCart.map((item) =>
                item.itemId === itemId
                    ? {
                        ...item,
                        quantity: item.quantity + 1
                    }
                    : item
            )
        );
    };


    // Decrease quantity
    const decreaseQuantity = (itemId) => {

        setCart((previousCart) =>
            previousCart
                .map((item) =>
                    item.itemId === itemId
                        ? {
                            ...item,
                            quantity: item.quantity - 1
                        }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };


    // Remove item
    const removeItem = (itemId) => {

        setCart((previousCart) =>
            previousCart.filter(
                (item) => item.itemId !== itemId
            )
        );
    };


    // Empty entire cart
    const clearCart = () => {
        setCart([]);
    };


    // Total quantity of all items
    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );


    // Total price before delivery/platform fees
    const subtotal = cart.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );


    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                increaseQuantity,
                decreaseQuantity,
                removeItem,
                clearCart,
                totalItems,
                subtotal
            }}
        >
            {children}
        </CartContext.Provider>
    );
}


// Custom hook
export function useCart() {

    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            "useCart must be used inside CartProvider"
        );
    }

    return context;
}