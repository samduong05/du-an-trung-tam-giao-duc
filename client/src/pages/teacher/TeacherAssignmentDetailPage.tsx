import { useState } from "react";
import TeacherAssignmentFormModal from "./TeacherAssignmentFormModal";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useGetClassByIdQuery } from "../../store/api/classesApi";

import {
  useDeleteAssignmentMutation,
  useGetAssignmentsQuery,
  useUpdateAssignmentMutation,
  type AssignmentItem,
  type AssignmentType,
} from "../../store/api/assignmentsApi";

const assignmentTypeLabels: Record<AssignmentType, string> = {
  homework: "Bài tập về nhà",
  essay: "Bài luận",
  project: "Dự án",
  classwork: "Bài tập trên lớp",
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

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const isAssignmentExpired = (dueDate: string): boolean => {
  return new Date(dueDate).getTime() < Date.now();
};

export default function TeacherAssignmentDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentItem | null>(null);
  const {
    data: classData,
    isLoading: isLoadingClass,
    error: classError,
  } = useGetClassByIdQuery(classId ?? "", {
    skip: !classId,
  });

  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    isFetching,
    error: assignmentsError,
    refetch,
  } = useGetAssignmentsQuery(
    {
      classId,
    },
    {
      skip: !classId,
    },
  );

  const [updateAssignment, { isLoading: isUpdating }] =
    useUpdateAssignmentMutation();

  const [deleteAssignment, { isLoading: isDeleting }] =
    useDeleteAssignmentMutation();

  const assignments = assignmentsData?.assignments ?? [];
  const currentClass = classData?.class;

  const handleOpenCreateModal = () => {
    setSelectedAssignment(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (assignment: AssignmentItem) => {
    setSelectedAssignment(assignment);
    setIsFormOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormOpen(false);
    setSelectedAssignment(null);
  };
  const handleTogglePublished = async (assignment: AssignmentItem) => {
    try {
      await updateAssignment({
        id: assignment._id,
        isPublished: !assignment.isPublished,
      }).unwrap();

      toast.success(
        assignment.isPublished ? "Đã ẩn bài tập" : "Đã công khai bài tập",
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error) ?? "Không thể cập nhật trạng thái bài tập",
      );
    }
  };

  const handleDelete = async (assignment: AssignmentItem) => {
    const confirmed = window.confirm(
      `Ông có chắc muốn xóa bài tập "${assignment.title}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAssignment(assignment._id).unwrap();

      toast.success("Xóa bài tập thành công");
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Xóa bài tập thất bại");
    }
  };

  if (!classId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">Không tìm thấy mã lớp học.</p>
      </div>
    );
  }

  if (isLoadingClass || isLoadingAssignments) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Đang tải danh sách bài tập...</p>
      </div>
    );
  }

  if (classError || assignmentsError || !currentClass) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-base font-semibold text-red-700">
          Không thể tải dữ liệu bài tập
        </h2>

        <p className="mt-1 text-sm text-red-600">
          Vui lòng kiểm tra lại lớp học hoặc thử tải lại.
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/teacher/assignments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách lớp
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Quản lý bài tập
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-slate-800">
              {currentClass.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {currentClass.subject}
            </p>

            {currentClass.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {currentClass.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Thêm bài tập
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Users className="h-4 w-4 text-slate-400" />
            {currentClass.students?.length ?? 0} học sinh
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <ClipboardList className="h-4 w-4 text-slate-400" />
            {assignments.length} bài tập
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Danh sách bài tập
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý nội dung, thời hạn và trạng thái công khai.
          </p>
        </div>

        {isFetching && (
          <span className="text-sm text-slate-400">Đang cập nhật...</span>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-base font-semibold text-slate-700">
            Chưa có bài tập
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tạo bài tập đầu tiên cho lớp học này.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const expired = isAssignmentExpired(assignment.dueDate);

            return (
              <article
                key={assignment._id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {assignmentTypeLabels[assignment.type]}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          assignment.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {assignment.isPublished ? "Đã công khai" : "Đang ẩn"}
                      </span>

                      {expired && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          Đã hết hạn
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-slate-800">
                      {assignment.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {assignment.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-slate-400" />
                        Hạn nộp: {formatDateTime(assignment.dueDate)}
                      </div>

                      <div>
                        Điểm tối đa:{" "}
                        <span className="font-medium text-slate-700">
                          {assignment.maxScore}
                        </span>
                      </div>

                      <div>
                        Đã nộp:{" "}
                        <span className="font-medium text-slate-700">
                          {assignment.submissionCount ??
                            assignment.submissions?.length ??
                            0}
                        </span>
                        /{currentClass.students?.length ?? 0}
                      </div>

                      <div>
                        Chờ chấm:{" "}
                        <span className="font-medium text-amber-700">
                          {assignment.pendingCount ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {assignment.allowLateSubmission && (
                        <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                          Cho phép nộp muộn
                        </span>
                      )}

                      {assignment.allowResubmission && (
                        <span className="rounded-md bg-violet-50 px-2.5 py-1 text-xs text-violet-700">
                          Cho phép nộp lại
                        </span>
                      )}

                      {assignment.attachments.length > 0 && (
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          {assignment.attachments.length} file đính kèm
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 xl:w-52 xl:flex-col">
                    <Link
                      to={`/teacher/assignments/${assignment._id}/submissions`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      <Users className="h-4 w-4" />
                      Xem bài nộp
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(assignment)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Sửa
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleTogglePublished(assignment)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {assignment.isPublished ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Ẩn bài
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Công khai
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(assignment)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <TeacherAssignmentFormModal
        isOpen={isFormOpen}
        classId={classId}
        assignment={selectedAssignment}
        onClose={handleCloseFormModal}
      />
    </div>
  );
}
