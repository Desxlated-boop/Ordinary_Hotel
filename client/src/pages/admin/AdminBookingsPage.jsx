import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loader from '../../components/common/Loader';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.adminGetBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancelBooking = async (id) => {
    if (!window.confirm('Отменить бронирование?')) return;
    setBusyId(id);
    setError('');
    try {
      await api.adminCancelBooking(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmBooking = async (id) => {
    if (!window.confirm('Восстановить бронирование?')) return;
    setBusyId(id);
    setError('');
    try {
      await api.adminConfirmBooking(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleUserBlock = async (userId, isBlocked) => {
    const action = isBlocked ? 'Разблокировать' : 'Заблокировать';
    if (!window.confirm(`${action} пользователя?`)) return;
    setBusyId(`u:${userId}`);
    try {
      if (isBlocked) {
        await api.adminUnblockUser(userId);
      } else {
        await api.adminBlockUser(userId);
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="section admin-page">
      <div className="container">
        <h1 className="page-title">Админ: все бронирования</h1>
        {loading && <Loader />}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <div className="bookings-table-wrap">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пользователь</th>
                  <th>Номер</th>
                  <th>Гость</th>
                  <th>Заезд</th>
                  <th>Выезд</th>
                  <th>Статус</th>
                  <th>Доступ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.userEmail}</td>
                    <td>{b.roomTitle}</td>
                    <td>{b.guestName}</td>
                    <td>{formatDate(b.checkIn)}</td>
                    <td>{formatDate(b.checkOut)}</td>
                    <td>{translateStatus(b.status)}</td>
                    <td>{b.userBlocked ? 'заблокирован' : 'активен'}</td>
                    <td className="table-actions">
                      {b.status === 'confirmed' ? (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => cancelBooking(b.id)}
                          disabled={busyId === b.id}
                        >
                          {busyId === b.id ? 'Отмена…' : 'Отменить'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => confirmBooking(b.id)}
                          disabled={busyId === b.id || b.userBlocked}
                          title={b.userBlocked ? 'Пользователь заблокирован' : ''}
                        >
                          {busyId === b.id ? 'Подтверждение…' : 'Подтвердить'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => toggleUserBlock(b.userId, b.userBlocked)}
                        disabled={busyId === `u:${b.userId}`}
                      >
                        {busyId === `u:${b.userId}`
                          ? '…'
                          : b.userBlocked
                            ? 'Разблокировать'
                            : 'Блокировать'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
