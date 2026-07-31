import { FileText, Plus } from "lucide-react";

import type {
  MaterialItem,
  MaterialType,
} from "../../../store/api/materialsApi";
import MaterialCard from "./MaterialCard";

interface MaterialListProps {
  materials: MaterialItem[];
  materialType: MaterialType;
  isLoading: boolean;
  canManage: boolean;
  isDeleting?: boolean;
  onCreate?: () => void;
  onEdit?: (material: MaterialItem) => void;
  onDelete?: (material: MaterialItem) => void;
}

export default function MaterialList({
  materials,
  materialType,
  isLoading,
  canManage,
  isDeleting,
  onCreate,
  onEdit,
  onDelete,
}: MaterialListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="h-64 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (materials.length === 0) {
    const isCurriculum = materialType === "curriculum";

    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-400" />

        <h2 className="mt-4 font-semibold text-slate-900">
          {isCurriculum
            ? "Chưa có giáo trình chính thức"
            : "Chưa có tài liệu bổ sung"}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {isCurriculum
            ? "Admin chưa gửi giáo trình chính thức cho lớp này."
            : "Giáo viên chưa đăng tài liệu bổ sung cho lớp học."}
        </p>

        {canManage && (
          <button
            type="button"
            onClick={onCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Thêm tài liệu
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {materials.map((material) => (
        <MaterialCard
          key={material._id}
          material={material}
          canManage={canManage}
          isDeleting={isDeleting}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}
