const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const { mapRoom } = require('./rooms.controller');
const { mapBooking } = require('./bookings.controller');

async function getAllRooms(req, res) {
  const result = await query('SELECT * FROM rooms ORDER BY id ASC');
  res.json({ data: result.rows.map(mapRoom) });
}

async function createRoom(req, res) {
  const { title, description, price, capacity, imageUrl, isPopular } = req.body;

  if (!title || !description || price == null || !capacity) {
    throw new ApiError(400, 'title, description, price and capacity are required');
  }

  const result = await query(
    `INSERT INTO rooms (title, description, price, capacity, image_url, is_popular)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, description, price, capacity, imageUrl || null, Boolean(isPopular)]
  );

  res.status(201).json({ data: mapRoom(result.rows[0]) });
}

async function updateRoom(req, res) {
  const { id } = req.params;
  const { title, description, price, capacity, imageUrl, isPopular } = req.body;

  const result = await query(
    `UPDATE rooms SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       price = COALESCE($3, price),
       capacity = COALESCE($4, capacity),
       image_url = COALESCE($5, image_url),
       is_popular = COALESCE($6, is_popular),
       updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [title, description, price, capacity, imageUrl, isPopular, id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Room not found');
  }

  res.json({ data: mapRoom(result.rows[0]) });
}

async function deleteRoom(req, res) {
  const { id } = req.params;

  const activeBookings = await query(
    `SELECT id FROM bookings
     WHERE room_id = $1 AND status = 'confirmed' AND check_out >= CURRENT_DATE`,
    [id]
  );

  if (activeBookings.rows.length > 0) {
    throw new ApiError(409, 'Cannot delete room with active bookings');
  }

  const result = await query('DELETE FROM rooms WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Room not found');
  }

  res.status(204).send();
}

async function getAllBookings(req, res) {
  const result = await query(
    `SELECT b.*, r.title AS room_title, u.email AS user_email, u.is_blocked AS user_blocked
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     JOIN users u ON u.id = b.user_id
     ORDER BY b.created_at DESC`
  );

  res.json({
    data: result.rows.map((row) => ({
      ...mapBooking(row),
      userEmail: row.user_email,
      userBlocked: row.user_blocked,
    })),
  });
}

async function cancelBooking(req, res) {
  const { id } = req.params;

  const existing = await query('SELECT id, status FROM bookings WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Booking not found');
  }

  if (existing.rows[0].status === 'cancelled') {
    return res.json({ data: { id: Number(id), status: 'cancelled' } });
  }

  const updated = await query(
    `UPDATE bookings
     SET status = 'cancelled'
     WHERE id = $1
     RETURNING id, status`,
    [id]
  );

  res.json({ data: updated.rows[0] });
}

async function confirmBooking(req, res) {
  const { id } = req.params;

  const existing = await query(
    `SELECT b.id, b.status, b.user_id, u.is_blocked, b.room_id, b.check_in, b.check_out 
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     WHERE b.id = $1`,
    [id]
  );
  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Booking not found');
  }

  const booking = existing.rows[0];
  if (booking.is_blocked) {
    throw new ApiError(400, 'Невозможно восстановить бронирование заблокированного пользователя');
  }

  if (booking.status === 'confirmed') {
    return res.json({ data: { id: Number(id), status: 'confirmed' } });
  }

  // Check if the room is still available for those dates
  const conflict = await query(
    `SELECT id FROM bookings
     WHERE room_id = $1
       AND status = 'confirmed'
       AND id <> $2
       AND NOT (check_out <= $3 OR check_in >= $4)`,
    [booking.room_id, id, booking.check_in, booking.check_out]
  );

  if (conflict.rows.length > 0) {
    throw new ApiError(409, 'Номер недоступен на выбранные даты (уже забронирован кем-то другим)');
  }

  const updated = await query(
    `UPDATE bookings
     SET status = 'confirmed'
     WHERE id = $1
     RETURNING id, status`,
    [id]
  );

  res.json({ data: updated.rows[0] });
}

async function blockUser(req, res) {
  const { id } = req.params;

  if (Number(id) === Number(req.user.id)) {
    throw new ApiError(400, 'Вы не можете заблокировать самого себя');
  }

  const updated = await query(
    `UPDATE users SET is_blocked = true WHERE id = $1 RETURNING id, email, is_blocked`,
    [id]
  );
  if (updated.rows.length === 0) throw new ApiError(404, 'User not found');

  // Automatically cancel all active bookings of the blocked user
  await query(
    `UPDATE bookings SET status = 'cancelled' WHERE user_id = $1 AND status = 'confirmed'`,
    [id]
  );

  res.json({ data: { id: updated.rows[0].id, email: updated.rows[0].email, isBlocked: updated.rows[0].is_blocked } });
}

async function unblockUser(req, res) {
  const { id } = req.params;
  const updated = await query(
    `UPDATE users SET is_blocked = false WHERE id = $1 RETURNING id, email, is_blocked`,
    [id]
  );
  if (updated.rows.length === 0) throw new ApiError(404, 'User not found');
  res.json({ data: { id: updated.rows[0].id, email: updated.rows[0].email, isBlocked: updated.rows[0].is_blocked } });
}

async function uploadRoomImage(req, res) {
  if (!req.file) {
    throw new ApiError(400, 'Image file is required');
  }
  res.status(201).json({
    data: {
      url: `/uploads/${req.file.filename}`,
    },
  });
}

module.exports = {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllBookings,
  cancelBooking,
  confirmBooking,
  blockUser,
  unblockUser,
  uploadRoomImage,
};
