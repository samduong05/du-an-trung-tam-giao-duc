import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import ScheduleConflictModal from "./ScheduleConflictModal";
import { useGetTeachersQuery } from "../../store/api/endpoints";

import {
  useCreateClassMutation,
  useUpdateClassMutation,
  type ClassItem,
  type ClassSchedule,
  type ClassStatus,
  type CreateClassInput,
  type DayOfWeek,
  type ScheduleConflictResponse,
  type UpdateClassInput,
} from "../../store/api/classesApi";

interface ClassFormModalProps {
  isOpen: boolean;
  selectedClass: ClassItem | null;
  onClose: () => void;
}

interface ClassFormState {
  name: string;
  subject: string;
  description: string;
  teacherId: string;
  status: ClassStatus;
  startedAt: string;
  endedAt: string;
}
type PendingClassSubmission =
  | {
      mode: "create";
      payload: CreateClassInput;
    }
  | {
      mode: "update";
      payload: UpdateClassInput;
    };
const DAY_OPTIONS: {
  value: DayOfWeek;
  label: string;
}[] = [
  { value: "monday", label: "Thứ 2" },
  { value: "tuesday", label: "Thứ 3" },
  { value: "wednesday", label: "Thứ 4" },
  { value: "thursday", label: "Thứ 5" },
  { value: "friday", label: "Thứ 6" },
  { value: "saturday", label: "Thứ 7" },
  { value: "sunday", label: "Chủ nhật" },
];

const STATUS_OPTIONS: {
  value: ClassStatus;
  label: string;
}[] = [
  { value: "active", label: "Đang hoạt động" },
  { value: "paused", label: "Tạm dừng" },
  { value: "completed", label: "Đã hoàn thành" },
];

const INITIAL_FORM: ClassFormState = {
  name: "",
  subject: "",
  description: "",
  teacherId: "",
  status: "active",
  startedAt: "",
  endedAt: "",
};

const createEmptySchedule = (): ClassSchedule => ({
  dayOfWeek: "monday",
  startTime: "",
  endTime: "",
  room: "",
});

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

const getScheduleConflictResponse = (
  error: unknown,
): ScheduleConflictResponse | null => {
  if (
    typeof error !== "object" ||
    error === null ||
    !("status" in error) ||
    !("data" in error)
  ) {
    return null;
  }

  const apiError = error as {
    status?: number;
    data?: Partial<ScheduleConflictResponse>;
  };

  if (
    apiError.status !== 409 ||
    apiError.data?.requiresConfirmation !== true ||
    !Array.isArray(apiError.data.conflicts)
  ) {
    return null;
  }

  return apiError.data as ScheduleConflictResponse;
};

const formatDateForInput = (date?: string): string => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
};

export default function ClassFormModal({
  isOpen,
  selectedClass,
  onClose,
}: ClassFormModalProps) {
  const { data: teachersData, isLoading: isLoadingTeachers } =
    useGetTeachersQuery();

  const [createClass, { isLoading: isCreating }] = useCreateClassMutation();

  const [updateClass, { isLoading: isUpdating }] = useUpdateClassMutation();

  const [formData, setFormData] = useState<ClassFormState>(INITIAL_FORM);

  const [schedule, setSchedule] = useState<ClassSchedule[]>([
    createEmptySchedule(),
  ]);
  const [conflictResponse, setConflictResponse] =
    useState<ScheduleConflictResponse | null>(null);

  const [pendingSubmission, setPendingSubmission] =
    useState<PendingClassSubmission | null>(null);

  const teachers = teachersData?.users ?? [];
  const isEditMode = selectedClass !== null;
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (selectedClass) {
      setFormData({
        name: selectedClass.name,
        subject: selectedClass.subject,
        description: selectedClass.description ?? "",
        teacherId: selectedClass.teacher?._id ?? "",
        status: selectedClass.status,
        startedAt: formatDateForInput(selectedClass.startedAt),
        endedAt: formatDateForInput(selectedClass.endedAt),
      });

      setSchedule(
        selectedClass.schedule.length > 0
          ? selectedClass.schedule.map((scheduleItem) => ({
              ...scheduleItem,
            }))
          : [createEmptySchedule()],
      );

      return;
    }

    setFormData(INITIAL_FORM);
    setSchedule([createEmptySchedule()]);
  }, [isOpen, selectedClass]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    setConflictResponse(null);
    setPendingSubmission(null);
    onClose();
  };

  const updateScheduleItem = (
    index: number,
    field: keyof ClassSchedule,
    value: string,
  ) => {
    setSchedule((currentSchedule) =>
      currentSchedule.map((scheduleItem, scheduleIndex) =>
        scheduleIndex === index
          ? {
              ...scheduleItem,
              [field]: value,
            }
          : scheduleItem,
      ),
    );
  };

  const addScheduleItem = () => {
    setSchedule((currentSchedule) => [
      ...currentSchedule,
      createEmptySchedule(),
    ]);
  };

  const removeScheduleItem = (index: number) => {
    setSchedule((currentSchedule) => {
      if (currentSchedule.length === 1) {
        return [createEmptySchedule()];
      }

      return currentSchedule.filter(
        (_, scheduleIndex) => scheduleIndex !== index,
      );
    });
  };

  const getValidSchedule = (): ClassSchedule[] => {
    return schedule
      .filter(
        (scheduleItem) =>
          scheduleItem.startTime.trim() && scheduleItem.endTime.trim(),
      )
      .map((scheduleItem) => ({
        dayOfWeek: scheduleItem.dayOfWeek,
        startTime: scheduleItem.startTime.trim(),
        endTime: scheduleItem.endTime.trim(),
        room: scheduleItem.room?.trim() ?? "",
      }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên lớp");
      return false;
    }

    if (!formData.subject.trim()) {
      toast.error("Vui lòng nhập môn học");
      return false;
    }

    if (!formData.teacherId) {
      toast.error("Vui lòng chọn giáo viên");
      return false;
    }

    if (
      formData.startedAt &&
      formData.endedAt &&
      new Date(formData.endedAt) < new Date(formData.startedAt)
    ) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return false;
    }

    const hasIncompleteSchedule = schedule.some(
      (scheduleItem) =>
        (scheduleItem.startTime && !scheduleItem.endTime) ||
        (!scheduleItem.startTime && scheduleItem.endTime),
    );

    if (hasIncompleteSchedule) {
      toast.error("Mỗi buổi học phải có đủ giờ bắt đầu và giờ kết thúc");
      return false;
    }

    const hasInvalidTime = schedule.some(
      (scheduleItem) =>
        scheduleItem.startTime &&
        scheduleItem.endTime &&
        scheduleItem.endTime <= scheduleItem.startTime,
    );

    if (hasInvalidTime) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu");
      return false;
    }

    return true;
  };
  const submitClassData = async (
    submission: PendingClassSubmission,
    forceSave = false,
  ) => {
    try {
      if (submission.mode === "update") {
        await updateClass({
          ...submission.payload,
          forceSave,
        }).unwrap();

        toast.success("Cập nhật lớp học thành công");
      } else {
        await createClass({
          ...submission.payload,
          forceSave,
        }).unwrap();

        toast.success("Tạo lớp học thành công");
      }

      setConflictResponse(null);
      setPendingSubmission(null);
      onClose();
    } catch (error) {
      const conflict = getScheduleConflictResponse(error);

      if (conflict) {
        setPendingSubmission(submission);
        setConflictResponse(conflict);
        return;
      }

      toast.error(
        getErrorMessage(error) ??
          (submission.mode === "update"
            ? "Không thể cập nhật lớp học"
            : "Không thể tạo lớp học"),
      );
    }
  };

  const handleConfirmConflict = async () => {
    if (!pendingSubmission) {
      return;
    }

    await submitClassData(pendingSubmission, true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const classData: CreateClassInput = {
      name: formData.name.trim(),
      subject: formData.subject.trim(),
      description: formData.description.trim(),
      teacherId: formData.teacherId,
      status: formData.status,
      startedAt: formData.startedAt || undefined,
      endedAt: formData.endedAt || undefined,
      schedule: getValidSchedule(),
    };

    if (selectedClass) {
      await submitClassData({
        mode: "update",
        payload: {
          id: selectedClass._id,
          ...classData,
        },
      });

      return;
    }

    await submitClassData({
      mode: "create",
      payload: classData,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <button
          type="button"
          aria-label="Đóng modal"
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="class-form-modal-title"
          className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[92vh]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
            <div>
              <h2
                id="class-form-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                {isEditMode ? "Chỉnh sửa lớp học" : "Thêm lớp học"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Nhập thông tin và lịch học của lớp
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="class-name"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Tên lớp <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="class-name"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ví dụ: IELTS Foundation"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="class-subject"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Môn học <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="class-subject"
                    value={formData.subject}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Tiếng Anh"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="class-teacher"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Giáo viên <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="class-teacher"
                    value={formData.teacherId}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        teacherId: event.target.value,
                      }))
                    }
                    disabled={isLoadingTeachers}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 caret-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">
                      {isLoadingTeachers
                        ? "Đang tải giáo viên..."
                        : "Chọn giáo viên"}
                    </option>

                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} — {teacher.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="class-status"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Trạng thái
                  </label>

                  <select
                    id="class-status"
                    value={formData.status}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        status: event.target.value as ClassStatus,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 caret-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {STATUS_OPTIONS.map((statusOption) => (
                      <option
                        key={statusOption.value}
                        value={statusOption.value}
                      >
                        {statusOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="class-started-at"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Ngày bắt đầu
                  </label>

                  <input
                    id="class-started-at"
                    type="date"
                    value={formData.startedAt}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        startedAt: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="class-ended-at"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Ngày kết thúc
                  </label>

                  <input
                    id="class-ended-at"
                    type="date"
                    value={formData.endedAt}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        endedAt: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="class-description"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Mô tả
                </label>

                <textarea
                  id="class-description"
                  rows={3}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Mô tả ngắn về lớp học"
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <section>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Lịch học</h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Có thể thêm nhiều buổi học trong tuần
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addScheduleItem}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm buổi
                  </button>
                </div>

                <div className="space-y-3">
                  {schedule.map((scheduleItem, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]"
                    >
                      <div>
                        <label
                          htmlFor={`schedule-day-${index}`}
                          className="mb-1 block text-xs font-medium text-slate-500 lg:hidden"
                        >
                          Thứ
                        </label>

                        <select
                          id={`schedule-day-${index}`}
                          value={scheduleItem.dayOfWeek}
                          onChange={(event) =>
                            updateScheduleItem(
                              index,
                              "dayOfWeek",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                        >
                          {DAY_OPTIONS.map((dayOption) => (
                            <option
                              key={dayOption.value}
                              value={dayOption.value}
                            >
                              {dayOption.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={`schedule-start-${index}`}
                          className="mb-1 block text-xs font-medium text-slate-500 lg:hidden"
                        >
                          Bắt đầu
                        </label>

                        <input
                          id={`schedule-start-${index}`}
                          type="time"
                          value={scheduleItem.startTime}
                          onChange={(event) =>
                            updateScheduleItem(
                              index,
                              "startTime",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`schedule-end-${index}`}
                          className="mb-1 block text-xs font-medium text-slate-500 lg:hidden"
                        >
                          Kết thúc
                        </label>

                        <input
                          id={`schedule-end-${index}`}
                          type="time"
                          value={scheduleItem.endTime}
                          onChange={(event) =>
                            updateScheduleItem(
                              index,
                              "endTime",
                              event.target.value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`schedule-room-${index}`}
                          className="mb-1 block text-xs font-medium text-slate-500 lg:hidden"
                        >
                          Phòng
                        </label>

                        <input
                          id={`schedule-room-${index}`}
                          value={scheduleItem.room ?? ""}
                          onChange={(event) =>
                            updateScheduleItem(
                              index,
                              "room",
                              event.target.value,
                            )
                          }
                          placeholder="Phòng học"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeScheduleItem(index)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        title="Xóa buổi học"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-2 sm:hidden">Xóa buổi học</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isLoadingTeachers}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {isEditMode ? "Lưu thay đổi" : "Tạo lớp học"}
              </button>
            </footer>
          </form>
        </div>
      </div>
      <ScheduleConflictModal
        isOpen={conflictResponse !== null}
        conflictResponse={conflictResponse}
        isConfirming={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setConflictResponse(null);
          }
        }}
        onConfirm={handleConfirmConflict}
      />
    </>
  );
}
