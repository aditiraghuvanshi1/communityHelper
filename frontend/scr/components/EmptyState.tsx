// Shared empty state — meaningful copy and an optional action, never a blank region.
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  testId = "empty-state",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D5D9CD] bg-white px-6 py-14 text-center"
      data-testid={testId}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-[#EAECE4] text-[#237A62]">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 font-heading text-base font-bold text-[#172B3A]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[#52656F]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
