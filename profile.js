document.addEventListener('DOMContentLoaded', function() {
    // Get all the elements we need from the page
    const loginSection = document.getElementById('loginSection');
    const profileHeader = document.getElementById('profileHeader');
    const profileContent = document.getElementById('profileContent');
    const editProfileCard = document.getElementById('editProfileCard');
    const loginForm = document.getElementById('loginForm');
    const profileForm = document.getElementById('profileForm');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEdit = document.getElementById('cancelEdit');
    const logoutBtn = document.getElementById('logoutBtn');
    const profilePic = document.querySelector('.profile-pic');
    const editPicBtn = document.querySelector('.edit-pic-btn');
    
    // Check if user is already logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Show the right screen based on login status
    if (currentUser) {
        showProfile(currentUser);
        checkForNewOrder(currentUser); // Check for new orders from checkout
    } else {
        showLogin();
    }
    
    // Handle login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        // Simple validation
        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Create new user data
        const userData = {
            name: email.split('@')[0], // Use first part of email as name
            email: email,
            phone: '',
            address: '',
            orders: [],
            joinDate: new Date().toISOString(),
            profilePic: ''
        };
        
        // Save user to browser storage
        localStorage.setItem('currentUser', JSON.stringify(userData));
        showMessage('Login successful!', 'success');
        
        // Show profile after short delay
        setTimeout(() => {
            showProfile(userData);
            checkForNewOrder(userData);
        }, 1000);
    });
    
    // Edit Profile Button
    editProfileBtn.addEventListener('click', function() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        // Fill the edit form with current user data
        document.getElementById('fullName').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('address').value = user.address || '';
        
        // Switch to edit mode
        document.querySelector('.view-mode').style.display = 'none';
        editProfileCard.style.display = 'block';
    });
    
    // Cancel Edit Button
    cancelEdit.addEventListener('click', function() {
        // Switch back to view mode
        document.querySelector('.view-mode').style.display = 'block';
        editProfileCard.style.display = 'none';
    });
    
    // Save Profile Changes
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get current user data
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
        
        // Create updated user data
        const userData = {
            name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            orders: currentUser.orders || [],
            joinDate: currentUser.joinDate || new Date().toISOString(),
            profilePic: currentUser.profilePic || ''
        };
        
        // Save updated data
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Update the displayed profile
        updateProfileView(userData);
        
        // Switch back to view mode
        document.querySelector('.view-mode').style.display = 'block';
        editProfileCard.style.display = 'none';
        
        showMessage('Profile updated successfully!', 'success');
    });
    
    // Change Profile Picture
    editPicBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Update profile picture display
                    profilePic.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    profilePic.appendChild(img);
                    
                    // Save to user data
                    const user = JSON.parse(localStorage.getItem('currentUser'));
                    user.profilePic = event.target.result;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    
                    showMessage('Profile picture updated!', 'success');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });
    
    // Logout Button
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        showMessage('Logged out successfully', 'info');
        setTimeout(() => window.location.href = 'index.html', 1000);
    });
    
    // Function to show profile page
    function showProfile(user) {
        loginSection.style.display = 'none';
        profileHeader.style.display = 'block';
        profileContent.style.display = 'grid';
        
        updateProfileView(user);
        
        // Show order count
        if (user.orders && user.orders.length > 0) {
            document.getElementById('orderCount').textContent = user.orders.length;
            renderOrderHistory(user.orders);
        }
        
        // Show membership duration
        if (user.joinDate) {
            const joinDate = new Date(user.joinDate);
            const today = new Date();
            const diffDays = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
            document.getElementById('memberSince').textContent = diffDays;
        }
        
        // Show profile picture if exists
        if (user.profilePic) {
            profilePic.innerHTML = '';
            const img = document.createElement('img');
            img.src = user.profilePic;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            profilePic.appendChild(img);
        }
    }
    
    // Function to update profile information display
    function updateProfileView(user) {
        document.getElementById('profileName').textContent = user.name || 'Customer';
        document.getElementById('profileEmail').textContent = user.email || '';
        document.getElementById('viewFullName').textContent = user.name || 'Not provided';
        document.getElementById('viewEmail').textContent = user.email || 'Not provided';
        document.getElementById('viewPhone').textContent = user.phone || 'Not provided';
        document.getElementById('viewAddress').textContent = user.address || 'Not provided';
    }
    
    // Function to show login form
    function showLogin() {
        loginSection.style.display = 'block';
        profileHeader.style.display = 'none';
        profileContent.style.display = 'none';
    }
    
    // Function to display order history
    function renderOrderHistory(orders) {
        const orderHistory = document.getElementById('orderHistory');
        
        if (!orders || orders.length === 0) {
            orderHistory.innerHTML = `
                <div class="no-orders">
                    <i class="uil uil-bowl"></i>
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet</p>
                    <a href="menu.html" class="btn btn-primary">Browse Menu</a>
                </div>
            `;
            return;
        }
        
        let ordersHTML = '';
        orders.forEach(order => {
            // Get order items (ensure it's always an array)
            const items = Array.isArray(order.items) ? order.items : [order.items];
            
            // Get item names or default to "Item"
            const itemNames = items.map(item => item.name || 'Item');
            
            // Format order date
            const orderDate = new Date(order.date || new Date());
            const formattedDate = orderDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Format order total (ensure it's a number)
            const orderTotal = typeof order.total === 'number' ? order.total : 0;
            
            ordersHTML += `
                <div class="order-item">
                    <div class="order-info">
                        <div class="order-name">${itemNames.join(', ')}</div>
                        <div class="order-date">${formattedDate}</div>
                    </div>
                    <div class="order-price">₹${orderTotal.toFixed(2)}</div>
                </div>
            `;
        });
        
        orderHistory.innerHTML = ordersHTML;
    }
    
    // Function to check for new orders from checkout
    function checkForNewOrder(user) {
        const orderData = JSON.parse(sessionStorage.getItem('orderData'));
        
        if (orderData && user) {
            // Create new order object
            const newOrder = {
                items: orderData.items || [],
                total: parseFloat((orderData.total || '0').replace('₹', '')),
                date: new Date().toISOString()
            };
            
            // Add to user's orders
            if (!user.orders) user.orders = [];
            user.orders.unshift(newOrder); // Add to beginning of array
            
            // Save updated user data
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Remove the temporary order data
            sessionStorage.removeItem('orderData');
            
            // Update the display
            document.getElementById('orderCount').textContent = user.orders.length;
            renderOrderHistory(user.orders);
            
            showMessage('New order added to your history!', 'success');
        }
    }
    
    // Function to show messages/notifications
    function showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }, 100);
    }
});