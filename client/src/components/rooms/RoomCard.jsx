import { Link } from 'react-router-dom';

export default function RoomCard({ room }) {
  return (
    <article className="room-card">
      <div className="room-card__image">
        <img src={room.imageUrl || '/placeholder-room.jpg'} alt={room.title} loading="lazy" />
      </div>
      <div className="room-card__body">
        <h3>{room.title}</h3>
        <p className="room-card__meta">
          до {room.capacity} гостей · <strong>{formatPrice(room.price)} ₽</strong> / ночь
        </p>
        <p className="room-card__desc">{room.description.slice(0, 100)}…</p>
        <div className="room-card__actions">
          <Link to={`/rooms/${room.id}`} className="btn btn--primary">
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  );
}

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return new Intl.NumberFormat('ru-RU').format(n);
}
