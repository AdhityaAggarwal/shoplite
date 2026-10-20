// Basic front-end helpers for interactions
// Guard for browser environment so this file doesn't crash if run in Node.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const yearSpan = document.querySelector('[data-year]');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString();

    // Fallback: if local PNGs are missing, swap to a generated placeholder PNG
    function makePlaceholderPng(text, width = 1000, height = 750) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // background
      ctx.fillStyle = '#eef1f4';
      ctx.fillRect(0, 0, width, height);
      // border
      ctx.strokeStyle = '#cfd6df';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, width - 8, height - 8);
      // text
      ctx.fillStyle = '#0b1220';
      ctx.font = Math.round(width / 18) + 'px Segoe UI, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text || 'Image', width / 2, height / 2);
      return canvas.toDataURL('image/png');
    }

    function attachImageFallbacks(root = document) {
      const imgs = root.querySelectorAll('img');
      imgs.forEach((img) => {
        if (img.dataset.fallbackAttached) return;
        img.dataset.fallbackAttached = '1';
        const swap = () => {
          const label = img.alt && img.alt.trim() ? img.alt.trim() : 'Image';
          img.src = makePlaceholderPng(label);
        };
        img.addEventListener('error', swap, { once: true });
        // If the image has already finished loading but failed before this listener was attached
        if (img.complete && (typeof img.naturalWidth === 'number') && img.naturalWidth === 0) {
          swap();
        }
      });
    }

    attachImageFallbacks();
    // Render products grid if SHOP_PRODUCTS is available
    if (window.SHOP_PRODUCTS) {
      const root = document.getElementById('products-root');
      const byCat = getProductsByCategory();
      window.renderProducts = function(filter) {
        if (!root) return;
        const q = (filter || '').toLowerCase().trim();
        root.innerHTML = Object.keys(byCat).map(cat => {
          const items = byCat[cat].filter(p => {
            if (!q) return true;
            return (p.title + ' ' + p.desc + ' ' + (p.highlights || []).join(' ')).toLowerCase().includes(q);
          }).map(p => {
            return `
            <div class="col-12 col-md-4">
              <div class="card h-100">
                <img src="${p.img}" class="card-img-top" alt="${p.title}">
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title">${p.title}</h5>
                  <p class="text-muted flex-grow-1">${p.desc}</p>
                  <p class="mb-3 fw-semibold">${p.price}</p>
                  <div class="d-flex gap-2">
                    <a href="/product?id=${p.id}" class="btn btn-outline-secondary">Details</a>
                    <button class="btn btn-primary add-to-cart" data-id="${p.id}" data-title="${p.title}" data-price="${p.price}" data-img="${p.img}">Add to cart</button>
                  </div>
                </div>
              </div>
            </div>`;
          }).join('');
          if (!items) return '';
          return `
            <div class="row g-4 product-grid mt-4">
              <div class="col-12"><span class="badge badge-muted">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span></div>
              ${items}
            </div>`;
        }).join('\n');
        attachImageFallbacks(root);
      };
      // initial render
      renderProducts();
    }

    // Swap product detail image based on ?id=
    const url = new URL(window.location.href);
    const id = url.searchParams.get('id');
    if (id) {
      const img = document.querySelector('main img');
      if (img && window.SHOP_PRODUCTS && window.SHOP_PRODUCTS[id]) {
        img.src = window.SHOP_PRODUCTS[id].img;
        attachImageFallbacks();
      }
    }

    // Simple add-to-cart simulation (no backend)
    // Cart utilities
    const CART_KEY = 'shoplite_cart_v1';
    function readCart() {
      try {
        return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      } catch (e) {
        return [];
      }
    }
    function writeCart(cart) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      updateCartBadge();
    }
    function updateCartBadge() {
      const countEl = document.getElementById('cart-count');
      if (!countEl) return;
      const cart = readCart();
      const qty = cart.reduce((s, it) => s + (it.qty || 1), 0);
      countEl.textContent = qty;
    }

    function addItemToCart(item) {
      const cart = readCart();
      const existing = cart.find(i => i.id === item.id);
      if (existing) {
        existing.qty = (existing.qty || 1) + (item.qty || 1);
      } else {
        cart.push(Object.assign({ qty: 1 }, item));
      }
      writeCart(cart);
      showToast(`${item.title} added to cart`);
    }

    function removeItemFromCart(id) {
      let cart = readCart();
      cart = cart.filter(i => i.id !== id);
      writeCart(cart);
      renderCartPage();
    }

    function updateItemQty(id, qty) {
      const cart = readCart();
      const it = cart.find(i => i.id === id);
      if (!it) return;
      it.qty = Math.max(1, qty);
      writeCart(cart);
      renderCartPage();
    }

    function showToast(message) {
      // simple toast using bootstrap alert
      const toast = document.createElement('div');
      toast.className = 'alert alert-success position-fixed';
      toast.style.right = '1rem';
      toast.style.bottom = '1rem';
      toast.style.zIndex = 1100;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1800);
    }

    // Render cart page if present
    function renderCartPage() {
      const wrap = document.getElementById('cart-table-wrap');
      const empty = document.getElementById('cart-empty');
      if (!wrap || !empty) return;
      const tbody = wrap.querySelector('tbody');
      tbody.innerHTML = '';
      const cart = readCart();
      if (!cart.length) {
        wrap.classList.add('d-none');
        empty.classList.remove('d-none');
        return;
      }
      wrap.classList.remove('d-none');
      empty.classList.add('d-none');
      let grand = 0;
      cart.forEach(item => {
        const tr = document.createElement('tr');
        const total = (Number(item.price) * (item.qty || 1));
        grand += total;
        tr.innerHTML = `
          <td class="d-flex align-items-center gap-3"><img src="${item.img}" alt="" width="64" height="64" class="img-thumbnail"/><div>${item.title}</div></td>
          <td>₹${Number(item.price).toLocaleString()}</td>
          <td><input type="number" min="1" value="${item.qty||1}" data-qty-input data-id="${item.id}" class="form-control" style="max-width:90px"></td>
          <td>₹${Number(total).toLocaleString()}</td>
          <td><button class="btn btn-outline-secondary btn-sm" data-remove-item data-id="${item.id}">Remove</button></td>
        `;
        tbody.appendChild(tr);
      });
      // update checkout button text with total
      const checkout = document.getElementById('checkout-btn');
      if (checkout) checkout.textContent = `Checkout (₹${grand.toLocaleString()})`;

      // Update order summary
      const orderSummaryWrap = document.getElementById('order-summary-wrap');
      const cartSubtotal = document.getElementById('cart-subtotal');
      const cartShipping = document.getElementById('cart-shipping');
      const cartTax = document.getElementById('cart-tax');
      const cartTotal = document.getElementById('cart-total');

      if (orderSummaryWrap && cartSubtotal && cartShipping && cartTax && cartTotal) {
        const shipping = 50; // Example shipping cost
        const taxRate = 0.10; // 10% tax
        const subtotal = grand;
        const tax = subtotal * taxRate;
        const total = subtotal + shipping + tax;

        cartSubtotal.textContent = `₹${subtotal.toLocaleString()}`;
        cartShipping.textContent = `₹${shipping.toLocaleString()}`;
        cartTax.textContent = `₹${tax.toLocaleString()}`;
        cartTotal.textContent = `₹${total.toLocaleString()}`;
        orderSummaryWrap.classList.remove('d-none');
      }
    }

    // Initialize badge on load
    updateCartBadge();

    // Wire up search box if available (debounced)
    const searchBox = document.getElementById('product-search');
    if (searchBox && typeof window.renderProducts === 'function') {
      let t = null;
      searchBox.addEventListener('input', (e) => {
        const v = e.target.value;
        clearTimeout(t);
        t = setTimeout(() => window.renderProducts(v), 220);
      });
    }

    // Event delegation for add/remove
    document.body.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.matches('.add-to-cart')) {
        const id = target.dataset.id;
        const title = target.dataset.title;
        const price = target.dataset.price;
        const img = target.dataset.img;
        addItemToCart({ id, title, price, img });
        // brief visual feedback
        target.disabled = true;
        const orig = target.textContent;
        target.textContent = 'Added';
        setTimeout(() => { target.disabled = false; target.textContent = orig; }, 900);
      }
      if (target && target.matches('[data-remove-item]')) {
        const id = target.dataset.id;
        removeItemFromCart(id);
      }
    });

    // Quantity change
    document.body.addEventListener('input', (e) => {
      const t = e.target;
      if (t && t.matches('[data-qty-input]')) {
        const id = t.dataset.id;
        const qty = Number(t.value) || 1;
        updateItemQty(id, qty);
      }
    });

    // Render cart page if on cart
    renderCartPage();
  });
}
