import { GraduationCap, School, Users } from "lucide-react";
import { useGetClassesQuery } from "../../store/api/classesApi";
import { useGetUsersQuery } from "../../store/api/endpoints";

export default function AdminDashboard() {
  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
  } = useGetUsersQuery();

  const {
    data: classesData,
    isLoading: isClassesLoading,
    isError: isClassesError,
  } = useGetClassesQuery();

  const teacherCount =
    usersData?.users.filter((user) => user.role === "teacher").length ?? 0;

  const studentCount =
    usersData?.users.filter((user) => user.role === "student").length ?? 0;

  const classCount = classesData?.count ?? 0;

  const isLoading = isUsersLoading || isClassesLoading;
  const isError = isUsersError || isClassesError;

  const stats = [
    {
      icon: Users,
      label: "Giáo viên",
      value: teacherCount,
    },
    {
      icon: GraduationCap,
      label: "Học sinh",
      value: studentCount,
    },
    {
      icon: School,
      label: "Lớp học",
      value: classCount,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

        <p className="mt-1 text-sm text-slate-500">
          Tổng quan hoạt động của trung tâm
        </p>
      </div>

      {isError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không thể tải số liệu Dashboard. Vui lòng thử lại.
        </div>
      )}

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

                  <div className="mt-3 rounded-lg bg-blue-50 p-3 text-blue-600">
                    <Icon size={24} />
                  </div>
                </div>

                <p className="text-3xl font-bold text-slate-900">
                  {isLoading ? "..." : item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}