import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useGetClassByIdQuery } from "../../store/api/classesApi";
import {
  useFinalizeAttendanceMutation,
  useGetAttendanceByClassAndDateQuery,
  useMarkAttendanceMutation,
  type AttendanceStatus,
} from "../../store/api/attendanceApi";

interface LocalAttendanceRecord {
  studentId: string;
  name: string;
  email: string;
  phone?: string;
  status: AttendanceStatus;
  note: string;
}

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
}[] = [
  {
    value: "present",
    label: "Có mặt",
  },
  {
    value: "absent",
    label: "Vắng",
  },
  {
    value: "late",
    label: "Đi muộn",
  },
];

const getLocalDateInputValue = (): string => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateVietnamese = (dateValue: string): string => {
  if (!dateValue) {
    return "—";
  }

  const [year, month, day] = dateValue.split("-");

  if (!year || !month || !day) {
    return "—";
  }

  return `${day}/${month}/${year}`;
};

const getErrorMessage = (error: unknown): string | undefined => {
  if (typeof error === "object" && error !== null && "data" in error) {
    const apiError = error as {
      data?: {
        message?: string;
      };
    };

    return apiError.data?.message;
  }

  return undefined;
};

const getErrorStatus = (error: unknown): number | string | undefined => {
  if (typeof error === "object" && error !== null && "status" in error) {
    return (error as { status?: number | string }).status;
  }

  return undefined;
};

const getStatusButtonClassName = (
  status: AttendanceStatus,
  selectedStatus: AttendanceStatus,
  disabled: boolean,
): string => {
  const isSelected = status === selectedStatus;

  if (disabled) {
    return isSelected
      ? "border-slate-300 bg-slate-200 text-slate-600"
      : "border-slate-200 bg-white text-slate-400";
  }

  if (!isSelected) {
    return "border-slate-300 bg-white text-slate-600 hover:bg-slate-50";
  }

  switch (status) {
    case "present":
      return "border-emerald-600 bg-emerald-600 text-white";

    case "absent":
      return "border-red-600 bg-red-600 text-white";

    case "late":
      return "border-amber-500 bg-amber-500 text-white";

    default:
      return "border-blue-600 bg-blue-600 text-white";
  }
};

export default function TeacherAttendanceDetailPage() {
  const { classId } = useParams<{ classId: string }>();

  const [selectedDate, setSelectedDate] = useState(getLocalDateInputValue());
  const [records, setRecords] = useState<LocalAttendanceRecord[]>([]);
  const [remarks, setRemarks] = useState("");

  const {
    data: classData,
    isLoading: isLoadingClass,
    isError: isClassError,
    refetch: refetchClass,
  } = useGetClassByIdQuery(classId ?? "", {
    skip: !classId,
  });

  const {
    data: attendanceData,
    error: attendanceError,
    isFetching: isFetchingAttendance,
    refetch: refetchAttendance,
  } = useGetAttendanceByClassAndDateQuery(
    {
      classId: classId ?? "",
      date: selectedDate,
    },
    {
      skip: !classId || !selectedDate,
    },
  );

  const [markAttendance, { isLoading: isSaving }] = useMarkAttendanceMutation();

  const [finalizeAttendance, { isLoading: isFinalizing }] =
    useFinalizeAttendanceMutation();

  const classItem = classData?.class;
  const attendance = attendanceData?.attendance;

  const attendanceErrorStatus = getErrorStatus(attendanceError);
  const isAttendanceNotFound = attendanceErrorStatus === 404;
  const isUnexpectedAttendanceError =
    Boolean(attendanceError) && !isAttendanceNotFound;

  const isFinalized = attendance?.isFinalized ?? false;
  const isSubmitting = isSaving || isFinalizing;

  useEffect(() => {
    setRecords([]);
    setRemarks("");
  }, [selectedDate, classId]);

  useEffect(() => {
    if (!classItem) {
      return;
    }

    if (attendance) {
      const attendanceRecordMap = new Map(
        attendance.records.map((record) => [record.studentId._id, record]),
      );

      const nextRecords = classItem.students.map((student) => {
        const savedRecord = attendanceRecordMap.get(student._id);

        return {
          studentId: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          status: savedRecord?.status ?? "absent",
          note: savedRecord?.note ?? "",
        };
      });

      setRecords(nextRecords);
      setRemarks(attendance.remarks ?? "");

      return;
    }

    if (isAttendanceNotFound) {
      const initialRecords: LocalAttendanceRecord[] = classItem.students.map(
        (student) => ({
          studentId: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          status: "present",
          note: "",
        }),
      );

      setRecords(initialRecords);
      setRemarks("");
    }
  }, [classItem, attendance, isAttendanceNotFound]);

  const summary = useMemo(() => {
    return {
      total: records.length,
      present: records.filter((record) => record.status === "present").length,
      absent: records.filter((record) => record.status === "absent").length,
      late: records.filter((record) => record.status === "late").length,
    };
  }, [records]);

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    if (isFinalized) {
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.studentId === studentId
          ? {
              ...record,
              status,
            }
          : record,
      ),
    );
  };

  const updateStudentNote = (studentId: string, note: string) => {
    if (isFinalized) {
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.studentId === studentId
          ? {
              ...record,
              note,
            }
          : record,
      ),
    );
  };

  const updateAllStatuses = (status: AttendanceStatus) => {
    if (isFinalized) {
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.map((record) => ({
        ...record,
        status,
      })),
    );
  };

  const handleSaveAttendance = async () => {
    if (!classId) {
      toast.error("Không tìm thấy mã lớp học");
      return;
    }

    if (records.length === 0) {
      toast.error("Lớp học chưa có học sinh để điểm danh");
      return;
    }

    try {
      await markAttendance({
        classId,
        date: selectedDate,
        remarks,
        records: records.map((record) => ({
          studentId: record.studentId,
          status: record.status,
          note: record.note,
        })),
      }).unwrap();

      toast.success(
        attendance
          ? "Cập nhật điểm danh thành công"
          : "Lưu điểm danh thành công",
      );
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Không thể lưu điểm danh");
    }
  };

  const handleFinalizeAttendance = async () => {
    if (!attendance) {
      toast.error("Ông cần lưu điểm danh trước khi chốt");
      return;
    }

    const confirmed = window.confirm(
      `Chốt điểm danh ngày ${formatDateVietnamese(
        selectedDate,
      )}? Sau khi chốt sẽ không thể sửa.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await finalizeAttendance(attendance._id).unwrap();

      toast.success("Chốt điểm danh thành công");
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Không thể chốt điểm danh");
    }
  };

  if (!classId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">Không tìm thấy mã lớp học.</p>

        <Link
          to="/teacher/attendance"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách lớp
        </Link>
      </div>
    );
  }

  if (isLoadingClass) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (isClassError || !classItem) {
    return (
      <div className="flex min-h-80 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CalendarCheck className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            Không thể tải thông tin lớp
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Lớp học không tồn tại hoặc ông không có quyền truy cập.
          </p>

          <button
            type="button"
            onClick={() => refetchClass()}
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
        <Link
          to="/teacher/attendance"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách lớp điểm danh
        </Link>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900">
              {classItem.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {classItem.subject} · {classItem.students.length} học sinh
            </p>
          </div>

          {isFinalized ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle2 className="h-4 w-4" />
              Đã chốt điểm danh
            </span>
          ) : attendance ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
              <Save className="h-4 w-4" />
              Đã lưu, chưa chốt
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
              <Clock3 className="h-4 w-4" />
              Chưa lưu điểm danh
            </span>
          )}
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <label
              htmlFor="attendance-date"
              className="text-sm font-semibold text-slate-700"
            >
              Ngày điểm danh
            </label>

            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />

            <p className="mt-2 text-sm text-slate-500">
              Ngày đã chọn:{" "}
              <span className="font-semibold text-slate-700">
                {formatDateVietnamese(selectedDate)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetchAttendance()}
            disabled={isFetchingAttendance || isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isFetchingAttendance ? "animate-spin" : ""
              }`}
            />
            Tải lại ngày này
          </button>
        </div>

        {isFetchingAttendance && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang kiểm tra dữ liệu điểm danh...
          </p>
        )}

        {isUnexpectedAttendanceError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {getErrorMessage(attendanceError) ??
                "Không thể tải dữ liệu điểm danh của ngày này"}
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Tổng học sinh</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {summary.total}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Có mặt</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {summary.present}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Vắng</p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {summary.absent}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">Đi muộn</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {summary.late}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />

            <h2 className="font-semibold text-slate-900">
              Danh sách điểm danh
            </h2>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {records.length}
            </span>
          </div>

          {!isFinalized && records.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateAllStatuses("present")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
              >
                <UserRoundCheck className="h-4 w-4" />
                Tất cả có mặt
              </button>

              <button
                type="button"
                onClick={() => updateAllStatuses("absent")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                <UserRoundX className="h-4 w-4" />
                Tất cả vắng
              </button>

              <button
                type="button"
                onClick={() => updateAllStatuses("late")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
              >
                <Clock3 className="h-4 w-4" />
                Tất cả đi muộn
              </button>
            </div>
          )}
        </div>

        {records.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-900">
              Lớp chưa có học sinh
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Hãy thêm học sinh vào lớp trước khi điểm danh.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="w-[23%] px-4 py-3">Học sinh</th>
                    <th className="w-[37%] px-4 py-3">Trạng thái</th>
                    <th className="w-[40%] px-4 py-3">Ghi chú</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.studentId}
                      className="border-t border-slate-200"
                    >
                      <td className="px-4 py-4">
                        <p className="truncate font-semibold text-slate-900">
                          {record.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {record.email}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {STATUS_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                updateStudentStatus(
                                  record.studentId,
                                  option.value,
                                )
                              }
                              disabled={isFinalized || isSubmitting}
                              className={`min-w-23 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${getStatusButtonClassName(
                                option.value,
                                record.status,
                                isFinalized,
                              )}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <input
                          type="text"
                          value={record.note}
                          onChange={(event) =>
                            updateStudentNote(
                              record.studentId,
                              event.target.value,
                            )
                          }
                          disabled={isFinalized || isSubmitting}
                          placeholder="Nhập ghi chú nếu có"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {records.map((record) => (
                <article
                  key={record.studentId}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-semibold text-slate-900">{record.name}</p>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    {record.email}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateStudentStatus(record.studentId, option.value)
                        }
                        disabled={isFinalized || isSubmitting}
                        className={`rounded-lg border px-2 py-2 text-xs font-semibold transition disabled:cursor-not-allowed ${getStatusButtonClassName(
                          option.value,
                          record.status,
                          isFinalized,
                        )}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={record.note}
                    onChange={(event) =>
                      updateStudentNote(record.studentId, event.target.value)
                    }
                    disabled={isFinalized || isSubmitting}
                    placeholder="Ghi chú"
                    className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label
          htmlFor="attendance-remarks"
          className="text-sm font-semibold text-slate-700"
        >
          Ghi chú chung
        </label>

        <textarea
          id="attendance-remarks"
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          disabled={isFinalized || isSubmitting}
          rows={3}
          placeholder="Nhập ghi chú chung cho buổi học"
          className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
        />

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {!isFinalized && (
            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={
                isSaving ||
                isFinalizing ||
                records.length === 0 ||
                isFetchingAttendance
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {attendance ? "Cập nhật điểm danh" : "Lưu điểm danh"}
            </button>
          )}

          {attendance && !isFinalized && (
            <button
              type="button"
              onClick={handleFinalizeAttendance}
              disabled={isSaving || isFinalizing}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFinalizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Chốt điểm danh
            </button>
          )}
        </div>

        {!attendance && !isFinalized && (
          <p className="mt-3 text-right text-xs text-slate-500">
            Phải lưu điểm danh trước, sau đó mới có thể chốt.
          </p>
        )}
      </section>
    </div>
  );
}
