const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');

function mapRoom(row) {
  const price = Number(row.price);
  const capacity = Number(row.capacity);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price,
    capacity,
    pricePerPerson: capacity > 0 ? (price / capacity) : price,
    floor: row.floor,
    roomType: row.room_type,
    imageUrl: row.image_url,
    isPopular: row.is_popular,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getRooms(req, res) {
  const { popular } = req.query;
  let sql = 'SELECT * FROM rooms ORDER BY id ASC';
  const params = [];

  if (popular === 'true') {
    sql = 'SELECT * FROM rooms WHERE is_popular = true ORDER BY id ASC LIMIT 6';
  }

  const result = await query(sql, params);
  res.json({ data: result.rows.map(mapRoom) });
}

async function getRoomById(req, res) {
  const { id } = req.params;
  const result = await query('SELECT * FROM rooms WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Room not found');
  }

  res.json({ data: mapRoom(result.rows[0]) });
}

module.exports = { getRooms, getRoomById, mapRoom };
