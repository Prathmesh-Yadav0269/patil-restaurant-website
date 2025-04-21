document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Get order data from session storage
    const orderData = getOrderData();
    
    if (orderData) {
        populateOrderData(orderData);
        startDeliveryTimer();
    } else {
        redirectToHome();
    }
    
    // Update cart count in header
    updateCartCount();
});

function getOrderData() {
    try {
        const orderData = JSON.parse(sessionStorage.getItem('orderData'));
        if (!orderData) return null;
        
        // Validate required fields
        if (!orderData.orderNumber || !orderData.customer || !orderData.items) {
            console.error('Invalid order data structure');
            return null;
        }
        
        return orderData;
    } catch (e) {
        console.error('Error parsing order data:', e);
        return null;
    }
}

function populateOrderData(orderData) {
    try {
        // Format currency
        const formatCurrency = (amount) => {
            if (typeof amount !== 'number') {
                amount = parseFloat(amount) || 0;
            }
            return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        };
        
        // Populate order information
        document.getElementById('orderNumber').textContent = orderData.orderNumber || 'N/A';
        document.getElementById('orderDate').textContent = 
            orderData.orderDate || new Date().toLocaleString();
        document.getElementById('orderTotal').textContent = 
            orderData.total ? formatCurrency(orderData.total) : '₹0.00';
        document.getElementById('paymentMethod').textContent = 
            orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 
            orderData.paymentMethod === 'upi' ? 'UPI Payment' : 'N/A';
        
        // Populate customer information
        const customer = orderData.customer || {};
        document.getElementById('customerName').textContent = 
            [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer';
        document.getElementById('deliveryAddress').textContent = 
            [customer.address, customer.city, customer.postalCode].filter(Boolean).join(', ') || 'Address not provided';
        document.getElementById('customerPhone').textContent = 
            customer.phone ? `Phone: ${customer.phone}` : 'Phone: Not provided';
        document.getElementById('deliveryNotes').textContent = 
            orderData.deliveryNotes || 'None provided';
        
        // Populate order items
        const itemsContainer = document.getElementById('orderItemsList');
        itemsContainer.innerHTML = '';
        
        if (orderData.items && orderData.items.length > 0) {
            orderData.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'order-item';
                
                // Use placeholder if image is not provided
                const imageStyle = item.image ? 
                    `background-image: url('${item.image}')` : 
                    'background-color: #eee';
                
                itemElement.innerHTML = `
                    <div class="item-image" style="${imageStyle}"></div>
                    <div class="item-details">
                        <span class="item-name">${item.name || 'Unnamed Item'}</span>
                        <span class="item-quantity">× ${item.quantity || 1}</span>
                    </div>
                    <div class="item-price">${item.price ? formatCurrency(item.price) : '₹0.00'}</div>
                `;
                itemsContainer.appendChild(itemElement);
            });
        } else {
            itemsContainer.innerHTML = '<div class="order-item">No items in this order</div>';
        }
        
        // Clear cart only after successful population
        clearCartData();
    } catch (e) {
        console.error('Error populating order data:', e);
        showErrorState();
    }
}

function startDeliveryTimer() {
    const deliveryTimer = document.getElementById('deliveryTimer');
    if (!deliveryTimer) return;
    
    let maxMinutes = 45;
    let minMinutes = 30;
    
    const timer = setInterval(() => {
        maxMinutes--;
        minMinutes--;
        
        if (maxMinutes <= 0) {
            clearInterval(timer);
            deliveryTimer.textContent = 'Arriving any moment!';
            deliveryTimer.style.color = '#e74c3c';
            return;
        }
        
        if (minMinutes <= 0) minMinutes = 0;
        
        deliveryTimer.textContent = `${minMinutes}-${maxMinutes} minutes`;
        
        if (maxMinutes <= 15) {
            deliveryTimer.style.color = '#e74c3c';
        }
    }, 60000); // Update every minute
}

function clearCartData() {
    try {
        localStorage.removeItem('cart');
        // Don't remove orderData yet - allow page refresh
        updateCartCount();
    } catch (e) {
        console.error('Error clearing cart data:', e);
    }
}

function updateCartCount() {
    const cartNumber = document.querySelector('.cart-number');
    if (cartNumber) {
        cartNumber.textContent = '0';
    }
}

function redirectToHome() {
    // Only redirect if we're not already on the home page
    if (!window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
}

function showErrorState() {
    // Could implement more sophisticated error handling here
    const container = document.querySelector('.thankyou-card');
    if (container) {
        container.innerHTML = `
            <div class="text-center p-5">
                <i class="uil uil-exclamation-triangle" style="font-size: 3rem; color: #e74c3c;"></i>
                <h2>Error Loading Order</h2>
                <p>We couldn't load your order details. Please contact support if this persists.</p>
                <a href="contact.html" class="action-btn support-btn mt-3">
                    <i class="uil uil-question-circle"></i> Contact Support
                </a>
            </div>
        `;
    }
}