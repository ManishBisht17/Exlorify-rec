import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    // 1) Get PayPal order from API
    const response = await axios.get(`/api/v1/bookings/checkout-session/${tourId}`);
    const { orderID, links } = response.data;

    // 2) Find the approval link
    const approvalLink = links.find(link => link.rel === 'approve');
    
    if (!approvalLink) {
      throw new Error('Payment processing failed. No approval link found.');
    }

    // 3) Redirect to PayPal for payment
    window.location.href = approvalLink.href;
  } catch (error) {
    console.error('Booking error:', error);
    showAlert('error', error.response?.data?.message || error.message || 'Something went wrong');
  }
};

// Optional: Add PayPal script loader if you want to use PayPal's client-side SDK
export const loadPayPalScript = () => {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=USD';
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = (error) => reject(error);
    document.body.appendChild(script);
  });
};

// Optional: Alternative implementation using PayPal buttons directly
export const bookTourWithPayPalButtons = async (tourId, elementId) => {
  try {
    // Load PayPal script
    const paypal = await loadPayPalScript();

    // Fetch order details from backend
    const response = await axios.get(`/api/v1/bookings/checkout-session/${tourId}`);
    const { orderID } = response.data;

    // Render PayPal buttons
    paypal.Buttons({
      createOrder: async () => {
        // Order already created on backend, just return the orderID
        return orderID;
      },
      onApprove: async (data, actions) => {
        try {
          // Capture the funds from the transaction
          const captureDetails = await axios.post('/api/v1/bookings/webhook-checkout', {
            orderID: data.orderID
          });

          // Redirect or show success message
          window.location.href = '/my-tours?alert=booking';
        } catch (error) {
          console.error('Payment capture error:', error);
          showAlert('error', 'Payment processing failed');
        }
      },
      onError: (err) => {
        console.error('PayPal Button Error:', err);
        showAlert('error', 'Payment processing failed');
      }
    }).render(`#${elementId}`);
  } catch (error) {
    console.error('PayPal initialization error:', error);
    showAlert('error', 'Could not initialize payment');
  }
};