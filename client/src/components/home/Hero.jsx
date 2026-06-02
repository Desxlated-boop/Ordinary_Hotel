import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__content">
        <span className="hero__badge">Добро пожаловать</span>
        <h1>Отдых начинается с правильного номера</h1>
        <p>
          Уютные номера, удобное бронирование и персональный сервис. Выберите даты заезда и
          выезда — остальное мы возьмём на себя.
        </p>
        <Link to="/rooms" className="btn btn--primary btn--lg">
          Смотреть номера
        </Link>
      </div>
    </section>
  );
}
