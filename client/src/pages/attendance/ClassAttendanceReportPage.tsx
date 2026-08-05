import { useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  School,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useGetClassesQuery } from "../../store/api/classesApi";
import { useGetClassAttendanceReportQuery } from "../../store/api/attendanceApi";

export default function ClassAttendanceReportPage() {
  const navigate = useNavigate();

  const [classId, setClassId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const {
    data: classesData,
    isLoading: isLoadingClasses,
    isError: isClassesError,
    refetch: refetchClasses,
  } = useGetClassesQuery();

  const {
    data: reportData,
    isLoading: isLoadingReport,
    isFetching: isFetchingReport,
    isError: isReportError,
    refetch: refetchReport,
  } = useGetClassAttendanceReportQuery(
    {
      classId,
      from: from || undefined,
      to: to || undefined,
    },
    {
      skip: !classId,
    },
  );

  const classes = classesData?.classes ?? [];

  const filteredStudents =
    reportData?.students.filter((item) => {
      const searchValue = studentSearch.trim().toLowerCase();

      if (!searchValue) {
        return true;
      }

      return (
        item.student.name.toLowerCase().includes(searchValue) ||
        item.student.email.toLowerCase().includes(searchValue) ||
        item.student.phone?.toLowerCase().includes(searchValue)
      );
    }) ?? [];

  const handleOpenStudentReport = (studentId: string) => {
    const searchParams = new URLSearchParams();

    if (from) {
      searchParams.set("from", from);
    }

    if (to) {
      searchParams.set("to", to);
    }

    const queryString = searchParams.toString();

    navigate(
      `/attendance/reports/students/${studentId}${
        queryString ? `?${queryString}` : ""
      }`,
    );
  };

  const handleClearFilters = () => {
    setFrom("");
    setTo("");
    setStudentSearch("");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Báo cáo chuyên cần theo lớp
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Chọn một lớp và khoảng ngày để xem dữ liệu chuyên cần đã chốt.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              htmlFor="attendance-class"
              className="text-sm font-medium text-slate-700"
            >
              Lớp học
            </label>

            <select
              id="attendance-class"
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value);
                setStudentSearch("");
              }}
              disabled={isLoadingClasses}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">
                {isLoadingClasses ? "Đang tải lớp..." : "Chọn lớp học"}
              </option>

              {classes.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.name} — {classItem.subject}
                </option>
              ))}
            </select>
          </div>

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
              onClick={handleClearFilters}
              disabled={isFetchingReport}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isFetchingReport ? "animate-spin" : ""
                }`}
              />
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </section>

      {isClassesError && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Không thể tải danh sách lớp học.
          </p>

          <button
            type="button"
            onClick={() => refetchClasses()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </section>
      )}

      {!classId && !isClassesError && (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <School className="mx-auto h-12 w-12 text-slate-300" />

          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            Chọn một lớp để xem báo cáo
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Báo cáo chỉ được tải sau khi bạn chọn lớp học.
          </p>
        </section>
      )}

      {classId && isLoadingReport && (
        <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-slate-500">
            Đang tải báo cáo chuyên cần...
          </p>
        </section>
      )}

      {classId && isReportError && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-red-700">
            Không thể tải báo cáo chuyên cần của lớp.
          </p>

          <button
            type="button"
            onClick={() => refetchReport()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </section>
      )}

      {reportData && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {reportData.class.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {reportData.class.subject}
                  {reportData.class.teacher?.name
                    ? ` · Giáo viên: ${reportData.class.teacher.name}`
                    : ""}
                </p>
              </div>

              {isFetchingReport && (
                <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang cập nhật
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportCard
              icon={CalendarDays}
              label="Tổng buổi đã chốt"
              value={reportData.totalSessions}
            />

            <ReportCard
              icon={Users}
              label="Tổng học sinh"
              value={reportData.totalStudents}
            />

            <ReportCard
              icon={UserCheck}
              label="Chuyên cần trung bình"
              value={`${reportData.averageAttendanceRate}%`}
            />

            <ReportCard
              icon={School}
              label="Trạng thái lớp"
              value={getClassStatusLabel(reportData.class.status)}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Danh sách chuyên cần học sinh
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Chỉ thống kê các buổi điểm danh đã chốt.
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Tìm theo tên, email, số điện thoại"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-10 text-center">
                <UserCheck className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-3 text-slate-500">
                  Không có học sinh phù hợp.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Học sinh</th>
                      <th className="px-4 py-3 text-center font-medium">
                        Tổng
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Có mặt
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Đi muộn
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Có phép
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Vắng
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Tỷ lệ
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((item) => (
                      <tr
                        key={item.student._id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenStudentReport(item.student._id)
                            }
                            className="text-left"
                          >
                            <p className="font-semibold text-slate-900 hover:text-blue-600">
                              {item.student.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.student.email}
                            </p>
                          </button>
                        </td>

                        <td className="px-4 py-3 text-center font-medium">
                          {item.summary.total}
                        </td>

                        <td className="px-4 py-3 text-center text-emerald-700">
                          {item.summary.present}
                        </td>

                        <td className="px-4 py-3 text-center text-amber-700">
                          {item.summary.late}
                        </td>

                        <td className="px-4 py-3 text-center text-blue-700">
                          {item.summary.excused}
                        </td>

                        <td className="px-4 py-3 text-center text-red-700">
                          {item.summary.absent}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <AttendanceRateBadge
                            value={item.attendanceRate}
                          />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenStudentReport(item.student._id)
                            }
                            className="font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Xem báo cáo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

interface ReportCardProps {
  icon: typeof CalendarDays;
  label: string;
  value: number | string;
}

function ReportCard({ icon: Icon, label, value }: ReportCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function AttendanceRateBadge({ value }: { value: number }) {
  let className = "bg-red-100 text-red-700";

  if (value >= 80) {
    className = "bg-emerald-100 text-emerald-700";
  } else if (value >= 60) {
    className = "bg-amber-100 text-amber-700";
  }

  return (
    <span
      className={`inline-flex min-w-16 justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {value}%
    </span>
  );
}

function getClassStatusLabel(
  status: "active" | "paused" | "completed",
) {
  const labels = {
    active: "Đang hoạt động",
    paused: "Tạm dừng",
    completed: "Đã kết thúc",
  };

  return labels[status];
}