const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { upload } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/rooms', asyncHandler(adminController.getAllRooms));
router.post('/rooms', asyncHandler(adminController.createRoom));
router.put('/rooms/:id', asyncHandler(adminController.updateRoom));
router.delete('/rooms/:id', asyncHandler(adminController.deleteRoom));
router.get('/bookings', asyncHandler(adminController.getAllBookings));
router.patch('/bookings/:id/cancel', asyncHandler(adminController.cancelBooking));
router.patch('/bookings/:id/confirm', asyncHandler(adminController.confirmBooking));
router.patch('/users/:id/block', asyncHandler(adminController.blockUser));
router.patch('/users/:id/unblock', asyncHandler(adminController.unblockUser));
router.post(
  '/uploads/room-image',
  upload.single('image'),
  asyncHandler(adminController.uploadRoomImage)
);

// Staff and Assignment reports endpoints
router.get('/employees', asyncHandler(adminController.getAllEmployees));
router.post('/employees', asyncHandler(adminController.hireEmployee));
router.delete('/employees/:id', asyncHandler(adminController.fireEmployee));
router.get('/assignment/stats', asyncHandler(adminController.getAssignmentStats));
router.get('/assignment/query1', asyncHandler(adminController.getAssignmentQuery1));
router.get('/assignment/query2', asyncHandler(adminController.getAssignmentQuery2));
router.get('/assignment/query3', asyncHandler(adminController.getAssignmentQuery3));

module.exports = router;
