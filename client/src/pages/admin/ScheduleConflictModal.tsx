import {
  AlertTriangle,
  BookOpen,
  Loader2,
  MapPin,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type {
  DayOfWeek,
  ScheduleConflict,
  ScheduleConflictResponse,
} from "../../store/api/classesApi";

interface ScheduleConflictModalProps {
  isOpen: boolean;
  conflictResponse: ScheduleConflictResponse | null;
  isConfirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
};

const getConflictTitle = (
  conflict: ScheduleConflict,
): string => {
  switch (conflict.type) {
    case "teacher":
      return `Giáo viên ${conflict.personName || "không xác định"}`;

    case "student":
      return `Học sinh ${conflict.personName || "không xác định"}`;

    case "room":
      return `Phòng ${conflict.room || "không xác định"}`;

    default:
      return "Xung đột lịch";
  }
};

const getConflictIcon = (
  conflict: ScheduleConflict,
) => {
  switch (conflict.type) {
    case "teacher":
      return (
        <UserRound className="h-5 w-5 text-amber-600" />
      );

    case "student":
      return (
        <Users className="h-5 w-5 text-amber-600" />
      );

    case "room":
      return (
        <MapPin className="h-5 w-5 text-amber-600" />
      );
  }
};

export default function ScheduleConflictModal({
  isOpen,
  conflictResponse,
  isConfirming = false,
  onClose,
  onConfirm,
}: ScheduleConflictModalProps) {
  const navigate = useNavigate();

  if (!isOpen || !conflictResponse) {
    return null;
  }

  const handleViewConflict = (
    conflict: ScheduleConflict,
  ) => {
    if (conflict.type === "teacher" && conflict.personId) {
      navigate(
        `/admin/teachers?highlight=${conflict.personId}`,
      );
      return;
    }

    if (conflict.type === "student" && conflict.personId) {
      navigate(
        `/admin/students?highlight=${conflict.personId}`,
      );
      return;
    }

    navigate(
      `/admin/classes?highlight=${conflict.conflictingClassId}`,
    );
  };

  const getViewButtonLabel = (
    conflict: ScheduleConflict,
  ) => {
    switch (conflict.type) {
      case "teacher":
        return "Xem giáo viên";

      case "student":
        return "Xem học sinh";

      case "room":
        return "Xem lớp";

      default:
        return "Xem chi tiết";
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="Đóng cảnh báo"
        onClick={onClose}
        disabled={isConfirming}
        className="absolute inset-0 bg-black/60"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="schedule-conflict-title"
        className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-amber-200 bg-amber-50 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 rounded-full bg-amber-100 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
            </span>

            <div>
              <h2
                id="schedule-conflict-title"
                className="text-lg font-bold text-slate-900"
              >
                Phát hiện {conflictResponse.conflictCount} xung
                đột lịch
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Kiểm tra các xung đột.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            aria-label="Đóng"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/70 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
          {conflictResponse.conflicts.map(
            (conflict, index) => (
              <article
                key={conflict.id}
                className="rounded-xl border border-amber-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5">
                    {getConflictIcon(conflict)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {index + 1}. {getConflictTitle(conflict)}
                    </h3>

                    {conflict.personEmail && (
                      <p className="mt-1 break-all text-sm text-slate-500">
                        Email: {conflict.personEmail}
                      </p>
                    )}

                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                        <div>
                          <p className="font-medium text-slate-800">
                            {conflict.conflictingClassName}
                          </p>

                          <p className="mt-1 text-slate-600">
                            {DAY_LABELS[conflict.dayOfWeek]} ·{" "}
                            {conflict.startTime}–
                            {conflict.endTime}
                          </p>

                          {conflict.room && (
                            <p className="mt-1 text-slate-600">
                              Phòng: {conflict.room}
                            </p>
                          )}

                          {conflict.type !== "teacher" &&
                            conflict.teacherName && (
                              <p className="mt-1 text-slate-600">
                                Giáo viên:{" "}
                                {conflict.teacherName}
                              </p>
                            )}

                          {conflict.type !== "teacher" &&
                            conflict.teacherEmail && (
                              <p className="mt-1 break-all text-slate-600">
                                Email giáo viên:{" "}
                                {conflict.teacherEmail}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleViewConflict(conflict)
                      }
                      className="mt-3 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      {getViewButtonLabel(conflict)}
                    </button>
                  </div>
                </div>
              </article>
            ),
          )}
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Quay lại chỉnh sửa
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConfirming && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Vẫn lưu
          </button>
        </footer>
      </div>
    </div>
  );
}