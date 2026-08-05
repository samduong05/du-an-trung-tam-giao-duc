import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import {
  type ClassStatus,
  type DayOfWeek,
  useGetMyClassByIdQuery,
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

const dayLabels: Record<DayOfWeek, string> = {
  monday: "Thứ Hai",
  tuesday: "Thứ Ba",
  wednesday: "Thứ Tư",
  thursday: "Thứ Năm",
  friday: "Thứ Sáu",
  saturday: "Thứ Bảy",
  sunday: "Chủ Nhật",
};

const formatDate = (value?: string): string => {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
};

export default function StudentClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();

  const { data, isLoading, isError, refetch } = useGetMyClassByIdQuery(
    classId ?? "",
    {
      skip: !classId,
    },
  );

  if (!classId) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">
          Không tìm thấy mã lớp học.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Đang tải thông tin lớp học...
        </p>
      </div>
    );
  }

  if (isError || !data?.class) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          Không thể tải lớp học
        </h1>

        <p className="mt-2 text-sm text-red-600">
          Lớp không tồn tại hoặc bạn không thuộc lớp này.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Thử lại
          </button>

          <Link
            to="/student/classes"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại danh sách lớp
          </Link>
        </div>
      </div>
    );
  }

  const classItem = data.class;

  return (
    <section className="space-y-5">
      <Link
        to="/student/classes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại lớp học của tôi
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-blue-600">
              <BookOpen className="h-5 w-5" />

              <span className="text-sm font-semibold">
                {classItem.subject}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {classItem.name}
            </h1>

            {classItem.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {classItem.description}
              </p>
            )}
          </div>

          <span
            className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
              statusClassNames[classItem.status]
            }`}
          >
            {statusLabels[classItem.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />

              <h2 className="text-lg font-bold text-slate-900">
                Lịch học
              </h2>
            </div>

            {classItem.schedule.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Lớp chưa có lịch học.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {classItem.schedule.map((scheduleItem, index) => (
                  <div
                    key={`${scheduleItem.dayOfWeek}-${scheduleItem.startTime}-${index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {dayLabels[scheduleItem.dayOfWeek]}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-slate-400" />
                        {scheduleItem.startTime} - {scheduleItem.endTime}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {scheduleItem.room || "Chưa cập nhật phòng"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              to={`/student/classes/${classId}/attendance`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <h3 className="font-bold text-slate-900">
                Chuyên cần
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Xem quá trình đi học và nghỉ học.
              </p>
            </Link>

            <div className="rounded-xl border border-slate-200 bg-white p-5 opacity-70 shadow-sm">
              <h3 className="font-bold text-slate-900">
                Tài liệu
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Sẽ được nối ở bước tiếp theo.
              </p>
            </div>

            <Link
              to={`/student/classes/${classId}/assignments`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <h3 className="font-bold text-slate-900">
                Bài tập
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Xem bài tập, tải file và nộp bài cho giáo viên.
              </p>
            </Link>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-blue-600" />

              <h2 className="text-lg font-bold text-slate-900">
                Giáo viên
              </h2>
            </div>

            <div className="mt-4">
              <p className="font-semibold text-slate-900">
                {classItem.teacher?.name || "Chưa cập nhật"}
              </p>

              <p className="mt-1 break-all text-sm text-slate-500">
                {classItem.teacher?.email || "Chưa cập nhật email"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Thời gian khóa học
            </h2>

            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">
                  Ngày bắt đầu
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {formatDate(classItem.startedAt)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">
                  Ngày kết thúc
                </dt>

                <dd className="mt-1 font-semibold text-slate-900">
                  {formatDate(classItem.endedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}