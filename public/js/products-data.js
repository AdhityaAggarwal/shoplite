// Central product catalog for ShopLite
// Exposes a global SHOP_PRODUCTS mapping by id
window.SHOP_PRODUCTS = {
  phone: {
    id: 'phone',
    title: 'Smartphone',
  img: '/images/smartphone.jpg',
    desc: 'Crisp display, long battery life.',
    price: 14999,
    priceDisplay: '₹14,999.00',
    highlights: ['Durable materials', 'Long battery life', 'Great for daily use'],
    category: 'electronics'
  },
  headphones: {
    id: 'headphones',
    title: 'Headphones',
  img: '/images/headphones.jpg',
    desc: 'Comfortable with great sound.',
    price: 2499,
    priceDisplay: '₹2,499.00',
    highlights: ['Wireless', 'Great sound', 'Comfortable fit'],
    category: 'electronics'
  },
  laptop: {
    id: 'laptop',
    title: 'Laptop',
  img: '/images/laptop.jpg',
    desc: 'Portable performance for study.',
    price: 54999,
    priceDisplay: '₹54,999.00',
    highlights: ['Portable', 'High performance', 'Study & work'],
    category: 'electronics'
  },
  chair: {
    id: 'chair',
    title: 'Ergo Chair',
  img: '/images/chair.jpg',
    desc: 'Study longer with better posture.',
    price: 3299,
    priceDisplay: '₹3,299.00',
    highlights: ['Ergonomic', 'Comfortable', 'Supports posture'],
    category: 'home'
  },
  lamp: {
    id: 'lamp',
    title: 'Desk Lamp',
  img: '/images/table-lamp.jpg',
    desc: 'Warm light for late nights.',
    price: 799,
    priceDisplay: '₹799.00',
    highlights: ['Warm light', 'Adjustable', 'Energy efficient'],
    category: 'home'
  },
  mug: {
    id: 'mug',
    title: 'Mug',
  img: '/images/mug.jpg',
    desc: 'Keep your coffee close.',
    price: 249,
    priceDisplay: '₹249.00',
    highlights: ['Ceramic', 'Insulated', 'Stylish'],
    category: 'home'
  },
  tshirt: {
    id: 'tshirt',
    title: 'T-shirt',
  img: '/images/t-shirt.jpg',
    desc: 'Soft and breathable cotton.',
    price: 599,
    priceDisplay: '₹599.00',
    highlights: ['Cotton', 'Breathable', 'Comfortable'],
    category: 'fashion'
  },
  hoodie: {
    id: 'hoodie',
    title: 'Hoodie',
  img: '/images/hoodie.jpg',
    desc: 'Cozy for all seasons.',
    price: 1299,
    priceDisplay: '₹1,299.00',
    highlights: ['Cozy', 'All seasons', 'Stylish'],
    category: 'fashion'
  },
  cap: {
    id: 'cap',
    title: 'Cap',
  img: '/images/cap.jpg',
    desc: 'Shade with style.',
    price: 399,
    priceDisplay: '₹399.00',
    highlights: ['Stylish', 'Comfortable', 'Sun protection'],
    category: 'fashion'
  }
};

// Helper: get products grouped by category
window.getProductsByCategory = function() {
  const map = {};
  Object.values(window.SHOP_PRODUCTS).forEach(p => {
    map[p.category] = map[p.category] || [];
    map[p.category].push(p);
  });
  return map;
};
