import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const DAYS_OF_WEEK = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
];

export default function AdminReportsPage() {
  // Staff list & form state
  const [employees, setEmployees] = useState([]);
  const [newFullName, setNewFullName] = useState('');
  const [newFloors, setNewFloors] = useState('');
  const [newDays, setNewDays] = useState([]);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  // General metrics
  const [statsDate, setStatsDate] = useState('2026-06-07');
  const [stats, setStats] = useState({
    freeRooms: 0,
    freeBeds: 0,
    totalBeds: 0,
    totalPaid: 0,
    singleRoomClients: []
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [singleSearch, setSingleSearch] = useState('');

  // All rooms (needed for Query 1)
  const [rooms, setRooms] = useState([]);

  // Query 1 state: Стоимость места для этажа и номера
  const [q1Floor, setQ1Floor] = useState('1');
  const [q1RoomId, setQ1RoomId] = useState('');
  const [q1Result, setQ1Result] = useState(null);
  const [q1Error, setQ1Error] = useState('');

  // Query 2 state: Список клиентов из города
  const [q2City, setQ2City] = useState('');
  const [q2Result, setQ2Result] = useState([]);
  const [q2Loading, setQ2Loading] = useState(false);

  // Query 3 state: Служащие, убирающие номер клиента в день недели
  const [q3ClientName, setQ3ClientName] = useState('');
  const [q3Day, setQ3Day] = useState('Понедельник');
  const [q3Result, setQ3Result] = useState(null);
  const [q3Loading, setQ3Loading] = useState(false);

  // Load staff & stats
  useEffect(() => {
    fetchStaff();
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchStats(statsDate);
  }, [statsDate]);

  const fetchStaff = async () => {
    try {
      const res = await api.adminGetEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Ошибка загрузки сотрудников:', err.message);
    }
  };

  const fetchStats = async (dateVal = '') => {
    setStatsLoading(true);
    try {
      const res = await api.adminGetAssignmentStats(dateVal);
      setStats(res.data || {
        freeRooms: 0,
        freeBeds: 0,
        totalBeds: 0,
        totalPaid: 0,
        singleRoomClients: []
      });
    } catch (err) {
      console.error('Ошибка загрузки статистики отчетности:', err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.adminGetRooms();
      setRooms(res.data || []);
      if (res.data && res.data.length > 0) {
        setQ1RoomId(res.data[0].id);
      }
    } catch (err) {
      console.error('Ошибка загрузки номеров:', err.message);
    }
  };

  // Hire employee
  const handleHire = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');
    if (!newFullName.trim()) {
      setStaffError('ФИО сотрудника обязательно');
      return;
    }
    if (!newFloors.trim()) {
      setStaffError('Укажите хотя бы один этаж уборки');
      return;
    }
    if (newDays.length === 0) {
      setStaffError('Выберите хотя бы один день недели для работы');
      return;
    }

    const floorsArray = newFloors.split(',').map(item => parseInt(item.trim(), 10)).filter(n => !isNaN(n));
    if (floorsArray.length === 0) {
      setStaffError('Введены некорректные этажи');
      return;
    }

    setStaffLoading(true);
    try {
      await api.adminHireEmployee({
        fullName: newFullName.trim(),
        floors: floorsArray,
        daysOfWeek: newDays
      });
      setStaffSuccess('Сотрудник успешно принят на работу!');
      setNewFullName('');
      setNewFloors('');
      setNewDays([]);
      fetchStaff();
    } catch (err) {
      setStaffError(err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  // Fire employee
  const handleFire = async (id) => {
    if (!window.confirm('Вы действительно хотите уволить этого сотрудника?')) return;
    try {
      await api.adminFireEmployee(id);
      fetchStaff();
    } catch (err) {
      alert(`Не удалось уволить сотрудника: ${err.message}`);
    }
  };

  // Toggle Day selection
  const handleToggleDay = (day) => {
    if (newDays.includes(day)) {
      setNewDays(prev => prev.filter(d => d !== day));
    } else {
      setNewDays(prev => [...prev, day]);
    }
  };

  // Run Query 1: Стоимость места для заданного этажа и номера
  const handleQuery1 = async (e) => {
    e.preventDefault();
    setQ1Error('');
    setQ1Result(null);

    if (!q1Floor || !q1RoomId) {
      setQ1Error('Введите этаж и выберите номер');
      return;
    }

    try {
      const res = await api.adminGetAssignmentQuery1(parseInt(q1Floor, 10), q1RoomId);
      setQ1Result(res.data);
    } catch (err) {
      setQ1Error(err.message);
    }
  };

  // Run Query 2: Список клиентов по городу
  const handleQuery2 = async (e) => {
    e.preventDefault();
    if (!q2City.trim()) return;
    setQ2Loading(true);
    try {
      const res = await api.adminGetAssignmentQuery2(q2City.trim());
      setQ2Result(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setQ2Loading(false);
    }
  };

  // Run Query 3: Кто убирал номер клиента по дню недели
  const handleQuery3 = async (e) => {
    e.preventDefault();
    if (!q3ClientName.trim()) return;
    setQ3Loading(true);
    setQ3Result(null);
    try {
      const res = await api.adminGetAssignmentQuery3(q3ClientName.trim(), q3Day);
      setQ3Result(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setQ3Loading(false);
    }
  };

  const filteredSingleRoomClients = (stats.singleRoomClients || []).filter(c => {
    const search = singleSearch.toLowerCase();
    return (
      (c.guestName || '').toLowerCase().includes(search) ||
      (c.roomTitle || '').toLowerCase().includes(search) ||
      (c.originCity || '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontWeight: 700, color: '#fff' }}>Отчетность & управление</h1>
        <p style={{ color: '#aaa' }}>
          Панель отчетов, поиска проживающих и управления сотрудниками.
        </p>
      </div>

      {/* Grid: Stats and Employee Management */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* Left Side: Live statistics and single rooms list */}
        <section style={{ background: '#0f1a34', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', borderRadius: '12px', color: '#edf3ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#edf3ff', margin: 0 }}>Показатели гостиницы</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#9fb0d1' }}>на дату:</span>
              <input
                type="date"
                value={statsDate}
                onChange={(e) => setStatsDate(e.target.value)}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '0.85rem',
                  color: '#edf3ff',
                  background: '#162449',
                  outline: 'none'
                }}
              />
            </div>
          </div>
          
          {statsLoading ? (
            <p style={{ color: '#9fb0d1' }}>Загрузка показателей…</p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#162449', padding: '1rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#9fb0d1', fontWeight: '500' }}>Свободные номера</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#edf3ff' }}>{stats.freeRooms}</div>
                </div>
                <div style={{ background: '#162449', padding: '1rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#9fb0d1', fontWeight: '500' }}>Свободные места</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#4caf82' }}>
                    {stats.freeBeds} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#9fb0d1' }}>из {stats.totalBeds}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(76, 175, 130, 0.1)', borderLeft: '4px solid #4caf82', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#4caf82', fontWeight: 'bold' }}>Общая сумма оплат от всех клиентов</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#edf3ff' }}>
                  {stats.totalPaid.toLocaleString('ru-RU')} ₽
                </div>
              </div>

              {/* Single Room Clients List */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#edf3ff' }}>
                  Клиенты в одноместных номерах ({filteredSingleRoomClients.length})
                </h3>
                
                <input
                  type="text"
                  placeholder="Поиск клиентов в одноместных номерах…"
                  value={singleSearch}
                  onChange={(e) => setSingleSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    marginBottom: '0.75rem',
                    fontSize: '0.85rem',
                    color: '#edf3ff',
                    background: '#162449'
                  }}
                />

                {filteredSingleRoomClients.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: '#9fb0d1', fontStyle: 'italic' }}>На данный момент клиентов не найдено.</p>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px' }}>
                     <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#162449', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <th style={{ padding: '0.5rem', color: '#9fb0d1', fontWeight: '600' }}>ФИО</th>
                          <th style={{ padding: '0.5rem', color: '#9fb0d1', fontWeight: '600' }}>Номер</th>
                          <th style={{ padding: '0.5rem', color: '#9fb0d1', fontWeight: '600' }}>Город</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSingleRoomClients.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '0.5rem', color: '#edf3ff' }}>{c.guestName}</td>
                            <td style={{ padding: '0.5rem', color: '#edf3ff' }}>{c.roomTitle}</td>
                            <td style={{ padding: '0.5rem', color: '#9fb0d1' }}>{c.originCity || 'Не указан'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Side: Employee Records & Hiring */}
        <section style={{ background: '#0f1a34', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', borderRadius: '12px', color: '#edf3ff' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600, color: '#edf3ff' }}>Прием и увольнение служащих</h2>
          
          {/* Hire Form */}
          <form onSubmit={handleHire} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#edf3ff' }}>Новый сотрудник</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="ФИО сотрудника"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#edf3ff', background: '#162449' }}
                required
              />
              <input
                type="text"
                placeholder="Номера этажей"
                value={newFloors}
                onChange={(e) => setNewFloors(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#edf3ff', background: '#162449' }}
                required
              />
            </div>

            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#9fb0d1' }}>Дни недели работы:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {DAYS_OF_WEEK.map(day => {
                  const active = newDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: active ? '#2f63ff' : 'rgba(255, 255, 255, 0.15)',
                        background: active ? '#2f63ff' : '#162449',
                        color: active ? '#fff' : '#edf3ff',
                        cursor: 'pointer'
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {staffError && <p style={{ color: '#e05c5c', fontSize: '0.85rem' }}>{staffError}</p>}
            {staffSuccess && <p style={{ color: '#4caf82', fontSize: '0.85rem' }}>{staffSuccess}</p>}

            <button type="submit" disabled={staffLoading} className="btn btn--primary btn--sm" style={{ alignSelf: 'flex-start' }}>
              {staffLoading ? 'Приём…' : 'Принять на работу'}
            </button>
          </form>

          {/* Employee list */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#edf3ff' }}>Штат служащих гостиницы</h3>
            {employees.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: '#9fb0d1' }}>Нет зарегистрированных служащих.</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {employees.map(emp => (
                  <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#edf3ff' }}>{emp.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9fb0d1' }}>
                        Этажи: {emp.floors?.join(', ')} | Дни: {emp.daysOfWeek?.join(', ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      style={{ color: '#e05c5c' }}
                      onClick={() => handleFire(emp.id)}
                    >
                      Уволить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Reports and LINQ equivalents sections */}
      <section style={{ background: '#0f1a34', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', borderRadius: '12px', color: '#edf3ff' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.5rem', color: '#edf3ff' }}>
          Интерактивные поисковые запросы
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Query 1: Cost of bed for floor and room_id */}
          <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', background: '#162449', padding: '1.25rem', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#edf3ff', marginBottom: '0.75rem' }}>
              Расчёт стоимости за место
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#9fb0d1', marginBottom: '1rem' }}>
              Вычисляет цену за проживание на одном спальном месте для заданного этажа и номера.
            </p>
            <form onSubmit={handleQuery1} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Этаж (н-р: 1, 2, 3)"
                  value={q1Floor}
                  onChange={(e) => setQ1Floor(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', fontSize: '0.85rem', color: '#edf3ff', background: '#0f1a34' }}
                  required
                />
                <select
                  value={q1RoomId}
                  onChange={(e) => setQ1RoomId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: '#edf3ff',
                    background: '#0f1a34',
                    maxWidth: '100%',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                  required
                >
                  <option value="" style={{ background: '#0f1a34', color: '#edf3ff' }}>Выберите комнату</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id} style={{ background: '#0f1a34', color: '#edf3ff' }}>{r.title} (Эт. {r.floor || 1})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn--primary btn--sm">Рассчитать</button>
            </form>

            {q1Error && <p style={{ color: '#e05c5c', fontSize: '0.8rem', marginTop: '0.5rem' }}>{q1Error}</p>}
            {q1Result && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#0f1a34', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', fontSize: '0.85rem', color: '#edf3ff' }}>
                {q1Result.found ? (
                  <>
                    <strong style={{ color: '#edf3ff' }}>{q1Result.title}</strong><br />
                    Базовая цена номера: {q1Result.price} ₽<br />
                    Количество мест: {q1Result.capacity} мест<br />
                    <span style={{ color: '#4caf82', fontWeight: 'bold' }}>
                      Стоимость за место: {q1Result.placeCost} ₽ в сутки
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#e05c5c' }}>Комната с указанным этажом не найдена в системе.</span>
                )}
              </div>
            )}
          </div>

          {/* Query 2: Clients from a given city */}
          <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', background: '#162449', padding: '1.25rem', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#edf3ff', marginBottom: '0.75rem' }}>
              Список клиентов по городу
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#9fb0d1', marginBottom: '1rem' }}>
              Показывает список всех клиентов, зарегистрированных из определенного города.
            </p>
            <form onSubmit={handleQuery2} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                placeholder="Город (напр: Москва)"
                value={q2City}
                onChange={(e) => setQ2City(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', fontSize: '0.85rem', color: '#edf3ff', background: '#0f1a34' }}
                required
              />
              <button type="submit" className="btn btn--primary btn--sm" disabled={q2Loading}>Поиск</button>
            </form>

            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {q2Result.length > 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#edf3ff' }}>
                  {q2Result.map(c => (
                    <div key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#edf3ff' }}>{c.guestName}</strong> ({c.passport || 'Паспорт не указан'})<br />
                      Номер: {c.roomTitle} | Место: {c.bedNumber || 'не указ.'}<br />
                      Период: {c.checkIn} - {c.checkOut}
                    </div>
                  ))}
                </div>
              ) : q2City ? (
                <p style={{ fontSize: '0.8rem', color: '#9fb0d1', fontStyle: 'italic' }}>Клиентов из данного города не найдено.</p>
              ) : null}
            </div>
          </div>

          {/* Query 3: Staff who cleaned a room of client on a day */}
          <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', background: '#162449', padding: '1.25rem', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#edf3ff', marginBottom: '0.75rem' }}>
              Кто убирал комнату клиента
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#9fb0d1', marginBottom: '1rem' }}>
              Находит, какой сотрудник убирал комнату указанного клиента в выбранный день недели.
            </p>
            <form onSubmit={handleQuery3} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="ФИО клиента"
                  value={q3ClientName}
                  onChange={(e) => setQ3ClientName(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', fontSize: '0.85rem', color: '#edf3ff', background: '#0f1a34' }}
                  required
                />
                <select
                  value={q3Day}
                  onChange={(e) => setQ3Day(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', fontSize: '0.85rem', color: '#edf3ff', background: '#0f1a34' }}
                  required
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d} style={{ background: '#0f1a34', color: '#edf3ff' }}>{d}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn--primary btn--sm" disabled={q3Loading}>Найти</button>
            </form>

            {q3Result && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#0f1a34', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', fontSize: '0.85rem', color: '#edf3ff' }}>
                {q3Result.foundClient ? (
                  <>
                    <div style={{ marginBottom: '0.5rem', color: '#9fb0d1', fontSize: '0.8rem' }}>
                      Комнаты клиента: <strong>{q3Result.roomsMatched?.join(', ')}</strong> (Этаж: {q3Result.floorsMatched?.join(', ')})
                    </div>
                    {q3Result.employees.length === 0 ? (
                      <span style={{ color: '#d97706', fontWeight: '500' }}>В этот день недели на этом этаже никто из сотрудников не убирался.</span>
                    ) : (
                      <div>
                        <strong style={{ color: '#4caf82' }}>Ответственные уборщики ({q3Result.employees.length}):</strong>
                        {q3Result.employees.map(e => (
                          <div key={e.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '0.25rem', paddingTop: '0.25rem', color: '#edf3ff' }}>
                            • {e.fullName} (убираемые этажи: {e.floors?.join(', ')})
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ color: '#e05c5c' }}>Активного клиента с таким ФИО не найдено в гостинице.</span>
                )}
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
