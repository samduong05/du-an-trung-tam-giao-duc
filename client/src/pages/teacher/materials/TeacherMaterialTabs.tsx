import { BookOpen, Files } from "lucide-react";
import type { MaterialType } from "../../../store/api/materialsApi";

interface TeacherMaterialTabsProps {
  activeTab: MaterialType;
  curriculumCount: number;
  supplementaryCount: number;
  onChange: (tab: MaterialType) => void;
}

export default function TeacherMaterialTabs({
  activeTab,
  curriculumCount,
  supplementaryCount,
  onChange,
}: TeacherMaterialTabsProps) {
  const tabs = [
    {
      id: "curriculum" as const,
      label: "Giáo trình chính thức",
      count: curriculumCount,
      icon: BookOpen,
    },
    {
      id: "supplementary" as const,
      label: "Tài liệu bổ sung",
      count: supplementaryCount,
      icon: Files,
    },
  ];

  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
