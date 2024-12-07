const paypal = require('@paypal/checkout-server-sdk');
const Tour = require('../modules/tourModel');
const User = require('../modules/userModel');
const Booking = require('../modules/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// Configure PayPal environment
const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID, 
      process.env.PAYPAL_CLIENT_SECRET
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_SANDBOX_CLIENT_ID, 
      process.env.PAYPAL_SANDBOX_CLIENT_SECRET
    );

const paypalClient = new paypal.core.PayPalHttpClient(environment);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  
  // 2) Create PayPal order
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: tour.price.toFixed(2),
        breakdown: {
          item_total: {
            currency_code: 'USD',
            value: tour.price.toFixed(2)
          }
        }
      },
      items: [{
        name: `${tour.name} Tour`,
        description: tour.summary,
        unit_amount: {
          currency_code: 'USD',
          value: tour.price.toFixed(2)
        },
        quantity: '1'
      }]
    }],
    application_context: {
      return_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`
    }
  });

  try {
    const order = await paypalClient.execute(request);

    // 3) Send order details as response
    res.status(200).json({
      status: 'success',
      orderID: order.result.id,
      links: order.result.links
    });
  } catch (err) {
    console.error('PayPal Order Creation Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Could not create PayPal order'
    });
  }
});

const createBookingCheckout = async (paypalOrderDetails) => {
  const { id, purchase_units, payer } = paypalOrderDetails;
  
  const tour = purchase_units[0].reference_id;
  const user = (await User.findOne({ email: payer.email_address })).id;
  const price = parseFloat(purchase_units[0].amount.value);
  
  await Booking.create({ 
    tour, 
    user, 
    price,
    paymentMethod: 'PayPal',
    paymentID: id 
  });
};

exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const { orderID } = req.body;

  try {
    // Verify the PayPal order
    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
    captureRequest.requestBody({});
    
    const capture = await paypalClient.execute(captureRequest);

    // Create booking if payment is successful
    if (capture.result.status === 'COMPLETED') {
      await createBookingCheckout(capture.result);
      
      res.status(200).json({ 
        status: 'success', 
        message: 'Payment captured successfully' 
      });
    } else {
      res.status(400).json({ 
        status: 'error', 
        message: 'Payment not completed' 
      });
    }
  } catch (err) {
    console.error('PayPal Webhook Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Could not process PayPal webhook'
    });
  }
});

// Keep other booking methods from the original controller
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);