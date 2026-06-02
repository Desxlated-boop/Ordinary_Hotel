import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BookingForm({ roomId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState(user?.fullName || '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      navigate('/login', { state: { from: `/rooms/${roomId}` } });
      return;
    }

    setSubmitting(true);
    try {
      await api.createBooking({ roomId, guestName, checkIn, checkOut });
      setSuccess('Бронирование создано!');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <h3>Забронировать</h3>
      {!user && <p className="booking-form__hint">Для бронирования нужно войти в аккаунт.</p>}
      <label>
        Имя гостя
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
          placeholder="Иван Иванов"
        />
      </label>
      <label>
        Дата заезда
        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
      </label>
      <label>
        Дата выезда
        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
      </label>
      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Отправка…' : 'Забронировать'}
      </button>
    </form>
  );
}
