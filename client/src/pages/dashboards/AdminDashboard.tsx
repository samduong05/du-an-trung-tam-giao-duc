import { BookOpen, GraduationCap, School, Users } from "lucide-react";

const stats = [
  {
    icon: Users,
    label: "Giáo viên",
    value: 12,
  },
  {
    icon: GraduationCap,
    label: "Học sinh",
    value: 180,
  },
  {
    icon: School,
    label: "Lớp học",
    value: 15,
  },
  
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

        <p className="mt-1 text-sm text-slate-500">
          Tổng quan hoạt động của trung tâm
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                    <Icon size={24} />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
