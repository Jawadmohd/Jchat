import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function SettingsSection({
  title,
  description,
  children,
  className = "",
}: SettingsSectionProps) {
  return (
    <section
      className={`mb-6 rounded-2xl border border-secondary/10 bg-tertiary p-4 md:p-5 lg:mb-0 lg:h-full ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-secondary">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}
