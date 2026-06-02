import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import HomePage from '../pages/HomePage';
import RoomsPage from '../pages/RoomsPage';
import RoomDetailPage from '../pages/RoomDetailPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import AdminRoomsPage from '../pages/admin/AdminRoomsPage';
import AdminBookingsPage from '../pages/admin/AdminBookingsPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="rooms/:id" element={<RoomDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/rooms"
          element={
            <ProtectedRoute adminOnly>
              <AdminRoomsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/bookings"
          element={
            <ProtectedRoute adminOnly>
              <AdminBookingsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
