import { useState } from "react";
import { ArrowLeft, CalendarDays, RefreshCw, UserCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import {
  type AttendanceStatus,
  useGetStudentAttendanceReportQuery,
} from "../../store/api/attendanceApi";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  late: "Đi muộn",
  excused: "Nghỉ có phép",
  absent: "Vắng",
};

const STATUS_CLASS_NAMES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700",
  late: "bg-amber-100 text-amber-700",
  excused: "bg-blue-100 text-blue-700",
  absent: "bg-red-100 text-red-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("vi-VN");
}

export default function StudentAttendanceReportPage() {
  const navigate = useNavigate();
  const { studentId: paramStudentId, classId } = useParams<{
    studentId?: string;
    classId?: string;
  }>();

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const studentId =
    currentUser?.role === "student" ? currentUser.id : paramStudentId;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const shouldSkip =
    !studentId || (currentUser?.role === "student" && !classId);
  const { data, isLoading, isFetching, isError, refetch } =
    useGetStudentAttendanceReportQuery(
      {
        studentId: studentId ?? "",
        classId,
        from: from || undefined,
        to: to || undefined,
      },
      {
        skip: shouldSkip,
      },
    );
  if (!studentId) {
    return (
      <div className="p-6">
        <p className="text-red-600">Không tìm thấy mã học sinh.</p>
      </div>
    );
  }

  if (currentUser?.role === "student" && !classId) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Không tìm thấy mã lớp học cần xem chuyên cần.
        </p>

        <button
          type="button"
          onClick={() => navigate("/student/classes")}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Quay lại lớp học của tôi
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <p className="p-6 text-slate-500">Đang tải báo cáo...</p>;
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <p className="text-red-600">Không thể tải báo cáo điểm danh.</p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>
    );
  }

  const { student, class: classItem, summary, details } = data;

  const attendanceRate =
    summary.total > 0
      ? Math.round(((summary.present + summary.late) / summary.total) * 100)
      : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <button
          type="button"
          onClick={() => {
            if (currentUser?.role === "student") {
              navigate(
                classId ? `/student/classes/${classId}` : "/student/classes",
              );
              return;
            }

            if (currentUser?.role === "teacher" && classId) {
              navigate("/teacher/classes");
              return;
            }

            navigate(-1);
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Báo cáo chuyên cần
          </h1>

          <p className="mt-1 text-slate-500">
            {student.name} · {student.email}
          </p>
          {classItem && (
            <p className="mt-1 text-sm font-medium text-blue-600">
              {classItem.name} · {classItem.subject}
            </p>
          )}
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="attendance-from"
              className="text-sm font-medium text-slate-700"
            >
              Từ ngày
            </label>

            <input
              id="attendance-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="attendance-to"
              className="text-sm font-medium text-slate-700"
            >
              Đến ngày
            </label>

            <input
              id="attendance-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              disabled={isFetching}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <ReportCard label="Tổng buổi" value={summary.total} />
        <ReportCard label="Có mặt" value={summary.present} />
        <ReportCard label="Đi muộn" value={summary.late} />
        <ReportCard label="Nghỉ có phép" value={summary.excused} />
        <ReportCard label="Vắng" value={summary.absent} />
        <ReportCard label="Tỷ lệ chuyên cần" value={`${attendanceRate}%`} />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Lịch sử điểm danh
          </h2>

          {isFetching && (
            <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
          )}
        </div>

        {details.length === 0 ? (
          <div className="p-10 text-center">
            <UserCheck className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">
              Chưa có dữ liệu điểm danh đã chốt.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Ngày</th>
                  <th className="px-4 py-3 font-medium">Lớp</th>
                  <th className="px-4 py-3 font-medium">Giáo viên</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Ghi chú</th>
                </tr>
              </thead>

              <tbody>
                {details.map((detail) => (
                  <tr
                    key={detail.attendanceId}
                    className="border-t border-slate-100"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(detail.date)}
                    </td>

                    <td className="px-4 py-3">{detail.class?.name || "—"}</td>

                    <td className="px-4 py-3">{detail.teacher?.name || "—"}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          STATUS_CLASS_NAMES[detail.status]
                        }`}
                      >
                        {STATUS_LABELS[detail.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {detail.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

interface ReportCardProps {
  label: string;
  value: number | string;
}

function ReportCard({ label, value }: ReportCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
