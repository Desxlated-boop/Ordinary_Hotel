require('dotenv').config({ override: true });
const { query } = require('../src/db/pool');

const rooms = [
  {
    id: 1,
    title: 'Эконом (1 гость)',
    description:
      'Уютный одноместный номер для коротких поездок: удобная кровать, рабочая зона и базовые удобства.',
    price: 2500,
    capacity: 1,
    imageUrl: '/images/econom-1p.png',
    isPopular: true,
  },
  {
    id: 2,
    title: 'Стандарт (3 гостя)',
    description:
      'Светлый номер с тремя отдельными кроватями. Подходит для компании или семьи с детьми.',
    price: 4200,
    capacity: 3,
    imageUrl: '/images/standard-3p.png',
    isPopular: true,
  },
  {
    id: 3,
    title: 'Комфорт (до 3 гостей)',
    description:
      'Улучшенный номер с двуспальной кроватью и мягким освещением. Для тех, кто любит чуть больше уюта.',
    price: 5200,
    capacity: 3,
    imageUrl: '/images/comfort-3p.png',
    isPopular: true,
  },
  {
    id: 4,
    title: 'VIP (2 гостя)',
    description:
      'Просторный номер повышенного комфорта: большая кровать, стильный интерьер и зона отдыха.',
    price: 8900,
    capacity: 2,
    imageUrl: '/images/vip-2p.png',
    isPopular: false,
  },
];

async function main() {
  for (const r of rooms) {
    await query(
      `UPDATE rooms SET
        title = $1,
        description = $2,
        price = $3,
        capacity = $4,
        image_url = $5,
        is_popular = $6,
        updated_at = NOW()
      WHERE id = $7`,
      [r.title, r.description, r.price, r.capacity, r.imageUrl, r.isPopular, r.id]
    );
  }

  const result = await query('SELECT id, title, image_url FROM rooms ORDER BY id ASC LIMIT 4');
  console.log('Updated rooms:', result.rows);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

