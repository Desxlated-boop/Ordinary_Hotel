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

// ==========================================
// Assignment №1: Staff Management & Queries
// ==========================================

async function getAllEmployees(req, res) {
  const result = await query('SELECT * FROM employees ORDER BY id DESC');
  const employees = result.rows.map(row => ({
    id: row.id,
    fullName: row.full_name,
    floors: row.floors,
    daysOfWeek: row.days_of_week,
    createdAt: row.created_at
  }));
  res.json({ data: employees });
}

async function hireEmployee(req, res) {
  const { fullName, floors, daysOfWeek } = req.body;
  if (!fullName || !floors || !daysOfWeek) {
    throw new ApiError(400, 'fullName, floors (array), and daysOfWeek (array) are required');
  }
  const parsedFloors = Array.isArray(floors) ? floors.map(Number) : [Number(floors)];
  const parsedDays = Array.isArray(daysOfWeek) ? daysOfWeek : [daysOfWeek];

  const result = await query(
    `INSERT INTO employees (full_name, floors, days_of_week)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [fullName.trim(), parsedFloors, parsedDays]
  );
  const row = result.rows[0];
  res.status(201).json({
    data: {
      id: row.id,
      fullName: row.full_name,
      floors: row.floors,
      daysOfWeek: row.days_of_week,
      createdAt: row.created_at
    }
  });
}

async function fireEmployee(req, res) {
  const { id } = req.params;
  const result = await query('DELETE FROM employees WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Employee not found');
  }
  res.json({ data: { id: Number(id) } });
}

async function getAssignmentStats(req, res) {
  const { date } = req.query;
  const dateValue = date || new Date().toISOString().split('T')[0];

  // Free rooms check
  const freeRoomsQuery = await query(`
    SELECT 
      (SELECT COUNT(*) FROM rooms) - COALESCE(COUNT(DISTINCT room_id), 0) AS free_rooms
    FROM bookings
    WHERE status = 'confirmed' AND $1::date >= check_in AND $1::date < check_out
  `, [dateValue]);
  let freeRooms = Number(freeRoomsQuery.rows[0].free_rooms);
  if (freeRooms < 0) freeRooms = 0;

  // Occupied beds check (sum of guest_count for confirmed bookings)
  const occupiedBedsQuery = await query(`
    SELECT COALESCE(SUM(guest_count), 0) AS occupied_beds
    FROM bookings
    WHERE status = 'confirmed' AND $1::date >= check_in AND $1::date < check_out
  `, [dateValue]);
  const occupiedBeds = Number(occupiedBedsQuery.rows[0].occupied_beds);

  // Total beds limit
  const totalBedsQuery = await query(`SELECT COALESCE(SUM(capacity), 0) AS total_beds FROM rooms`);
  const totalBeds = Number(totalBedsQuery.rows[0].total_beds);
  let freeBeds = totalBeds - occupiedBeds;
  if (freeBeds < 0) freeBeds = 0;

  // Total cash paid by clients
  // Cost = (days) * (price / capacity) * guest_count
  const totalPaidQuery = await query(`
    SELECT COALESCE(SUM(
      (b.check_out - b.check_in) * (r.price / r.capacity) * b.guest_count
    ), 0) AS total_paid
    FROM bookings b
    JOIN rooms r ON r.id = b.room_id
    WHERE b.status = 'confirmed'
  `);
  const totalPaid = Number(totalPaidQuery.rows[0].total_paid);

  // Clients in single rooms
  const singleRoomClientsQuery = await query(`
    SELECT b.id, b.guest_name, b.check_in, b.check_out, r.title AS room_title, b.origin_city, b.passport
    FROM bookings b
    JOIN rooms r ON r.id = b.room_id
    WHERE b.status = 'confirmed' AND r.capacity = 1
    ORDER BY b.check_in DESC
  `);

  res.json({
    data: {
      freeRooms,
      freeBeds,
      totalBeds,
      totalPaid,
      singleRoomClients: singleRoomClientsQuery.rows.map(row => ({
        id: row.id,
        guestName: row.guest_name,
        checkIn: row.check_in,
        checkOut: row.check_out,
        roomTitle: row.room_title,
        originCity: row.origin_city,
        passport: row.passport
      }))
    }
  });
}

async function getAssignmentQuery1(req, res) {
  const { floor, roomId } = req.query;
  if (!floor || !roomId) {
    throw new ApiError(400, 'floor and roomId are required');
  }
  const result = await query(
    'SELECT price, capacity, floor, title FROM rooms WHERE id = $1 AND floor = $2',
    [roomId, floor]
  );
  if (result.rows.length === 0) {
    return res.json({ data: { found: false } });
  }
  const { price, capacity, title } = result.rows[0];
  const placeCost = Number(price) / Number(capacity);
  res.json({
    data: {
      found: true,
      title,
      price: Number(price),
      capacity,
      placeCost
    }
  });
}

async function getAssignmentQuery2(req, res) {
  const { city } = req.query;
  if (!city) {
    throw new ApiError(400, 'city query param is required');
  }
  const result = await query(
    `SELECT b.id, b.guest_name, b.passport, b.origin_city, b.check_in, b.check_out, b.bed_number, r.title AS room_title
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     WHERE LOWER(b.origin_city) = LOWER($1) AND b.status = 'confirmed'
     ORDER BY b.check_in DESC`,
    [city.trim()]
  );
  res.json({
    data: result.rows.map(row => ({
      id: row.id,
      guestName: row.guest_name,
      passport: row.passport,
      originCity: row.origin_city,
      checkIn: row.check_in,
      checkOut: row.check_out,
      bedNumber: row.bed_number,
      roomTitle: row.room_title
    }))
  });
}

async function getAssignmentQuery3(req, res) {
  const { clientName, dayOfWeek } = req.query;
  if (!clientName || !dayOfWeek) {
    throw new ApiError(400, 'clientName and dayOfWeek are required');
  }

  // 1. Find rooms & floors for this client name
  const roomsQuery = await query(
    `SELECT DISTINCT r.floor, r.title
     FROM bookings b
     JOIN rooms r ON r.id = b.room_id
     WHERE LOWER(b.guest_name) LIKE LOWER($1) AND b.status = 'confirmed'`,
    [`%${clientName.trim()}%`]
  );

  if (roomsQuery.rows.length === 0) {
    return res.json({
      data: {
        foundClient: false,
        clientName,
        employees: []
      }
    });
  }

  const floors = roomsQuery.rows.map(row => row.floor);

  // 2. Query cleaners who clean these floors on specified dayOfWeek
  const cleanersQuery = await query(
    `SELECT id, full_name, floors, days_of_week
     FROM employees
     WHERE $1 = ANY(days_of_week) 
       AND (
         SELECT bool_or(x = ANY(floors)) 
         FROM unnest($2::int[]) x
       )`,
    [dayOfWeek.trim(), floors]
  );

  res.json({
    data: {
      foundClient: true,
      clientName,
      floorsMatched: floors,
      roomsMatched: roomsQuery.rows.map(r => r.title),
      employees: cleanersQuery.rows.map(row => ({
        id: row.id,
        fullName: row.full_name,
        floors: row.floors,
        daysOfWeek: row.days_of_week
      }))
    }
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
  getAllEmployees,
  hireEmployee,
  fireEmployee,
  getAssignmentStats,
  getAssignmentQuery1,
  getAssignmentQuery2,
  getAssignmentQuery3,
};
