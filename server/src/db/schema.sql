-- Hotel Booking System schema

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_blocked    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  capacity    INT NOT NULL CHECK (capacity > 0),
  image_url   VARCHAR(500),
  is_popular  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id     INT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in    DATE NOT NULL,
  check_out   DATE NOT NULL,
  guest_name  VARCHAR(120) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_rooms_popular ON rooms(is_popular) WHERE is_popular = true;

-- Seed rooms (idempotent: only if empty)
INSERT INTO rooms (title, description, price, capacity, image_url, is_popular)
SELECT * FROM (VALUES
  ('Эконом (1 гость)', 'Уютный одноместный номер для коротких поездок: удобная кровать, рабочая зона и базовые удобства.', 2500.00, 1, '/images/econom-1p.png', true),
  ('Стандарт (3 гостя)', 'Светлый номер с тремя отдельными кроватями. Подходит для компании или семьи с детьми.', 4200.00, 3, '/images/standard-3p.png', true),
  ('Комфорт (до 3 гостей)', 'Улучшенный номер с двуспальной кроватью и мягким освещением. Для тех, кто любит чуть больше уюта.', 5200.00, 3, '/images/comfort-3p.png', true),
  ('VIP (2 гостя)', 'Просторный номер повышенного комфорта: большая кровать, стильный интерьер и зона отдыха.', 8900.00, 2, '/images/vip-2p.png', false)
) AS v(title, description, price, capacity, image_url, is_popular)
WHERE NOT EXISTS (SELECT 1 FROM rooms LIMIT 1);

-- Admin user: run `npm run seed` after schema (creates admin@hotel.com / admin123)
