const { Router } = require('express');
const bookingsController = require('../controllers/bookings.controller');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(bookingsController.createBooking));
router.get('/my', asyncHandler(bookingsController.getMyBookings));

module.exports = router;
