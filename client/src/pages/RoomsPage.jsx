import { useEffect, useState } from 'react';
import { api } from '../services/api';
import RoomList from '../components/rooms/RoomList';
import Loader from '../components/common/Loader';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getRooms()
      .then(({ data }) => setRooms(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Наши номера</h1>
        <p className="page-subtitle">Выберите номер и перейдите к бронированию</p>
        {loading && <Loader />}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && <RoomList rooms={rooms} />}
      </div>
    </section>
  );
}
