import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";

import DashboardLayout from "./layouts/DashboardLayout";

import LoginPage from "./pages/auth/LoginPage";

import TeachersPage from "./pages/admin/TeachersPage";
import StudentsPage from "./pages/admin/StudentsPage";
import ClassesPage from "./pages/admin/ClassesPage";
import AdminMaterialsPage from "./pages/admin/materials/AdminMaterialsPage";
import AdminDailySchedulePage from "./pages/admin/AdminDailySchedulePage";

import TeacherClassesPage from "./pages/teacher/TeacherClassesPage";
import TeacherSchedulePage from "./pages/teacher/TeacherSchedulePage";
import TeacherAttendancePage from "./pages/teacher/TeacherAttendancePage";
import TeacherAttendanceDetailPage from "./pages/teacher/TeacherAttendanceDetailPage";
import TeacherAssignmentsPage from "./pages/teacher/TeacherAssignmentsPage";
import TeacherAssignmentDetailPage from "./pages/teacher/TeacherAssignmentDetailPage";
import TeacherMaterialsPage from "./pages/teacher/TeacherMaterialsPage";
import TeacherMaterialDetailPage from "./pages/teacher/materials/TeacherMaterialDetailPage";
import TeacherAssignmentSubmissionsPage from "./pages/teacher/TeacherAssignmentSubmissionsPage";

import AdminDashboard from "./pages/dashboards/AdminDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import StudentClassesPage from "./pages/student/StudentClassesPage";
import StudentClassDetailPage from "./pages/student/StudentClassDetailPage";
import StudentAssignmentsPage from "./pages/student/StudentAssignmentsPage";
import StudentAssignmentDetailPage from "./pages/student/StudentAssignmentDetailPage";

import StudentAttendanceReportPage from "./pages/attendance/StudentAttendanceReportPage";
import ClassAttendanceReportPage from "./pages/attendance/ClassAttendanceReportPage";

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

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
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
        <Route path="/" element={<Navigate to="/auth/login" replace />} />

        <Route path="/auth/login" element={<LoginPage />} />

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
          <Route
            path="/admin/schedule"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDailySchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ClassAttendanceReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/materials"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMaterialsPage />
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

          <Route
            path="/teacher/schedule"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherSchedulePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/classes"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherClassesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/assignments"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherAssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classes/:classId/assignments"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherAssignmentDetailPage />
              </ProtectedRoute>
            }
          />
            <Route
              path="/teacher/assignments/:assignmentId/submissions"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherAssignmentSubmissionsPage />
                </ProtectedRoute>
              }
            />
          <Route
            path="/teacher/classes/:classId/students/:studentId/attendance"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <StudentAttendanceReportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherAttendancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance/:classId"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherAttendanceDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/materials"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherMaterialsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/materials/:classId"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherMaterialDetailPage />
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
          <Route
            path="/student/classes"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentClassesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/classes/:classId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentClassDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classes/:classId/assignments"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classes/:classId/assignments/:assignmentId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAssignmentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classes/:classId/attendance"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAttendanceReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/reports/students/:studentId"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <StudentAttendanceReportPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
