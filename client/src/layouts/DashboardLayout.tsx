import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../store";
import toast from "react-hot-toast";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";

import type { RootState } from "../store";
import { useLogoutMutation } from "../store/api/endpoints";
import { performLogout } from "../store/slices/authSlice";

type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
};

type DashboardSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navConfig: Record<string, NavItem[]> = {
  admin: [
    {
      label: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: "Lịch dạy trong ngày",
      path: "/admin/schedule",
      icon: CalendarDays,
    },

    {
      label: "Chuyên cần",
      path: "/admin/attendance",
      icon: ClipboardCheck,
    },

    {
      label: "Giáo viên",
      path: "/admin/teachers",
      icon: Users,
    },
    {
      label: "Học sinh",
      path: "/admin/students",
      icon: GraduationCap,
    },
    {
      label: "Lớp học",
      path: "/admin/classes",
      icon: BookOpen,
    },
    {
      label: "Tài liệu",
      path: "/admin/materials",
      icon: FileText,
    },
  ],

  teacher: [
    {
      label: "Dashboard",
      path: "/teacher",
      icon: LayoutDashboard,
    },
    {
      label: "Lịch dạy của tôi",
      path: "/teacher/schedule",
      icon: CalendarDays,
    },
    {
      label: "Lớp học của tôi",
      path: "/teacher/classes",
      icon: BookOpen,
    },
    {
      label: "Điểm danh",
      path: "/teacher/attendance",
      icon: ClipboardCheck,
    },
    {
      label: "Bài tập",
      path: "/teacher/assignments",
      icon: ClipboardList,
    },
    {
      label: "Tài liệu",
      path: "/teacher/materials",
      icon: FileText,
    },
    
  ],

  student: [
    {
      label: "Dashboard",
      path: "/student",
      icon: LayoutDashboard,
    },

    {
      label: "Lớp học của tôi",
      path: "/student/classes",
      icon: BookOpen,
    },
    
  ],
};

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  teacher: "Giáo viên",
  student: "Học sinh",
};

function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const user = useSelector((state: RootState) => state.auth.user);

  const role = user?.role || "student";
  const navItems = navConfig[role] || [];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 transform flex-col bg-slate-900 text-white transition-transform duration-200 ease-in-out md:static md:z-auto md:min-h-screen md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">
        <h1 className="truncate text-lg font-bold sm:text-xl">English LMS</h1>

        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onClose}
          className="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <div className="border-b border-slate-700 px-6 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {roleLabels[role]}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role}`}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="shrink-0" size={20} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default function DashboardLayout() {
  const user = useSelector((state: RootState) => state.auth.user);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Dù backend logout lỗi, frontend vẫn xóa phiên hiện tại.
    } finally {
      dispatch(performLogout());
      navigate("/auth/login", {
        replace: true,
      });
      toast.success("Đăng xuất thành công");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-green-400 bg-green-300 px-3 py-3 min-[420px]:px-4 sm:px-5 xl:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setIsSidebarOpen(true)}
              className="shrink-0 rounded-md p-2 text-slate-900 transition hover:bg-green-200 md:hidden"
            >
              <Menu size={22} />
            </button>

            <h2 className="truncate text-sm font-semibold text-slate-900 min-[420px]:text-base sm:text-lg">
              Hệ thống quản lý trung tâm
            </h2>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <div className="min-w-0 text-right">
              <p className="max-w-24 truncate text-xs font-medium text-slate-900 min-[420px]:max-w-36 min-[420px]:text-sm sm:max-w-48 sm:text-base xl:max-w-64">
                {user?.name || "Người dùng"}
              </p>

              <p className="hidden max-w-48 truncate text-xs text-slate-600 sm:block xl:max-w-64 xl:text-sm">
                {user?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Đăng xuất"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-green-500 bg-white/70 p-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}

              <span className="hidden sm:inline">
                {isLoggingOut ? "Đang thoát..." : "Đăng xuất"}
              </span>
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 min-[420px]:p-4 sm:p-5 xl:p-6">
          <div className="min-w-0 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
