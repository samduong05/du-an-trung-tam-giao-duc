import {
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileText,
  Link2,
  Pencil,
  Trash2,
} from "lucide-react";

import type { MaterialItem } from "../../../store/api/materialsApi";
import {
  formatDate,
  getFileUrl,
  getStatusBadgeClassName,
} from "./material.utils";

interface MaterialCardProps {
  material: MaterialItem;
  canManage: boolean;
  isDeleting?: boolean;
  onEdit?: (material: MaterialItem) => void;
  onDelete?: (material: MaterialItem) => void;
}

export default function MaterialCard({
  material,
  canManage,
  isDeleting = false,
  onEdit,
  onDelete,
}: MaterialCardProps) {
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="line-clamp-2 font-semibold text-slate-900"
            title={material.title}
          >
            {material.title}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {formatDate(material.createdAt)}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            Đăng bởi {material.createdBy?.name ?? "Không xác định"}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusBadgeClassName(
            material.status,
          )}`}
        >
          {material.status === "published" ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}

          {material.status === "published" ? "Công khai" : "Đang ẩn"}
        </span>
      </div>

      <p className="mt-4 line-clamp-4 flex-1 text-sm leading-6 text-slate-600">
        {material.description || "Không có mô tả."}
      </p>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 text-slate-500">
            <Link2 className="h-4 w-4" />
            Liên kết
          </span>
          <span className="font-semibold text-slate-700">
            {material.links.length}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 text-slate-500">
            <File className="h-4 w-4" />
            Tệp đính kèm
          </span>
          <span className="font-semibold text-slate-700">
            {material.files.length}
          </span>
        </div>
      </div>

      {(material.links.length > 0 || material.files.length > 0) && (
        <div className="mt-4 space-y-2">
          {material.links.slice(0, 2).map((link, index) => (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="truncate">{link.title || link.url}</span>
            </a>
          ))}

          {material.files.slice(0, 2).map((file, index) => (
            <a
              key={`${file.url}-${index}`}
              href={getFileUrl(file.url)}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{file.name}</span>
            </a>
          ))}
        </div>
      )}

      {canManage && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(material)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(material)}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </button>
        </div>
      )}
    </article>
  );
}
