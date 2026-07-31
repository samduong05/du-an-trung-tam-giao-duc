import { BookOpen, CalendarDays, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";

import {
  useGetClassesQuery,
  type ClassItem,
  type ClassSchedule,
} from "../../store/api/classesApi";

const dayLabels: Record<ClassSchedule["dayOfWeek"], string> = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
};

const formatSchedule = (schedule: ClassSchedule[]): string => {
  if (!schedule || schedule.length === 0) {
    return "Chưa có lịch học";
  }

  return schedule
    .map((item) => {
      const day = dayLabels[item.dayOfWeek];
      const room = item.room ? ` · Phòng ${item.room}` : "";

      return `${day}, ${item.startTime} - ${item.endTime}${room}`;
    })
    .join("; ");
};

const getStatusLabel = (status: ClassItem["status"]): string => {
  switch (status) {
    case "active":
      return "Đang hoạt động";

    case "paused":
      return "Tạm dừng";

    case "completed":
      return "Đã hoàn thành";

    default:
      return status;
  }
};

const getStatusClassName = (status: ClassItem["status"]): string => {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";

    case "paused":
      return "bg-amber-50 text-amber-700";

    case "completed":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

export default function TeacherAssignmentsPage() {
  const { data, isLoading, isFetching, error, refetch } =
    useGetClassesQuery();

  const classes = data?.classes ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Đang tải danh sách lớp...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-base font-semibold text-red-700">
          Không thể tải danh sách lớp
        </h2>

        <p className="mt-1 text-sm text-red-600">
          Vui lòng kiểm tra kết nối hoặc thử tải lại.
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Quản lý bài tập
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Chọn một lớp để xem và quản lý bài tập.
          </p>
        </div>

        {isFetching && (
          <span className="text-sm text-slate-400">Đang cập nhật...</span>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-base font-semibold text-slate-700">
            Chưa có lớp được phân công
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Khi được phân công lớp, giáo viên có thể tạo và quản lý bài tập tại
            đây.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem) => (
            <article
              key={classItem._id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-800">
                    {classItem.name}
                  </h2>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {classItem.subject}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClassName(
                    classItem.status,
                  )}`}
                >
                  {getStatusLabel(classItem.status)}
                </span>
              </div>

              {classItem.description && (
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                  {classItem.description}
                </p>
              )}

              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <span>{classItem.students?.length ?? 0} học sinh</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <span className="leading-5">
                    {formatSchedule(classItem.schedule)}
                  </span>
                </div>
              </div>

              <Link
                to={`/teacher/classes/${classItem._id}/assignments`}
                className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Quản lý bài tập
                <ChevronRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}