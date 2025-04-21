document.addEventListener('DOMContentLoaded', function() {
    console.log("Checkout DOM Loaded - Initializing Script");

    // --- Helper Function for Robust Element Selection ---
    function getElement(selector, required = true, context = document) {
        const element = context.querySelector(selector);
        if (!element && required) {
            console.error(`CRITICAL ERROR: Element with selector "${selector}" not found, but is required.`);
        } else if (!element && !required) {
             console.warn(`Optional element with selector "${selector}" not found.`);
        }
        return element;
    }

    function getElements(selector, context = document) {
        const elements = context.querySelectorAll(selector);
        if (!elements || elements.length === 0) {
             console.warn(`No elements found with selector "${selector}".`);
        }
        return elements;
    }

    // --- Global Elements (Using Helper Function) ---
    console.log("Selecting DOM elements...");
    const orderItemsContainer = getElement('#orderItems');
    const subtotalEl = getElement('#subtotal');
    const taxEl = getElement('#tax');
    const totalEl = getElement('#total');
    const upiTotalAmountEl = getElement('#upiTotalAmount'); // In UPI section
    const checkoutForm = getElement('#checkoutForm');
    const paymentMethodRadios = getElements('input[name="payment_method"]');
    const upiDetailsSection = getElement('#upiDetailsSection');
    const upiTransactionIdInput = getElement('#upiTransactionId');
    const paymentScreenshotInput = getElement('#paymentScreenshot');
    const submitButton = getElement('#submitButton');
    const cartNumberEl = getElement('.cart-number', false); // Header element might be optional
    const paymentNoticeEl = getElement('#paymentNotice');

    // Hidden fields for form submission
    const orderSubtotalHidden = getElement('#orderSubtotalHidden');
    const orderTaxHidden = getElement('#orderTaxHidden');
    const orderTotalHidden = getElement('#orderTotalHidden');
    const orderItemsSummaryHidden = getElement('#orderItemsSummaryHidden');
    console.log("DOM elements selected.");

    // --- Load Cart and Initial Setup ---
    let cartItems = [];
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cartItems = JSON.parse(cartData) || [];
             if (!Array.isArray(cartItems)) {
                console.warn("Cart data in localStorage was not an array. Resetting to empty.", cartItems);
                cartItems = [];
            }
        }
        console.log("Cart items loaded from localStorage:", cartItems);
    } catch (e) {
        console.error("Error parsing cart data from localStorage:", e);
        cartItems = []; // Default to empty cart on error
    }

    // --- Initial Page State ---
    if (!checkoutForm || !orderItemsContainer || !subtotalEl || !taxEl || !totalEl || !paymentNoticeEl ) {
         console.error("One or more critical elements are missing. Checkout page cannot function correctly. Check HTML IDs.");
         if(orderItemsContainer) orderItemsContainer.innerHTML = '<p class="text-center text-danger py-3">Error loading checkout page components.</p>';
         return;
    }

    if (cartItems.length === 0) {
        console.log("Cart is empty. Disabling form.");
        orderItemsContainer.innerHTML = '<p class="text-center text-muted py-3">Your cart is empty.</p>';
        if(submitButton) submitButton.disabled = true;
        paymentNoticeEl.textContent = "Add items to your cart to proceed.";
        if(cartNumberEl) cartNumberEl.textContent = '0';
    } else {
        console.log("Cart has items. Setting up page.");
        updateOrderSummary();
        setupEventListeners();
        updateCartCount();
        handlePaymentMethodChange();
    }

    // --- Functions ---

    function updateOrderSummary() {
        console.log("Updating order summary...");
        let subtotal = 0;
        let itemsSummary = [];

        orderItemsContainer.innerHTML = '';

        cartItems.forEach((item, index) => {
            const itemPrice = parseFloat(item?.price || 0);
            const itemQuantity = parseInt(item?.quantity || 0, 10);

             if (isNaN(itemPrice) || isNaN(itemQuantity)) {
                console.warn(`Item at index ${index} has invalid price or quantity:`, item);
            }

            const itemTotal = itemPrice * itemQuantity;
            subtotal += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item?.name || 'Unknown Item'}</span>
                    <span class="item-quantity">× ${itemQuantity}</span>
                </div>
                <span class="item-price">₹${itemTotal.toFixed(2)}</span>
            `;
            orderItemsContainer.appendChild(itemElement);

            itemsSummary.push(`${item?.name || 'Item'} (Qty: ${itemQuantity}) @ ₹${itemPrice.toFixed(2)} = ₹${itemTotal.toFixed(2)}`);
        });

        const taxRate = 0.05;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        if(subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
        if(taxEl) taxEl.textContent = `₹${tax.toFixed(2)}`;
        if(totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
        if(upiTotalAmountEl) upiTotalAmountEl.textContent = `₹${total.toFixed(2)}`;

        if(orderSubtotalHidden) orderSubtotalHidden.value = subtotal.toFixed(2);
        if(orderTaxHidden) orderTaxHidden.value = tax.toFixed(2);
        if(orderTotalHidden) orderTotalHidden.value = total.toFixed(2);
        if(orderItemsSummaryHidden) orderItemsSummaryHidden.value = itemsSummary.join('\n');

        console.log("Order summary updated:", { subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: total.toFixed(2) });
        return { subtotal, tax, total };
    }

    function setupEventListeners() {
        console.log("Setting up event listeners...");
        if (paymentMethodRadios && paymentMethodRadios.length > 0) {
            paymentMethodRadios.forEach(radio => {
                radio.addEventListener('change', handlePaymentMethodChange);
            });
            console.log("Payment method change listeners attached.");
        } else {
             console.warn("No payment method radio buttons found to attach listeners.");
        }

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleFormSubmit);
            console.log("Form submit listener attached.");
        }
    }

    function handlePaymentMethodChange() {
        const selectedMethod = document.querySelector('input[name="payment_method"]:checked')?.value;
        console.log("Payment method changed to:", selectedMethod);

        if (!upiDetailsSection || !upiTransactionIdInput || !paymentScreenshotInput) {
            console.error("UPI related elements missing in HTML. Cannot toggle section or requirements.");
            return;
        }

        if (selectedMethod === 'upi') {
            upiDetailsSection.style.display = 'block';
            upiTransactionIdInput.required = true;
            paymentScreenshotInput.required = true;
            if(paymentNoticeEl) paymentNoticeEl.textContent = "Complete UPI payment & upload details.";
            console.log("UPI section shown, fields set to required.");
        } else {
            upiDetailsSection.style.display = 'none';
            upiTransactionIdInput.required = false;
            paymentScreenshotInput.required = false;
            if(paymentNoticeEl) paymentNoticeEl.textContent = "You'll pay cash upon delivery.";
            console.log("UPI section hidden, fields set to not required.");
            clearValidation([upiTransactionIdInput, paymentScreenshotInput]);
        }
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        console.log("Form submission triggered...");

        if (!validateForm()) {
            console.warn("Form validation failed. Submission halted.");
            showToast("Please fill in all required fields correctly.", 'error');
             const firstInvalid = checkoutForm.querySelector('.is-invalid');
             if(firstInvalid) {
                 try {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid.focus({ preventScroll: true });
                    console.log("Scrolled and focused on first invalid field:", firstInvalid.id || firstInvalid.name);
                 } catch (e) {
                    console.error("Error scrolling/focusing on invalid field:", e);
                 }
             }
            return;
        }

        console.log("Form validation passed. Proceeding with submission.");

        // Store order data for profile page
        const orderData = {
            items: cartItems.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            total: document.getElementById('total').textContent
        };
        sessionStorage.setItem('orderData', JSON.stringify(orderData));

        if(submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Placing Order...';
        }

        let formData;
        try {
            formData = new FormData(checkoutForm);
            console.log("FormData object created successfully.");
        } catch (e) {
            console.error("Error creating FormData:", e);
            showToast("An error occurred preparing your order data.", 'error');
            if(submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Place Order';
            }
            return;
        }

        const formAction = checkoutForm.action;
        if (!formAction) {
             console.error("Form action URL is missing!");
             showToast("Configuration error: Cannot submit order.", 'error');
              if(submitButton) { submitButton.disabled = false; submitButton.textContent = 'Place Order'; }
             return;
        }
        console.log("Submitting FormData to GetForm endpoint:", formAction);

        fetch(formAction, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            console.log("Received response from GetForm. Status:", response.status, response.statusText);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error(`GetForm submission failed. Status: ${response.status}. Response Text: ${text}`);
                    throw new Error(`Submission failed (${response.status}). Please try again.`);
                });
            }
            console.log("GetForm response OK. Parsing JSON response...");
            return response.json();
        })
        .then(data => {
            console.log('GetForm submission successful. Response data:', data);
            showToast("Order placed successfully! Thank you.", 'success');

            try {
                localStorage.removeItem('cart');
                console.log("Cart data cleared from localStorage.");
            } catch (e) {
                console.error("Error clearing cart from localStorage:", e);
            }

            try {
                checkoutForm.reset();
                 console.log("Checkout form reset.");
                 clearValidation(checkoutForm.querySelectorAll('.form-control, .form-check-input'));
                 handlePaymentMethodChange();
            } catch (e) {
                 console.error("Error resetting the form:", e);
            }

            updateCartCount(0);

             console.log("Redirecting to thank-you page in 2 seconds...");
             setTimeout(() => {
                 window.location.href = 'thank-you.html';
             }, 2000);

        })
        .catch(error => {
            console.error('Error during form submission or response handling:', error);
            showToast(`Order submission failed. ${error.message || 'Please check your connection and try again.'}`, 'error');
             if(submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Place Order';
             }
        });
    }

    function validateForm() {
        console.log("Starting form validation...");
        let isFormValid = true;
        const inputsToValidate = checkoutForm.querySelectorAll('input[required], textarea[required], select[required]');
        const selectedPaymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value;

        clearValidation(checkoutForm.querySelectorAll('.form-control, .form-check-input'));
        console.log(`Found ${inputsToValidate.length} potentially required inputs. Payment method: ${selectedPaymentMethod}`);

        inputsToValidate.forEach(input => {
            let isFieldValid = true;
            let isFieldRequired = input.required;

            if (input.id === 'upiTransactionId' || input.id === 'paymentScreenshot') {
                if (selectedPaymentMethod !== 'upi') {
                    isFieldRequired = false;
                    console.log(`Field ${input.id} is not required because payment method is not UPI.`);
                } else {
                    isFieldRequired = true;
                     console.log(`Field ${input.id} IS required because payment method is UPI.`);
                }
            }

            if (!isFieldRequired) {
                console.log(`Skipping validation for optional field: ${input.id || input.name}`);
                return;
            }

             console.log(`Validating required field: ${input.id || input.name}`);
            if (input.type === 'checkbox') {
                isFieldValid = input.checked;
            } else if (input.type === 'radio') {
                const radioGroup = checkoutForm.querySelectorAll(`input[name="${input.name}"]`);
                isFieldValid = Array.from(radioGroup).some(radio => radio.checked);
            } else if (input.type === 'file') {
                 if (isFieldRequired) {
                    isFieldValid = input.files && input.files.length > 0;
                 }
            } else if (input.type === 'email') {
                 isFieldValid = input.value.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
            } else {
                 isFieldValid = input.value.trim() !== '';
            }

            if (!isFieldValid) {
                console.warn(`Validation FAILED for field: ${input.id || input.name}`);
                input.classList.add('is-invalid');
                 const feedback = input.closest('.form-group')?.querySelector('.invalid-feedback');
                 if (feedback) {
                     feedback.style.display = 'block';
                 } else {
                      console.warn(`No .invalid-feedback element found near ${input.id || input.name}`);
                 }
                isFormValid = false;
            } else {
                 console.log(`Validation PASSED for field: ${input.id || input.name}`);
            }
        });

        console.log("Overall form validation result:", isFormValid);
        return isFormValid;
    }

    function clearValidation(elements) {
        console.log("Clearing validation styles...");
         elements.forEach(el => {
            if(el) {
                 el.classList.remove('is-invalid');
                 const feedback = el.closest('.form-group')?.querySelector('.invalid-feedback');
                 if (feedback) {
                     feedback.style.display = 'none';
                 }
             }
         });
    }

    function updateCartCount(count = null) {
        if (cartNumberEl) {
            const currentCount = count ?? cartItems.reduce((total, item) => total + parseInt(item?.quantity || 0, 10), 0);
            cartNumberEl.textContent = currentCount;
            console.log("Header cart count updated:", currentCount);
        }
    }

    function showToast(message, type = 'info') {
        console.log(`Toast (${type}): "${message}"`);
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        const displayDuration = (type === 'error' ? 5000 : 4000);
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => {
                    if (toast.parentElement) toast.remove();
                }, { once: true });
                setTimeout(() => {
                    if (toast.parentElement) toast.remove();
                }, 600);
            }
        }, displayDuration);
    }

    console.log("Checkout script initialization complete.");
});