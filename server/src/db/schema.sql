-- Hotel Booking System schema

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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
  floor       INT NOT NULL DEFAULT 1 CHECK (floor > 0),
  room_type   VARCHAR(50) NOT NULL DEFAULT 'одноместный' CHECK (room_type IN ('одноместный', 'двухместный', 'трехместный')),
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
  passport    VARCHAR(50),
  origin_city VARCHAR(120),
  bed_number  INT,
  guest_count INT NOT NULL DEFAULT 1 CHECK (guest_count > 0),
  status      VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (check_out > check_in)
);

CREATE TABLE IF NOT EXISTS employees (
  id           SERIAL PRIMARY KEY,
  full_name    VARCHAR(120) NOT NULL,
  floors       INT[] NOT NULL,
  days_of_week VARCHAR[] NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_rooms_popular ON rooms(is_popular) WHERE is_popular = true;

-- Seed rooms (idempotent: only if empty)
INSERT INTO rooms (title, description, price, capacity, floor, room_type, image_url, is_popular)
SELECT * FROM (VALUES
  ('Эконом (1 гость)', 'Уютный одноместный номер для коротких поездок: удобная кровать, рабочая зона и базовые удобства.', 2500.00, 1, 1, 'одноместный', '/images/econom-1p.png', true),
  ('Стандарт (3 гостя)', 'Светлый номер с тремя отдельными кроватями. Подходит для компании или семьи с детьми.', 4200.00, 3, 3, 'трехместный', '/images/standard-3p.png', true),
  ('Комфорт (до 3 гостей)', 'Улучшенный номер с двуспальной кроватью и мягким освещением. Для тех, кто любит чуть больше уюта.', 5200.00, 3, 2, 'трехместный', '/images/comfort-3p.png', true),
  ('VIP (2 гостя)', 'Просторный номер повышенного комфорта: большая кровать, стильный интерьер и зона отдыха.', 8900.00, 2, 2, 'двухместный', '/images/vip-2p.png', false)
) AS v(title, description, price, capacity, floor, room_type, image_url, is_popular)
WHERE NOT EXISTS (SELECT 1 FROM rooms LIMIT 1);

-- Seed employees (idempotent: only if empty)
INSERT INTO employees (full_name, floors, days_of_week)
SELECT * FROM (VALUES
  ('Елена Летучая', ARRAY[1, 2], ARRAY['Понедельник', 'Среда']),
  ('Петр Иванов', ARRAY[2, 3], ARRAY['Вторник', 'Четверг']),
  ('Мария Сидорова', ARRAY[1, 3], ARRAY['Пятница', 'Суббота'])
) AS v(full_name, floors, days_of_week)
WHERE NOT EXISTS (SELECT 1 FROM employees LIMIT 1);

-- Admin user: run `npm run seed` after schema (creates admin@hotel.com / admin123)
