document.addEventListener('DOMContentLoaded', function() {
    let cartItems = [];
  
    // Load cart from localStorage
    function loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cartItems = JSON.parse(savedCart);
            updateCartCount();
        }
    }
  
    // Save cart to localStorage
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cartItems));
        updateCartCount();
        renderCartItems(); // Add this line to refresh the cart display
    }
  
    // Add to cart function
    window.addToCart = function(id, name, image, price, description) {
        const existingItem = cartItems.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({
                id,
                name,
                image,
                price: parseFloat(price),
                description,
                quantity: 1
            });
        }
        
        saveCart();
        showToast(`${name} added to cart!`);
    };
  
    // Update cart count in header
    function updateCartCount() {
        const count = cartItems.reduce((total, item) => total + item.quantity, 0);
        document.querySelectorAll('.cart-number').forEach(el => el.textContent = count);
    }

    // Show toast message
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message show';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
  
    // Render cart items on the cart page
    function renderCartItems() {
        const cartContainer = document.querySelector('.cart-items');
        const cartActions = document.querySelector('.cart-actions');
        const cartSummary = document.querySelector('.cart-summary');

        if (!cartContainer) return; // Only run on cart page

        if (cartItems.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart text-center py-5">
                    <p>Your cart is empty</p>
                    <a href="menu.html" class="sec-btn">Browse Menu</a>
                </div>`;
            cartActions.style.display = 'none';
            cartSummary.style.display = 'none';
            return;
        }

        cartContainer.innerHTML = cartItems.map(item => `
            <div class="cart-item row align-items-center" data-id="${item.id}">
                <div class="col-md-2">
                    <img src="${item.image}" class="img-fluid" alt="${item.name}">
                </div>
                <div class="col-md-4">
                    <h5 class="item-title">${item.name}</h5>
                    <p class="item-desc">${item.description}</p>
                </div>
                <div class="col-md-3 quantity-selector">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                    <button class="quantity-btn plus">+</button>
                </div>
                <div class="col-md-2">
                    <p class="item-price">₹${item.price.toFixed(2)}</p>
                </div>
                <div class="col-md-1 text-end">
                    <button class="remove-item"><i class="uil uil-times"></i></button>
                </div>
            </div>
        `).join('');

        cartActions.style.display = 'flex';
        cartSummary.style.display = 'block';
        updateCartTotal();
    }

    // Update cart total
    function updateCartTotal() {
        let subtotal = 0;
        
        cartItems.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        
        const deliveryFee = 50;
        const tax = subtotal * 0.05;
        const total = subtotal + deliveryFee + tax;
        
        document.querySelector('.summary-row:nth-child(1) span:last-child').textContent = `₹${subtotal.toFixed(2)}`;
        document.querySelector('.summary-row:nth-child(3) span:last-child').textContent = `₹${tax.toFixed(2)}`;
        document.querySelector('.summary-row.total span:last-child').textContent = `₹${total.toFixed(2)}`;
    }
  
    // Initialize cart
    loadCart();
    renderCartItems();

    // Event delegation for dynamic elements
    document.addEventListener('click', function(e) {
        // Quantity minus
        if (e.target.classList.contains('minus')) {
            const input = e.target.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            if (value > 1) {
                input.value = value - 1;
                const itemId = e.target.closest('.cart-item').dataset.id;
                const item = cartItems.find(item => item.id === itemId);
                if (item) item.quantity = value - 1;
                saveCart();
            }
        }
        
        // Quantity plus
        if (e.target.classList.contains('plus')) {
            const input = e.target.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            input.value = value + 1;
            const itemId = e.target.closest('.cart-item').dataset.id;
            const item = cartItems.find(item => item.id === itemId);
            if (item) item.quantity = value + 1;
            saveCart();
        }
        
        // Remove item
        if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
            const itemId = e.target.closest('.cart-item').dataset.id;
            cartItems = cartItems.filter(item => item.id !== itemId);
            saveCart();
        }
    });

    // Input change handler
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            const value = parseInt(e.target.value);
            if (value >= 1) {
                const itemId = e.target.closest('.cart-item').dataset.id;
                const item = cartItems.find(item => item.id === itemId);
                if (item) item.quantity = value;
                saveCart();
            }
        }
    });

    // Update cart button
    document.getElementById('updateCart')?.addEventListener('click', function() {
        showToast('Cart updated successfully!');
    });
});