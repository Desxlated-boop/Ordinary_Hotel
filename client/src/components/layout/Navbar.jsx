import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          Grand Hotel
        </Link>
        <nav className="navbar__nav">
          <NavLink to="/" end>
            Главная
          </NavLink>
          <NavLink to="/rooms">Номера</NavLink>
          {user ? (
            <>
              <NavLink to="/profile">Кабинет</NavLink>
              {isAdmin && (
                <>
                  <NavLink to="/admin/rooms">Админ: номера</NavLink>
                  <NavLink to="/admin/bookings">Админ: брони</NavLink>
                </>
              )}
              <button type="button" className="btn btn--ghost" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Вход</NavLink>
              <NavLink to="/register" className="btn btn--primary btn--sm navbar__register">
                Регистрация
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
