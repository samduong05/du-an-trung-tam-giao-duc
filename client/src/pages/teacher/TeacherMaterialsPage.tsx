import { BookOpen, FileText, RefreshCw, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  useGetClassesQuery,
  type ClassItem,
  type ClassStatus,
  type DayOfWeek,
} from "../../store/api/classesApi";

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
};

const STATUS_LABELS: Record<ClassStatus, string> = {
  active: "Đang hoạt động",
  paused: "Tạm dừng",
  completed: "Đã hoàn thành",
};

const getStatusClassName = (status: ClassStatus): string => {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "paused":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "completed":
      return "bg-slate-100 text-slate-700 ring-slate-500/20";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
};

const formatSchedule = (classItem: ClassItem): string => {
  if (classItem.schedule.length === 0) {
    return "Chưa có lịch học";
  }

  return classItem.schedule
    .map((scheduleItem) => {
      const room = scheduleItem.room ? ` · Phòng ${scheduleItem.room}` : "";

      return `${DAY_LABELS[scheduleItem.dayOfWeek]} ${
        scheduleItem.startTime
      }–${scheduleItem.endTime}${room}`;
    })
    .join(", ");
};

export default function TeacherMaterialsPage() {
  const navigate = useNavigate();

  const { data, isLoading, isError, isFetching, refetch } =
    useGetClassesQuery();

  const classes = data?.classes ?? [];

  const handleSelectClass = (classId: string) => {
    navigate(`/teacher/materials/${classId}`);
  };

  const renderStatusBadge = (status: ClassStatus) => (
    <span
      className={`inline-flex min-w-28 justify-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClassName(
        status,
      )}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="h-20 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-80 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            Không thể tải danh sách lớp
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Có lỗi xảy ra khi lấy dữ liệu lớp học để quản lý tài liệu.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Tài liệu học tập</h1>

        <p className="mt-1 text-sm text-slate-500">
          Chọn một lớp học để quản lý tài liệu
          {isFetching ? " · Đang cập nhật..." : ""}
        </p>
      </header>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            Chưa có lớp để quản lý tài liệu
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Hiện tại bạn chưa được phân công phụ trách lớp học nào.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem) => {
            const canManageMaterials = classItem.status !== "completed";

            return (
              <article
                key={classItem._id}
                className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2
                      className="truncate text-lg font-semibold text-slate-900"
                      title={classItem.name}
                    >
                      {classItem.name}
                    </h2>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {classItem.subject}
                    </p>
                  </div>

                  {renderStatusBadge(classItem.status)}
                </div>

                <div className="mt-5 flex-1 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Lịch học
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {formatSchedule(classItem)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Học sinh
                    </p>

                    <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Users className="h-4 w-4 text-slate-400" />
                      {classItem.students.length} học sinh
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canManageMaterials}
                  onClick={() => handleSelectClass(classItem._id)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  <FileText className="h-4 w-4" />

                  {canManageMaterials
                    ? "Quản lý tài liệu"
                    : "Lớp đã hoàn thành"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
