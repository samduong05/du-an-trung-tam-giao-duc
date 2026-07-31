import type {
  MaterialLink,
  MaterialStatus,
} from "../../../store/api/materialsApi";

export const getErrorMessage = (error: unknown): string | undefined => {
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

export const formatDate = (dateValue: string): string => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getFileUrl = (fileUrl: string): string => {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

  const backendOrigin = apiUrl.replace(/\/api\/v1\/?$/, "");

  return `${backendOrigin}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
};

export const formatFileSize = (size?: number): string => {
  if (!size || size <= 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const normalizeLinks = (
  links: MaterialLink[],
): MaterialLink[] | null => {
  const normalizedLinks = links
    .map((link) => ({
      title: link.title?.trim() ?? "",
      url: link.url.trim(),
    }))
    .filter((link) => link.title || link.url);

  if (normalizedLinks.some((link) => !link.url || !isValidUrl(link.url))) {
    return null;
  }

  return normalizedLinks;
};

export const getStatusBadgeClassName = (status: MaterialStatus): string => {
  return status === "published"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    : "bg-slate-100 text-slate-700 ring-slate-500/20";
};
