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
    passport: row.passport,
    originCity: row.origin_city,
    bedNumber: row.bed_number,
    guestCount: row.guest_count || 1,
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
    throw new ApiError(409, 'Номер недоступен на выбранные даты (уже занят)');
  }
}

async function createBooking(req, res) {
  const { roomId, guestName, checkIn, checkOut, passport, originCity, bedNumber, guestCount } = req.body;

  if (!roomId || !guestName || !checkIn || !checkOut) {
    throw new ApiError(400, 'roomId, guestName, checkIn and checkOut are required');
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    throw new ApiError(400, 'Check-out must be after check-in');
  }

  const room = await query('SELECT id, capacity FROM rooms WHERE id = $1', [roomId]);
  if (room.rows.length === 0) {
    throw new ApiError(404, 'Room not found');
  }

  const capacity = room.rows[0].capacity;
  const numGuests = guestCount ? Number(guestCount) : 1;
  if (numGuests < 1 || numGuests > capacity) {
    throw new ApiError(400, `Количество гостей должно быть от 1 до ${capacity}`);
  }


  const personConflict = await query(
    `SELECT id FROM bookings
     WHERE (user_id = $1 OR LOWER(guest_name) = LOWER($2))
       AND status = 'confirmed'
       AND check_in < $4 AND check_out > $3`,
    [req.user.id, guestName.trim(), checkIn, checkOut]
  );

  if (personConflict.rows.length > 0) {
    throw new ApiError(409, 'Извините, у вас уже есть подтвержденное бронирование номера на выбранный или пересекающийся период дат.');
  }

  const assignedBed = bedNumber ? Number(bedNumber) : Math.floor(Math.random() * capacity) + 1;

  await assertRoomAvailable(roomId, checkIn, checkOut);

  const result = await query(
    `INSERT INTO bookings (user_id, room_id, check_in, check_out, guest_name, passport, origin_city, bed_number, guest_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      req.user.id,
      roomId,
      checkIn,
      checkOut,
      guestName.trim(),
      passport ? passport.trim() : null,
      originCity ? originCity.trim() : null,
      assignedBed,
      numGuests
    ]
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
