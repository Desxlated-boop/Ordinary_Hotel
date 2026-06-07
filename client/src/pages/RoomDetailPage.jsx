import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import BookingForm from '../components/booking/BookingForm';
import Loader from '../components/common/Loader';

export default function RoomDetailPage() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getRoom(id)
      .then(({ data }) => setRoom(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (error) return <p className="error-text container">{error}</p>;
  if (!room) return null;

  return (
    <section className="section room-detail">
      <div className="container room-detail__grid">
        <div className="room-detail__media">
          <img src={room.imageUrl} alt={room.title} />
        </div>
        <div className="room-detail__info">
          <h1>{room.title}</h1>
          <p className="room-detail__price">{formatPrice(room.price)} ₽ / ночь</p>
          <p className="room-detail__price-per-person" style={{ fontSize: '1.1rem', color: '#27ae60', fontWeight: 'bold', marginBottom: '1rem' }}>
            Цена за одного человека: {formatPrice(Math.round(room.price / room.capacity))} ₽ / ночь
          </p>
          <p className="room-detail__capacity">Вместимость: до {room.capacity} гостей</p>
          <p className="room-detail__description">{room.description}</p>
        </div>
        <aside className="room-detail__aside">
          <BookingForm room={room} />
        </aside>
      </div>
    </section>
  );
}

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return new Intl.NumberFormat('ru-RU').format(n);
}
