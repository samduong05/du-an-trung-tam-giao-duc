import { BookOpen, CalendarDays, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import {
  type ClassStatus,
  useGetMyClassesQuery,
} from "../../store/api/classesApi";

const statusLabels: Record<ClassStatus, string> = {
  active: "Đang học",
  paused: "Tạm dừng",
  completed: "Đã hoàn thành",
};

const statusClassNames: Record<ClassStatus, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-slate-200 text-slate-700",
};

export default function StudentClassesPage() {
  const { data, isLoading, isError, refetch } = useGetMyClassesQuery();

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải danh sách lớp học...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Lớp học của tôi</h1>

        <p className="mt-3 text-sm text-red-600">
          Không thể tải danh sách lớp học.
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const classes = data?.classes ?? [];

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lớp học của tôi</h1>

        <p className="mt-1 text-sm text-slate-600">
          Xem các lớp học mà bạn đang tham gia.
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-3 text-lg font-semibold text-slate-800">
            Chưa có lớp học
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Hiện tại bạn chưa được thêm vào lớp học nào.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem) => (
            <article
              key={classItem._id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900">
                    {classItem.name}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-blue-600">
                    {classItem.subject}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusClassNames[classItem.status]
                  }`}
                >
                  {statusLabels[classItem.status]}
                </span>
              </div>

              {classItem.description && (
                <p className="mt-4 line-clamp-2 text-sm text-slate-600">
                  {classItem.description}
                </p>
              )}

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 shrink-0 text-slate-400" />

                  <span className="truncate">
                    Giáo viên: {classItem.teacher?.name || "Chưa cập nhật"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />

                  <span>
                    {classItem.schedule?.length || 0} lịch học mỗi tuần
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-5">
                <Link
                  to={`/student/classes/${classItem._id}`}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Xem chi tiết lớp
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
