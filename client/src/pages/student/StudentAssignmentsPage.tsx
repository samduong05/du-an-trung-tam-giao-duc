import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { useGetMyClassByIdQuery } from "../../store/api/classesApi";

import {
  type AssignmentItem,
  type AssignmentType,
  type SubmissionStatus,
  useGetAssignmentsQuery,
} from "../../store/api/assignmentsApi";

const assignmentTypeLabels: Record<AssignmentType, string> = {
  homework: "Bài tập về nhà",
  classwork: "Bài tập trên lớp",
  essay: "Bài luận",
  project: "Dự án",
};

const submissionStatusLabels: Record<SubmissionStatus, string> = {
  submitted: "Đã nộp",
  late: "Nộp muộn",
  graded: "Đã chấm",
  returned: "Đã trả bài",
};

const submissionStatusClassNames: Record<SubmissionStatus, string> = {
  submitted: "bg-blue-50 text-blue-700",
  late: "bg-amber-50 text-amber-700",
  graded: "bg-emerald-50 text-emerald-700",
  returned: "bg-violet-50 text-violet-700",
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const isExpired = (dueDate: string): boolean => {
  return new Date(dueDate).getTime() < Date.now();
};

const getAssignmentStatus = (assignment: AssignmentItem) => {
  if (assignment.mySubmission) {
    return {
      label: submissionStatusLabels[assignment.mySubmission.status],
      className:
        submissionStatusClassNames[assignment.mySubmission.status],
    };
  }

  if (isExpired(assignment.dueDate)) {
    return {
      label: "Đã hết hạn",
      className: "bg-red-50 text-red-700",
    };
  }

  return {
    label: "Chưa nộp",
    className: "bg-slate-100 text-slate-600",
  };
};

export default function StudentAssignmentsPage() {
  const { classId } = useParams<{ classId: string }>();

  const {
    data: classData,
    isLoading: isLoadingClass,
    isError: isClassError,
  } = useGetMyClassByIdQuery(classId ?? "", {
    skip: !classId,
  });

  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    isFetching,
    isError: isAssignmentsError,
    refetch,
  } = useGetAssignmentsQuery(
    {
      classId,
    },
    {
      skip: !classId,
    },
  );

  if (!classId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">
          Không tìm thấy mã lớp học.
        </p>
      </div>
    );
  }

  if (isLoadingClass || isLoadingAssignments) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-slate-500">
          Đang tải danh sách bài tập...
        </p>
      </div>
    );
  }

  if (
    isClassError ||
    isAssignmentsError ||
    !classData?.class
  ) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h1 className="font-semibold text-red-700">
          Không thể tải bài tập
        </h1>

        <p className="mt-1 text-sm text-red-600">
          Lớp không tồn tại, bạn không thuộc lớp hoặc đã xảy ra lỗi.
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    );
  }

  const classItem = classData.class;
  const assignments = assignmentsData?.assignments ?? [];

  return (
    <div className="space-y-6">
      <Link
        to={`/student/classes/${classId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại chi tiết lớp
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
            <ClipboardList className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Bài tập của lớp
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {classItem.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {classItem.subject}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            Có{" "}
            <span className="font-semibold text-slate-900">
              {assignments.length}
            </span>{" "}
            bài tập đã được giáo viên công khai.
            {isFetching ? " Đang cập nhật..." : ""}
          </p>
        </div>
      </section>

      {assignments.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-800">
            Chưa có bài tập
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Giáo viên chưa công khai bài tập nào cho lớp này.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {assignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const expired = isExpired(assignment.dueDate);

            return (
              <article
                key={assignment._id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {assignmentTypeLabels[assignment.type]}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>

                      {assignment.allowLateSubmission && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Cho phép nộp muộn
                        </span>
                      )}

                      {assignment.allowResubmission && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                          Cho phép nộp lại
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-lg font-bold text-slate-900">
                      {assignment.title}
                    </h2>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {assignment.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-slate-400" />
                        Hạn nộp: {formatDateTime(assignment.dueDate)}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-slate-400" />
                        Điểm tối đa: {assignment.maxScore}
                      </span>

                      {assignment.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          {assignment.attachments.length} file đính kèm
                        </span>
                      )}
                    </div>

                    {assignment.mySubmission && (
                      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                          <span className="inline-flex items-center gap-2 text-slate-600">
                            <Clock3 className="h-4 w-4 text-slate-400" />
                            Đã nộp:{" "}
                            {formatDateTime(
                              assignment.mySubmission.submittedAt,
                            )}
                          </span>

                          {assignment.mySubmission.score !== null && (
                            <span className="font-semibold text-emerald-700">
                              Điểm: {assignment.mySubmission.score}/
                              {assignment.maxScore}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {!assignment.mySubmission &&
                      expired &&
                      !assignment.allowLateSubmission && (
                        <p className="mt-4 text-sm font-medium text-red-600">
                          Bài tập đã hết hạn và không cho phép nộp muộn.
                        </p>
                      )}
                  </div>

                  <Link
                    to={`/student/classes/${classId}/assignments/${assignment._id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Xem chi tiết
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}