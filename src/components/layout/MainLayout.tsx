import React, { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bars3Icon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import Sidebar from './Sidebar';

const routeLabels: Record<string, string> = {
  dashboard: 'dashboard',
  students: 'students',
  teachers: 'teachers',
  courses: 'courses',
  grades: 'grades',
  deliberation: 'deliberation',
  scheduling: 'scheduling',
  announcements: 'announcements',
  finance: 'finance',
  faculties: 'faculties',
  departments: 'departments',
  programs: 'programs',
  classrooms: 'classrooms',
  'academic-years': 'academic-years',
  levels: 'levels',
  users: 'users',
  audit: 'audit-logs',
};

const MainLayout: React.FC = () => {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const page = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const currentSegment = segments[segments.length - 1] || 'dashboard';
    const key = routeLabels[currentSegment] || currentSegment;
    return {
      title: t(`sidebar.${key}`, key),
      section: segments.length > 1 ? t('common.workspace', 'Espace de gestion') : t('sidebar.dashboard', 'Tableau de bord'),
    };
  }, [location.pathname, t]);

  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <div className="flex min-h-screen bg-brand-canvas text-slate-900">
      <Sidebar
        mobileOpen={mobileNavigationOpen}
        onMobileClose={() => setMobileNavigationOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-green-500 to-orange-500" />
          <div className="flex h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavigationOpen(true)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
                aria-label={t('common.open_menu', 'Ouvrir le menu')}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                  {page.section}
                </p>
                <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">
                  {page.title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 md:flex">
                <CalendarDaysIcon className="h-4 w-4 text-orange-600" />
                <span className="capitalize">{formattedDate}</span>
              </div>

              <LanguageSwitcher compact />

              <div className="hidden items-center gap-3 border-s border-slate-200 ps-3 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-md shadow-blue-900/10 ring-2 ring-green-100">
                  {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                </div>
                <div className="hidden min-w-0 xl:block">
                  <p className="max-w-40 truncate text-sm font-bold text-slate-900">
                    {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {t(`admin.users.roles.${user?.role}`, user?.role || '')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="app-main app-canvas min-w-0 flex-1">
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
