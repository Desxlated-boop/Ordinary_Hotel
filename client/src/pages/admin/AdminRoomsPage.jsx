import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import RoomForm from '../../components/admin/RoomForm';
import Loader from '../../components/common/Loader';

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.adminGetRooms();
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleCreate = async (body) => {
    setSubmitting(true);
    setError('');
    try {
      await api.adminCreateRoom(body);
      await loadRooms();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (body) => {
    setSubmitting(true);
    setError('');
    try {
      await api.adminUpdateRoom(editing.id, body);
      setEditing(null);
      await loadRooms();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить номер?')) return;
    setError('');
    try {
      await api.adminDeleteRoom(id);
      await loadRooms();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="section admin-page">
      <div className="container">
        <h1 className="page-title">Админ: номера</h1>
        {error && <p className="error-text">{error}</p>}

        <div className="admin-page__single-form">
          <RoomForm onSubmit={handleCreate} submitting={submitting} />
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="admin-list">
            {rooms.map((room) => {
              const isEditing = editing?.id === room.id;
              return (
                <div key={room.id} className="admin-room">
                  <article className="admin-list__item">
                    <div>
                      <h3>{room.title}</h3>
                      <p className="muted">
                        {formatPrice(room.price)} ₽ · {room.capacity} гостей ·{' '}
                        {room.isPopular ? 'популярный' : 'обычный'}
                      </p>
                    </div>
                    <div className="admin-list__actions">
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => setEditing(isEditing ? null : room)}
                      >
                        {isEditing ? 'Свернуть' : 'Изменить'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => handleDelete(room.id)}
                        disabled={submitting}
                      >
                        Удалить
                      </button>
                    </div>
                  </article>

                  {isEditing && (
                    <div className="admin-room__edit">
                      <RoomForm
                        initial={{
                          title: editing.title,
                          description: editing.description,
                          price: editing.price,
                          capacity: editing.capacity,
                          imageUrl: editing.imageUrl || '',
                          isPopular: editing.isPopular,
                        }}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditing(null)}
                        submitting={submitting}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return new Intl.NumberFormat('ru-RU').format(n);
}
