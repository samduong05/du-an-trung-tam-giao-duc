import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  FilterX,
  MapPin,
  RefreshCw,
  UserRound,
} from "lucide-react";

import {
  useGetClassesQuery,
  type ClassItem,
  type ClassSchedule,
  type DayOfWeek,
} from "../../store/api/classesApi";
import { useGetAdminAttendanceDayStatusQuery } from "../../store/api/attendanceApi";

interface DailyScheduleEntry {
  id: string;
  classItem: ClassItem;
  schedule: ClassSchedule;
}

const DAY_BY_JS_DAY: Record<number, DayOfWeek> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
};

const formatDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const formatFullDate = (date: Date): string => {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const isDateInsideClassDuration = (
  date: Date,
  classItem: ClassItem,
): boolean => {
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  if (classItem.startedAt) {
    const startedAt = new Date(classItem.startedAt);
    startedAt.setHours(0, 0, 0, 0);

    if (selectedDate < startedAt) {
      return false;
    }
  }

  if (classItem.endedAt) {
    const endedAt = new Date(classItem.endedAt);
    endedAt.setHours(23, 59, 59, 999);

    if (selectedDate > endedAt) {
      return false;
    }
  }

  return true;
};

const getUniqueSortedValues = (values: string[]): string[] => {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) =>
    first.localeCompare(second, "vi"),
  );
};

export default function AdminDailySchedulePage() {
  const [selectedDateValue, setSelectedDateValue] = useState(() =>
    formatDateValue(new Date()),
  );

  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  const { data, isLoading, isError, isFetching, refetch } =
    useGetClassesQuery({
      status: "active",
    });

  const classes = data?.classes ?? [];

  const {
    data: attendanceStatusData,
    isFetching: isFetchingAttendanceStatuses,
  } = useGetAdminAttendanceDayStatusQuery({
    date: selectedDateValue,
  });

  const selectedDate = useMemo(
    () => parseDateValue(selectedDateValue),
    [selectedDateValue],
  );

  const selectedDayOfWeek = DAY_BY_JS_DAY[selectedDate.getDay()];

  const teacherOptions = useMemo(() => {
    const teacherMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
      }
    >();

    classes.forEach((classItem) => {
      if (!classItem.teacher?._id) {
        return;
      }

      teacherMap.set(classItem.teacher._id, {
        id: classItem.teacher._id,
        name: classItem.teacher.name,
        email: classItem.teacher.email,
      });
    });

    return Array.from(teacherMap.values()).sort((first, second) =>
      first.name.localeCompare(second.name, "vi"),
    );
  }, [classes]);

  const classOptions = useMemo(
    () =>
      [...classes].sort((first, second) =>
        first.name.localeCompare(second.name, "vi"),
      ),
    [classes],
  );

  const roomOptions = useMemo(
    () =>
      getUniqueSortedValues(
        classes.flatMap((classItem) =>
          classItem.schedule.map((schedule) => schedule.room?.trim() ?? ""),
        ),
      ),
    [classes],
  );

  const dailyEntries = useMemo(() => {
    const entries: DailyScheduleEntry[] = [];

    classes.forEach((classItem) => {
      if (!isDateInsideClassDuration(selectedDate, classItem)) {
        return;
      }

      classItem.schedule.forEach((schedule, scheduleIndex) => {
        if (schedule.dayOfWeek !== selectedDayOfWeek) {
          return;
        }

        if (
          selectedTeacherId &&
          classItem.teacher?._id !== selectedTeacherId
        ) {
          return;
        }

        if (selectedClassId && classItem._id !== selectedClassId) {
          return;
        }

        if (
          selectedRoom &&
          (schedule.room?.trim() ?? "") !== selectedRoom
        ) {
          return;
        }

        entries.push({
          id: `${classItem._id}-${schedule.dayOfWeek}-${schedule.startTime}-${scheduleIndex}`,
          classItem,
          schedule,
        });
      });
    });

    return entries.sort((firstEntry, secondEntry) => {
      const startTimeComparison =
        firstEntry.schedule.startTime.localeCompare(
          secondEntry.schedule.startTime,
        );

      if (startTimeComparison !== 0) {
        return startTimeComparison;
      }

      return firstEntry.classItem.name.localeCompare(
        secondEntry.classItem.name,
        "vi",
      );
    });
  }, [
    classes,
    selectedClassId,
    selectedDate,
    selectedDayOfWeek,
    selectedRoom,
    selectedTeacherId,
  ]);

  const attendanceStatusMap = useMemo(() => {
    const statusMap = new Map<
      string,
      {
        attendanceId: string;
        isFinalized: boolean;
      }
    >();

    attendanceStatusData?.statuses.forEach((statusItem) => {
      statusMap.set(statusItem.classId, {
        attendanceId: statusItem.attendanceId,
        isFinalized: statusItem.isFinalized,
      });
    });

    return statusMap;
  }, [attendanceStatusData]);

  const getAttendanceStatusLabel = (classId: string): string => {
    const attendanceStatus = attendanceStatusMap.get(classId);

    if (!attendanceStatus) {
      return "Chưa điểm danh";
    }

    return attendanceStatus.isFinalized
      ? "Đã chốt điểm danh"
      : "Đã điểm danh · Chưa chốt";
  };

  const getAttendanceStatusClassName = (classId: string): string => {
    const attendanceStatus = attendanceStatusMap.get(classId);

    if (!attendanceStatus) {
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
    }

    return attendanceStatus.isFinalized
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : "bg-amber-50 text-amber-700 ring-amber-600/20";
  };

  const hasActiveFilters =
    Boolean(selectedTeacherId) ||
    Boolean(selectedClassId) ||
    Boolean(selectedRoom);

  const clearFilters = () => {
    setSelectedTeacherId("");
    setSelectedClassId("");
    setSelectedRoom("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-28 animate-pulse rounded-xl bg-slate-200" />

        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            Không thể tải lịch dạy
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Có lỗi xảy ra khi lấy dữ liệu lớp học.
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
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Lịch dạy trong ngày
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Xem các lớp dự kiến giảng dạy theo ngày đã chọn
              {isFetching || isFetchingAttendanceStatuses
                ? " · Đang cập nhật..."
                : ""}
            </p>
          </div>

          <div className="w-full lg:w-auto">
            <label
              htmlFor="daily-schedule-date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Chọn ngày
            </label>

            <input
              id="daily-schedule-date"
              type="date"
              value={selectedDateValue}
              onChange={(event) => setSelectedDateValue(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-56"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold capitalize text-slate-900">
              {formatFullDate(selectedDate)}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {DAY_LABELS[selectedDayOfWeek]}
            </p>
          </div>

          <p className="text-sm font-medium text-slate-600">
            {dailyEntries.length} ca dạy
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="teacher-filter"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Giáo viên
              </label>

              <select
                id="teacher-filter"
                value={selectedTeacherId}
                onChange={(event) =>
                  setSelectedTeacherId(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Tất cả giáo viên</option>

                {teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="class-filter"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Lớp học
              </label>

              <select
                id="class-filter"
                value={selectedClassId}
                onChange={(event) =>
                  setSelectedClassId(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Tất cả lớp học</option>

                {classOptions.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="room-filter"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Phòng học
              </label>

              <select
                id="room-filter"
                value={selectedRoom}
                onChange={(event) => setSelectedRoom(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Tất cả phòng học</option>

                {roomOptions.map((room) => (
                  <option key={room} value={room}>
                    Phòng {room}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={!hasActiveFilters}
            onClick={clearFilters}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
          >
            <FilterX className="h-4 w-4" />
            Xóa bộ lọc
          </button>
        </div>
      </section>

      {dailyEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            Không có lịch dạy
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Không tìm thấy lớp phù hợp trong ngày và bộ lọc đã chọn.
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FilterX className="h-4 w-4" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="w-full table-fixed">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-[15%] px-5 py-4">Thời gian</th>
                  <th className="w-[23%] px-5 py-4">Lớp học</th>
                  <th className="w-[24%] px-5 py-4">Giáo viên</th>
                  <th className="w-[18%] px-5 py-4">Môn học</th>
                  <th className="w-[12%] px-5 py-4">Phòng</th>
                  <th className="w-[18%] px-5 py-4">Điểm danh</th>
                </tr>
              </thead>

              <tbody>
                {dailyEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-t border-slate-200 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="inline-flex items-center gap-2 font-semibold text-blue-700">
                        <Clock3 className="h-4 w-4 shrink-0" />
                        {entry.schedule.startTime}
                      </p>

                      <p className="mt-1 pl-6 text-xs text-slate-500">
                        đến {entry.schedule.endTime}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="truncate font-semibold text-slate-900">
                        {entry.classItem.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {entry.classItem.students.length} học sinh
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {entry.classItem.teacher?.name ?? "Chưa phân công"}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {entry.classItem.teacher?.email ?? "—"}
                      </p>
                    </td>

                    <td className="truncate px-5 py-4 text-sm text-slate-700">
                      {entry.classItem.subject}
                    </td>

                    <td className="px-5 py-4">
                      {entry.schedule.room ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                          <MapPin className="h-4 w-4" />
                          {entry.schedule.room}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Chưa xếp phòng
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getAttendanceStatusClassName(
                          entry.classItem._id,
                        )}`}
                      >
                        {getAttendanceStatusLabel(entry.classItem._id)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 lg:hidden">
            {dailyEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 font-semibold text-blue-700">
                    <Clock3 className="h-4 w-4" />
                    {entry.schedule.startTime} – {entry.schedule.endTime}
                  </p>

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                    {entry.classItem.students.length} học sinh
                  </span>
                </div>

                <h2 className="mt-3 font-semibold text-slate-900">
                  {entry.classItem.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {entry.classItem.subject}
                </p>

                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
                  <p className="flex items-start gap-2">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <span>
                      <span className="font-medium text-slate-800">
                        {entry.classItem.teacher?.name ??
                          "Chưa phân công"}
                      </span>

                      {entry.classItem.teacher?.email && (
                        <span className="block text-xs text-slate-500">
                          {entry.classItem.teacher.email}
                        </span>
                      )}
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    {entry.schedule.room
                      ? `Phòng ${entry.schedule.room}`
                      : "Chưa xếp phòng"}
                  </p>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getAttendanceStatusClassName(
                      entry.classItem._id,
                    )}`}
                  >
                    {getAttendanceStatusLabel(entry.classItem._id)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}