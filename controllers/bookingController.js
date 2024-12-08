const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create a new booking
  const booking = await Booking.create({
    tour: req.params.tourId,
    user: req.user.id,
    price: tour.price
  });

  // 3) Send a successful response
  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});

exports.createBooking = catchAsync(async (req, res, next) => {
  // Create a new booking
  const newBooking = await Booking.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      booking: newBooking
    }
  });
});

exports.getBooking = factory.getOne(Booking);

exports.getAllBookings = factory.getAll(Booking);

exports.updateBooking = catchAsync(async (req, res, next) => {
  // Update the booking
  const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      booking: updatedBooking
    }
  });
});

exports.deleteBooking = factory.deleteOne(Booking);