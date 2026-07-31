import { Fragment, useState } from "react";
import TeacherClassDetails from "./TeacherClassDetails";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Users,
} from "lucide-react";

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

const getStatusClassName = (status: ClassStatus) => {
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

const formatSchedule = (classItem: ClassItem) => {
  if (classItem.schedule.length === 0) {
    return "Chưa có lịch học";
  }

  return classItem.schedule
    .map((scheduleItem) => {
      const room = scheduleItem.room ? ` · Phòng ${scheduleItem.room}` : "";

      return `${DAY_LABELS[scheduleItem.dayOfWeek]} ${scheduleItem.startTime}–${scheduleItem.endTime}${room}`;
    })
    .join(", ");
};

export default function TeacherClassesPage() {
  const { data, isLoading, isError, isFetching, refetch } =
    useGetClassesQuery();

  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const classes = data?.classes ?? [];

  const toggleClassDetails = (classId: string) => {
    setExpandedClassId((currentId) => (currentId === classId ? null : classId));
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

        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-xl bg-slate-200"
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
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            Không thể tải danh sách lớp
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Có lỗi xảy ra khi lấy dữ liệu lớp học.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
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
        <h1 className="text-2xl font-bold text-slate-900">Lớp học của tôi</h1>

        <p className="mt-1 text-sm text-slate-500">
          Bạn đang được phân công phụ trách {classes.length} lớp học
          {isFetching ? " · Đang cập nhật..." : ""}
        </p>
      </header>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            Chưa được phân công lớp
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Hiện tại bạn chưa được phân công phụ trách lớp học nào.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="w-full table-fixed">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-[24%] px-5 py-4">Lớp học</th>
                  <th className="w-[15%] px-5 py-4">Môn học</th>
                  <th className="w-[29%] px-5 py-4">Lịch học</th>
                  <th className="w-[12%] px-5 py-4 text-center">Học sinh</th>
                  <th className="w-[20%] px-5 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {classes.map((classItem) => {
                  const isExpanded = expandedClassId === classItem._id;

                  return (
                    <Fragment key={classItem._id}>
                      <tr className="border-t border-slate-200">
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => toggleClassDetails(classItem._id)}
                            aria-expanded={isExpanded}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <span className="shrink-0 text-slate-400">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>

                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-slate-900">
                                {classItem.name}
                              </span>

                              <span className="mt-1 block truncate text-xs text-slate-500">
                                {classItem.description || "Không có mô tả"}
                              </span>
                            </span>
                          </button>
                        </td>

                        <td className="truncate px-5 py-4 text-sm text-slate-700">
                          {classItem.subject}
                        </td>

                        <td
                          className="truncate px-5 py-4 text-sm text-slate-700"
                          title={formatSchedule(classItem)}
                        >
                          {formatSchedule(classItem)}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <Users className="h-4 w-4 text-slate-400" />
                            {classItem.students.length}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          {renderStatusBadge(classItem.status)}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-t border-slate-200">
                          <td colSpan={5} className="p-0">
                            <TeacherClassDetails classItem={classItem} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 lg:hidden">
            {classes.map((classItem) => {
              const isExpanded = expandedClassId === classItem._id;

              return (
                <article
                  key={classItem._id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-slate-900">
                          {classItem.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {classItem.subject}
                        </p>
                      </div>

                      {renderStatusBadge(classItem.status)}
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Lịch học
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {formatSchedule(classItem)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Học sinh
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {classItem.students.length} học sinh
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleClassDetails(classItem._id)}
                      aria-expanded={isExpanded}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}

                      {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                    </button>
                  </div>

                  {isExpanded && <TeacherClassDetails classItem={classItem} />}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
