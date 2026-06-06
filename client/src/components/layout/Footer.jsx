export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>© {new Date().getFullYear()} Ordinary Hotel. Все права защищены.</p>
        <p className="footer__muted">Hotel Booking System — учебный проект</p>
      </div>
    </footer>
  );
}
