export const restaurants = [
  {
    id: 1,
    name: "Mumbai Spice House",
    cuisine: ["North Indian", "Chinese"],
    rating: 4.8,
    deliveryTime: 25,
    priceForTwo: 350,
    vegetarian: true,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
    description: "Authentic Indian flavours made fresh.",
    menu: [
      { id: 101, name: "Paneer Butter Masala", price: 180, category: "Main Course" },
      { id: 102, name: "Veg Biryani", price: 150, category: "Rice" },
      { id: 103, name: "Butter Naan", price: 40, category: "Breads" },
      { id: 104, name: "Dal Tadka", price: 130, category: "Main Course" }
    ]
  },
  {
    id: 2,
    name: "South Indian Junction",
    cuisine: ["South Indian"],
    rating: 4.6,
    deliveryTime: 20,
    priceForTwo: 200,
    vegetarian: true,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600",
    description: "Traditional South Indian breakfast and meals.",
    menu: [
      { id: 201, name: "Masala Dosa", price: 100, category: "Dosa" },
      { id: 202, name: "Idli Sambar", price: 80, category: "Breakfast" },
      { id: 203, name: "Medu Vada", price: 70, category: "Snacks" }
    ]
  },
  {
    id: 3,
    name: "The Pizza Corner",
    cuisine: ["Italian", "Fast Food"],
    rating: 4.5,
    deliveryTime: 35,
    priceForTwo: 450,
    vegetarian: false,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
    description: "Freshly baked pizzas and delicious sides.",
    menu: [
      { id: 301, name: "Margherita Pizza", price: 220, category: "Pizza" },
      { id: 302, name: "Farmhouse Pizza", price: 280, category: "Pizza" },
      { id: 303, name: "Garlic Bread", price: 100, category: "Sides" }
    ]
  },
  {
    id: 4,
    name: "Street Food Adda",
    cuisine: ["Street Food", "Fast Food"],
    rating: 4.7,
    deliveryTime: 20,
    priceForTwo: 180,
    vegetarian: true,
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600",
    description: "Your favourite Mumbai street food.",
    menu: [
      { id: 401, name: "Pav Bhaji", price: 100, category: "Street Food" },
      { id: 402, name: "Vada Pav", price: 30, category: "Street Food" },
      { id: 403, name: "Pani Puri", price: 50, category: "Chaat" }
    ]
  },
  {
    id: 5,
    name: "Chinese Wok",
    cuisine: ["Chinese"],
    rating: 4.4,
    deliveryTime: 30,
    priceForTwo: 300,
    vegetarian: true,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600",
    description: "Delicious Indo-Chinese meals.",
    menu: [
      { id: 501, name: "Veg Fried Rice", price: 140, category: "Rice" },
      { id: 502, name: "Hakka Noodles", price: 150, category: "Noodles" },
      { id: 503, name: "Veg Manchurian", price: 130, category: "Starters" }
    ]
  },
  {
    id: 6,
    name: "Sweet Treats",
    cuisine: ["Desserts"],
    rating: 4.9,
    deliveryTime: 25,
    priceForTwo: 200,
    vegetarian: true,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600",
    description: "End your meal with something sweet.",
    menu: [
      { id: 601, name: "Gulab Jamun", price: 60, category: "Desserts" },
      { id: 602, name: "Chocolate Brownie", price: 100, category: "Desserts" },
      { id: 603, name: "Ice Cream", price: 80, category: "Desserts" }
    ]
  }
];