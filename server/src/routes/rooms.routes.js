const { Router } = require('express');
const roomsController = require('../controllers/rooms.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.get('/', asyncHandler(roomsController.getRooms));
router.get('/:id', asyncHandler(roomsController.getRoomById));

module.exports = router;
