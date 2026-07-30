import type { ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { useSelector } from "react-redux";

import DashboardLayout from "./layouts/DashboardLayout";

import LoginPage from "./pages/auth/LoginPage";

import TeachersPage from "./pages/admin/TeachersPage";
import StudentsPage from "./pages/admin/StudentsPage";
import ClassesPage from "./pages/admin/ClassesPage";

import AdminDashboard from "./pages/dashboards/AdminDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import StudentDashboard from "./pages/dashboards/StudentDashboard";

import {
  selectAuthLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserRole,
  type UserRole,
} from "./store/slices/authSlice";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectUserRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) {
    return <div>Đang kiểm tra đăng nhập...</div>;
  }

  if (!isAuthenticated || !user || !role) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/auth/login" replace />}
        />

        <Route
          path="/auth/login"
          element={<LoginPage />}
        />

        <Route element={<DashboardLayout />}>
          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <TeachersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StudentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ClassesPage />
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/auth/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;