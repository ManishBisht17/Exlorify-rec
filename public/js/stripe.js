import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    // 1) Make a request to the server to create a booking (no payment involved)
    const response = await axios.post(`/api/v1/bookings/create-booking/${tourId}`);

    // 2) If booking is successful, redirect to the 'my tours' page or display a success message
    if (response.data.status === 'success') {
      window.location.href = '/my-tours?alert=booking'; // Redirect to a page that shows user's bookings
    } else {
      throw new Error('Booking failed');
    }
  } catch (error) {
    console.error('Booking error:', error);
    showAlert('error', error.response?.data?.message || error.message || 'Something went wrong');
  }
};
