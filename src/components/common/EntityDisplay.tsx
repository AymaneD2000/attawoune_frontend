import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'slate' | 'earth';

const toneClasses: Record<Tone, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  green: 'border-green-200 bg-green-50 text-green-800',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  red: 'border-red-200 bg-red-50 text-red-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-700',
  earth: 'border-orange-200 bg-orange-50 text-brand-earth',
};

const avatarClasses: Record<'blue' | 'green' | 'orange', string> = {
  blue: 'from-blue-700 to-blue-500 ring-blue-100',
  green: 'from-green-700 to-green-500 ring-green-100',
  orange: 'from-orange-700 to-orange-500 ring-orange-100',
};

const actionClasses: Record<Tone, string> = {
  blue: 'text-blue-700 hover:bg-blue-50 hover:ring-blue-100',
  green: 'text-green-700 hover:bg-green-50 hover:ring-green-100',
  orange: 'text-orange-700 hover:bg-orange-50 hover:ring-orange-100',
  red: 'text-red-600 hover:bg-red-50 hover:ring-red-100',
  slate: 'text-slate-600 hover:bg-slate-100 hover:ring-slate-200',
  earth: 'text-brand-earth hover:bg-orange-50 hover:ring-orange-100',
};

interface EntityAvatarProps {
  name: string;
  src?: string | null;
  tone?: 'blue' | 'green' | 'orange';
  size?: 'sm' | 'md' | 'lg';
}

export const EntityAvatar: React.FC<EntityAvatarProps> = ({ name, src, tone = 'blue', size = 'md' }) => {
  const sizes = {
    sm: 'h-10 w-10 rounded-xl text-sm',
    md: 'h-12 w-12 rounded-2xl text-base',
    lg: 'h-16 w-16 rounded-2xl text-xl',
  };

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br font-black text-white shadow-md ring-4 ${avatarClasses[tone]} ${sizes[size]}`}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        (name.trim().charAt(0) || 'U').toUpperCase()
      )}
    </div>
  );
};

interface StatusPillProps {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({ children, tone = 'slate', dot = false }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${toneClasses[tone]}`}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

interface IconActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: Tone;
}

export const IconActionButton: React.FC<IconActionButtonProps> = ({ label, tone = 'slate', children, className = '', ...props }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:ring-4 disabled:cursor-not-allowed disabled:opacity-40 ${actionClasses[tone]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

interface ListLoadingProps {
  cards?: boolean;
}

export const ListLoading: React.FC<ListLoadingProps> = ({ cards = false }) => (
  <div className={`grid animate-pulse gap-4 p-5 ${cards ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
    {Array.from({ length: cards ? 6 : 5 }).map((_, index) => (
      <div key={index} className={`rounded-2xl border border-slate-100 bg-white ${cards ? 'h-52 p-5' : 'h-20 p-4'}`}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-8 ring-blue-50/60">
      <MagnifyingGlassIcon className="h-8 w-8" />
    </div>
    <h3 className="mt-6 text-lg font-black text-slate-900">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

interface PaginationBarProps {
  currentPage: number;
  currentCount: number;
  total: number;
  pageSize?: number;
  onPrevious: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  currentCount,
  total,
  pageSize = 20,
  onPrevious,
  onNext,
  nextDisabled,
}) => {
  const { t } = useTranslation();
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + currentCount - 1, total);

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm font-medium text-slate-500">
        <span className="font-black text-slate-900">{start}–{end}</span>{' '}
        {t('common.of', 'sur')} <span className="font-black text-slate-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="brand-button-secondary min-h-10 px-3"
        >
          <ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" />
          <span className="hidden sm:inline">{t('common.prev', 'Précédent')}</span>
        </button>
        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-black text-white shadow-md shadow-blue-900/10">
          {currentPage}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled ?? end >= total}
          className="brand-button-secondary min-h-10 px-3"
        >
          <span className="hidden sm:inline">{t('common.next', 'Suivant')}</span>
          <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};
