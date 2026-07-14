import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions, icon }) => (
  <section className="surface-panel relative overflow-hidden p-5 sm:p-6">
    <div className="absolute inset-y-0 start-0 w-1.5 bg-gradient-to-b from-blue-600 via-green-500 to-orange-500" />
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="brand-kicker">{eyebrow}</p>}
          <h2 className="brand-title mt-1">{title}</h2>
          {description && <p className="brand-subtitle">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </section>
);

export default PageHeader;
