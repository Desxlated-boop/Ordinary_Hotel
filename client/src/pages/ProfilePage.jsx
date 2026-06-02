import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMyBookings()
      .then(({ data }) => setBookings(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Личный кабинет</h1>
        <p className="page-subtitle">
          {user?.fullName} · {user?.email}
        </p>
        {loading && <Loader />}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <div className="bookings-table-wrap">
            {bookings.length === 0 ? (
              <p className="muted">У вас пока нет бронирований.</p>
            ) : (
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Гость</th>
                    <th>Заезд</th>
                    <th>Выезд</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.roomTitle}</td>
                      <td>{b.guestName}</td>
                      <td>{formatDate(b.checkIn)}</td>
                      <td>{formatDate(b.checkOut)}</td>
                      <td>{translateStatus(b.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ru-RU');
}

function translateStatus(status) {
  switch (status) {
    case 'confirmed':
      return 'подтверждено';
    case 'cancelled':
      return 'отменено';
    default:
      return status;
  }
}
