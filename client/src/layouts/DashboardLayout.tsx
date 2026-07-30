import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Users,
  X,
} from "lucide-react";

import type { RootState } from "../store";

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
  ],

  teacher: [
    {
      label: "Dashboard",
      path: "/teacher",
      icon: LayoutDashboard,
    },
    {
      label: "Lớp học của tôi",
      path: "/teacher/classes",
      icon: BookOpen,
    },
    {
      label: "Học sinh",
      path: "/teacher/students",
      icon: Users,
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
          className="rounded-md p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white md:hidden"
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
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <header className="flex min-h-16 items-center justify-between gap-3 border-b bg-green-300 px-3 py-3 min-[420px]:px-4 sm:px-5 xl:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setIsSidebarOpen(true)}
              className="shrink-0 rounded-md p-2 text-slate-800 transition hover:bg-green-200 md:hidden"
            >
              <Menu size={22} />
            </button>

            <h2 className="truncate text-sm font-semibold text-slate-800 min-[420px]:text-base sm:text-lg">
              Hệ thống quản lý trung tâm
            </h2>
          </div>

          <div className="min-w-0 shrink-0 text-right">
            <p className="max-w-28 truncate text-xs font-medium text-slate-800 min-[420px]:max-w-36 min-[420px]:text-sm sm:max-w-48 sm:text-base xl:max-w-64">
              {user?.name || "Người dùng"}
            </p>

            <p className="hidden max-w-48 truncate text-xs text-slate-500 sm:block xl:max-w-64 xl:text-sm">
              {user?.email}
            </p>
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
