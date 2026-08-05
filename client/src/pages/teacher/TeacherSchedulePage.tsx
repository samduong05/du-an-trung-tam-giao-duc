import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  useGetClassesQuery,
  type ClassItem,
  type ClassSchedule,
  type DayOfWeek,
} from "../../store/api/classesApi";

import { useGetTeacherAttendanceWeekStatusQuery } from "../../store/api/attendanceApi";

const DAY_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
};

interface ScheduleEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  date: Date;
  classItem: ClassItem;
  schedule: ClassSchedule;
}

type ScheduleAttendanceStatus = "not-marked" | "draft" | "finalized";

const getStartOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const currentDay = result.getDay();

  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  result.setDate(result.getDate() + distanceToMonday);
  result.setHours(0, 0, 0, 0);

  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
};

const formatDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatShortDate = (date: Date): string => {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

const formatFullDate = (date: Date): string => {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const isSameDate = (firstDate: Date, secondDate: Date): boolean => {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
};

const isDateInsideClassDuration = (
  date: Date,
  classItem: ClassItem,
): boolean => {
  const scheduleDate = new Date(date);
  scheduleDate.setHours(0, 0, 0, 0);

  if (classItem.startedAt) {
    const startedAt = new Date(classItem.startedAt);
    startedAt.setHours(0, 0, 0, 0);

    if (scheduleDate < startedAt) {
      return false;
    }
  }

  if (classItem.endedAt) {
    const endedAt = new Date(classItem.endedAt);
    endedAt.setHours(23, 59, 59, 999);

    if (scheduleDate > endedAt) {
      return false;
    }
  }

  return true;
};

const renderAttendanceBadge = (status: ScheduleAttendanceStatus) => {
  switch (status) {
    case "finalized":
      return (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          Đã chốt
        </span>
      );

    case "draft":
      return (
        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
          Đã lưu, chưa chốt
        </span>
      );

    default:
      return (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
          Chưa điểm danh
        </span>
      );
  }
};

export default function TeacherSchedulePage() {
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));

  const { data, isLoading, isError, isFetching, refetch } = useGetClassesQuery({
    status: "active",
  });

  const classes = data?.classes ?? [];

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekFromValue = formatDateValue(weekStart);
  const weekToValue = formatDateValue(weekEnd);

  const {
    data: attendanceStatusData,
    isFetching: isFetchingAttendanceStatuses,
  } = useGetTeacherAttendanceWeekStatusQuery({
    from: weekFromValue,
    to: weekToValue,
  });

  const attendanceStatusMap = useMemo(() => {
    const statusMap = new Map<
      string,
      {
        attendanceId: string;
        isFinalized: boolean;
      }
    >();

    attendanceStatusData?.statuses.forEach((statusItem) => {
      const dateValue = statusItem.date.slice(0, 10);
      const key = `${statusItem.classId}-${dateValue}`;

      statusMap.set(key, {
        attendanceId: statusItem.attendanceId,
        isFinalized: statusItem.isFinalized,
      });
    });

    return statusMap;
  }, [attendanceStatusData]);

  const weekDays = useMemo(
    () =>
      DAY_ORDER.map((dayOfWeek, index) => ({
        dayOfWeek,
        date: addDays(weekStart, index),
      })),
    [weekStart],
  );

  const scheduleEntries = useMemo(() => {
    const entries: ScheduleEntry[] = [];

    classes.forEach((classItem) => {
      classItem.schedule.forEach((schedule, scheduleIndex) => {
        const dayIndex = DAY_ORDER.indexOf(schedule.dayOfWeek);

        if (dayIndex === -1) {
          return;
        }

        const scheduleDate = addDays(weekStart, dayIndex);

        if (!isDateInsideClassDuration(scheduleDate, classItem)) {
          return;
        }

        entries.push({
          id: `${classItem._id}-${schedule.dayOfWeek}-${schedule.startTime}-${scheduleIndex}`,
          dayOfWeek: schedule.dayOfWeek,
          date: scheduleDate,
          classItem,
          schedule,
        });
      });
    });

    return entries.sort((firstEntry, secondEntry) => {
      const firstDayIndex = DAY_ORDER.indexOf(firstEntry.dayOfWeek);

      const secondDayIndex = DAY_ORDER.indexOf(secondEntry.dayOfWeek);

      if (firstDayIndex !== secondDayIndex) {
        return firstDayIndex - secondDayIndex;
      }

      return firstEntry.schedule.startTime.localeCompare(
        secondEntry.schedule.startTime,
      );
    });
  }, [classes, weekStart]);

  const today = new Date();

  const getScheduleAttendanceStatus = (
    entry: ScheduleEntry,
  ): ScheduleAttendanceStatus => {
    const dateValue = formatDateValue(entry.date);

    const key = `${entry.classItem._id}-${dateValue}`;

    const attendanceStatus = attendanceStatusMap.get(key);

    if (!attendanceStatus) {
      return "not-marked";
    }

    if (attendanceStatus.isFinalized) {
      return "finalized";
    }

    return "draft";
  };

  const goToPreviousWeek = () => {
    setWeekStart((currentWeekStart) => addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart((currentWeekStart) => addDays(currentWeekStart, 7));
  };

  const goToCurrentWeek = () => {
    setWeekStart(getStartOfWeek(new Date()));
  };

  const handleOpenAttendance = (entry: ScheduleEntry) => {
    const date = formatDateValue(entry.date);

    navigate(`/teacher/attendance/${entry.classItem._id}?date=${date}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          {DAY_ORDER.map((day) => (
            <div
              key={day}
              className="h-72 animate-pulse rounded-xl bg-slate-200"
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
              Lịch dạy của tôi
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi các lớp được phân công theo tuần
              {isFetching || isFetchingAttendanceStatuses
                ? " · Đang cập nhật..."
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousWeek}
              title="Tuần trước"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={goToCurrentWeek}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Tuần hiện tại
            </button>

            <button
              type="button"
              onClick={goToNextWeek}
              title="Tuần sau"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-slate-900">
            Tuần {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
          </p>

          <p className="text-sm text-slate-500">
            {scheduleEntries.length} ca dạy
          </p>
        </div>
      </header>

      {scheduleEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            Tuần này chưa có lịch dạy
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Không có lớp đang hoạt động trong tuần đã chọn.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1200px] table-fixed border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-28 border-b border-r border-slate-200 px-3 py-4 text-left text-sm font-semibold text-slate-600">
                  Thời gian
                </th>

                {weekDays.map(({ dayOfWeek, date }) => {
                  const isToday = isSameDate(date, today);

                  return (
                    <th
                      key={dayOfWeek}
                      className={`border-b border-r border-slate-200 px-3 py-4 text-left last:border-r-0 ${
                        isToday ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-semibold ${
                            isToday ? "text-blue-700" : "text-slate-900"
                          }`}
                        >
                          {DAY_LABELS[dayOfWeek]}
                        </span>

                        {isToday && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                            Hôm nay
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs font-normal text-slate-500">
                        {formatFullDate(date)}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="border-r border-slate-200 bg-slate-50 px-3 py-4 align-top">
                  <p className="text-sm font-semibold text-slate-700">
                    Các ca dạy
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Theo giờ bắt đầu
                  </p>
                </td>

                {weekDays.map(({ dayOfWeek }) => {
                  const dayEntries = scheduleEntries.filter(
                    (entry) => entry.dayOfWeek === dayOfWeek,
                  );

                  return (
                    <td
                      key={dayOfWeek}
                      className="border-r border-slate-200 p-3 align-top last:border-r-0"
                    >
                      {dayEntries.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-10 text-center">
                          <p className="text-sm text-slate-400">
                            Không có lịch
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dayEntries.map((entry) => {
                            const attendanceStatus =
                              getScheduleAttendanceStatus(entry);

                            return (
                              <article
                                key={entry.id}
                                className="rounded-lg border border-slate-200 bg-white p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                                    <Clock3 className="h-4 w-4 shrink-0" />
                                    {entry.schedule.startTime} –{" "}
                                    {entry.schedule.endTime}
                                  </p>

                                  {renderAttendanceBadge(attendanceStatus)}
                                </div>

                                <h3
                                  className="mt-3 line-clamp-2 font-semibold text-slate-900"
                                  title={entry.classItem.name}
                                >
                                  {entry.classItem.name}
                                </h3>

                                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                  {entry.classItem.subject}
                                </p>

                                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                                  <p className="flex items-center gap-2">
                                    <Users className="h-3.5 w-3.5 shrink-0" />
                                    {entry.classItem.students.length} học sinh
                                  </p>

                                  {entry.schedule.room && (
                                    <p className="flex items-center gap-2">
                                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                                      Phòng {entry.schedule.room}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenAttendance(entry)}
                                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                  <CalendarDays className="h-4 w-4" />

                                  {attendanceStatus === "finalized"
                                    ? "Xem điểm danh"
                                    : attendanceStatus === "draft"
                                      ? "Tiếp tục điểm danh"
                                      : "Điểm danh"}
                                </button>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
