import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BookingForm({ room }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roomId = room?.id;
  const capacity = room?.capacity || 1;
  const pricePerPerson = room ? Math.round(room.price / room.capacity) : 0;

  const [guestName, setGuestName] = useState(user?.fullName || '');
  const [passport, setPassport] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [expectedTotal, setExpectedTotal] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recalculate dynamic expected price
  useEffect(() => {
    if (checkIn && checkOut && pricePerPerson) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = end - start;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (days > 0) {
        setExpectedTotal(days * pricePerPerson * guestCount);
      } else {
        setExpectedTotal(0);
      }
    } else {
      setExpectedTotal(0);
    }
  }, [checkIn, checkOut, guestCount, pricePerPerson]);

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
      await api.createBooking({
        roomId,
        guestName,
        checkIn,
        checkOut,
        passport: passport.trim() || null,
        originCity: originCity.trim() || null,
        guestCount: Number(guestCount)
      });
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
      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '-0.3rem', marginBottom: '1rem' }}>
        Стоимость места: <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{pricePerPerson} ₽</span> / человека в сутки
      </p>

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
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '0.5rem 0' }}>
        <label style={{ margin: 0 }}>
          Паспортные данные
          <input
            value={passport}
            onChange={(e) => setPassport(e.target.value)}
            placeholder="1234 567890"
            required
          />
        </label>
        <label style={{ margin: 0 }}>
          Откуда прибыли (город)
          <input
            value={originCity}
            onChange={(e) => setOriginCity(e.target.value)}
            placeholder="Москва"
            required
          />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '0.5rem 0' }}>
        <label style={{ margin: 0 }}>
          Дата заезда
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
        </label>
        <label style={{ margin: 0 }}>
          Дата выезда
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
        </label>
      </div>

      <label style={{ marginTop: '0.5rem' }}>
        Количество человек в номере
        <select
          value={guestCount}
          onChange={(e) => setGuestCount(Number(e.target.value))}
          style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', fontSize: '0.95rem' }}
          required
        >
          {Array.from({ length: capacity }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'человек' : n < 5 ? 'человека' : 'человек'}
            </option>
          ))}
        </select>
      </label>

      {expectedTotal > 0 && (
        <div style={{ background: '#f0f9eb', border: '1px solid #c2e7b0', padding: '0.75rem', borderRadius: '6px', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#60c040', fontWeight: 'bold' }}>Предварительный расчёт стоимости:</span>
          <span style={{ fontSize: '1.25rem', color: '#13ce66', fontWeight: 'bold' }}>
            {new Intl.NumberFormat('ru-RU').format(expectedTotal)} ₽
          </span>
          <span style={{ fontSize: '0.75rem', color: '#7a8b9a' }}>
            За проживание {guestCount} {guestCount === 1 ? 'гостя' : 'гостей'} на весь указанный период
          </span>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}
      <button type="submit" className="btn btn--primary" style={{ marginTop: '0.75rem' }} disabled={submitting}>
        {submitting ? 'Отправка…' : 'Забронировать'}
      </button>
    </form>
  );
}
