const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');

function mapBooking(row) {
  return {
    id: row.id,
    userId: row.user_id,
    roomId: row.room_id,
    roomTitle: row.room_title,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guestName: row.guest_name,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function assertRoomAvailable(roomId, checkIn, checkOut) {
  const conflict = await query(
    `SELECT id FROM bookings
     WHERE room_id = $1 AND status = 'confirmed'
       AND check_in < $3 AND check_out > $2`,
    [roomId, checkIn, checkOut]
  );

  if (conflict.rows.length > 0) {
    throw new ApiError(409, 'Room is not available for selected dates');
  }
}

async function createBooking(req, res) {
  const { roomId, guestName, checkIn, checkOut } = req.body;

  if (!roomId || !guestName || !checkIn || !checkOut) {
    throw new ApiError(400, 'roomId, guestName, checkIn and checkOut are required');
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    throw new ApiError(400, 'Check-out must be after check-in');
  }

  const room = await query('SELECT id FROM rooms WHERE id = $1', [roomId]);
  if (room.rows.length === 0) {
    throw new ApiError(404, 'Room not found');
  }

  await assertRoomAvailable(roomId, checkIn, checkOut);

  const result = await query(
    `INSERT INTO bookings (user_id, room_id, check_in, check_out, guest_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user.id, roomId, checkIn, checkOut, guestName.trim()]
  );

  res.status(201).json({ data: mapBooking({ ...result.rows[0], room_title: null }) });
}

async function getMyBookings(req, res) {
  const result = await query(
    `SELECT b.*, r.title AS room_title
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [req.user.id]
  );

  res.json({ data: result.rows.map(mapBooking) });
}

module.exports = { createBooking, getMyBookings, mapBooking };
