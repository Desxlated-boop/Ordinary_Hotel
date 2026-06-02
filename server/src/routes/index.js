const { Router } = require('express');
const authRoutes = require('./auth.routes');
const roomsRoutes = require('./rooms.routes');
const bookingsRoutes = require('./bookings.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/rooms', roomsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
