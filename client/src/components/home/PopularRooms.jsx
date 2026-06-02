import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import RoomList from '../rooms/RoomList';
import Loader from '../common/Loader';

export default function PopularRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getRooms('?popular=true')
      .then(({ data }) => setRooms(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <section className="section">
      <div className="container">
        <h2 className="section__title">Популярные номера</h2>
        <RoomList rooms={rooms} />
      </div>
    </section>
  );
}
