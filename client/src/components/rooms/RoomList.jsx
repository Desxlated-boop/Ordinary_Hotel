import RoomCard from './RoomCard';

export default function RoomList({ rooms }) {
  if (!rooms.length) {
    return <p className="muted">Номера пока не добавлены.</p>;
  }

  return (
    <div className="room-grid">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
