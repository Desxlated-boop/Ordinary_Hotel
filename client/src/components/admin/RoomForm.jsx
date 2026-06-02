import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

const emptyRoom = {
  title: '',
  description: '',
  price: '',
  capacity: '',
  imageUrl: '',
  isPopular: false,
};

export default function RoomForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initial || emptyRoom);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    setForm(initial || emptyRoom);
  }, [initial]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      capacity: Number(form.capacity),
      imageUrl: form.imageUrl || null,
      isPopular: Boolean(form.isPopular),
    });
  };

  const pickFile = () => {
    setUploadError('');
    fileRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    try {
      const { data } = await api.adminUploadRoomImage(file);
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3>{initial ? 'Редактировать номер' : 'Новый номер'}</h3>
      <label>
        Название
        <input name="title" value={form.title} onChange={handleChange} required />
      </label>
      <label>
        Описание
        <textarea name="description" value={form.description} onChange={handleChange} required rows={4} />
      </label>
      <label>
        Цена
        <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
      </label>
      <label>
        Вместимость
        <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} required />
      </label>
      <label>
        URL фото
        <input name="imageUrl" value={form.imageUrl} onChange={handleChange} />
      </label>
      <div className="admin-form__upload">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileChange}
          hidden
        />
        <button type="button" className="btn btn--ghost btn--sm" onClick={pickFile} disabled={uploading}>
          {uploading ? 'Загрузка…' : 'Загрузить фото'}
        </button>
        <span className="muted admin-form__upload-hint">
          Файл будет доступен по URL вида <code>/uploads/...</code>
        </span>
        {uploadError && <p className="error-text">{uploadError}</p>}
      </div>
      <label className="checkbox-label">
        <input name="isPopular" type="checkbox" checked={form.isPopular} onChange={handleChange} />
        Популярный номер
      </label>
      <div className="admin-form__actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Сохранение…' : 'Сохранить'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
