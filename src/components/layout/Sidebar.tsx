import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  HomeIcon,
  MapPinIcon,
  MegaphoneIcon,
  ScaleIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.jpg';

type NavigationIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface NavItem {
  key: string;
  path: string;
  icon: NavigationIcon;
  roles?: string[];
}

interface NavGroup {
  key: string;
  icon: NavigationIcon;
  items: NavItem[];
  roles?: string[];
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

type NavEntry = NavItem | NavGroup;

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['academics', 'planning', 'administration']);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navigation = useMemo<NavEntry[]>(() => [
    { key: 'dashboard', path: '/dashboard', icon: HomeIcon },
    {
      key: 'academics',
      icon: AcademicCapIcon,
      items: [
        { key: 'students', path: '/students', icon: UsersIcon, roles: ['ADMIN', 'DEAN', 'SECRETARY', 'ACCOUNTANT'] },
        { key: 'teachers', path: '/teachers', icon: UserGroupIcon, roles: ['ADMIN', 'DEAN', 'ACCOUNTANT', 'SECRETARY'] },
        { key: 'courses', path: '/academics/courses', icon: BookOpenIcon, roles: ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT'] },
        { key: 'grades', path: '/academics/grades', icon: ClipboardDocumentCheckIcon, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'DEAN'] },
        { key: 'deliberation', path: '/academics/deliberation', icon: ScaleIcon, roles: ['ADMIN', 'DEAN'] },
      ],
    },
    {
      key: 'planning',
      icon: CalendarDaysIcon,
      roles: ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT'],
      items: [
        { key: 'scheduling', path: '/scheduling', icon: ClockIcon, roles: ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT'] },
        { key: 'announcements', path: '/announcements', icon: MegaphoneIcon, roles: ['ADMIN', 'DEAN', 'TEACHER', 'STUDENT'] },
      ],
    },
    { key: 'finance', path: '/finance', icon: BanknotesIcon, roles: ['ADMIN', 'ACCOUNTANT', 'SECRETARY', 'DEAN'] },
    {
      key: 'administration',
      icon: BuildingLibraryIcon,
      roles: ['ADMIN'],
      items: [
        { key: 'faculties', path: '/university/faculties', icon: BuildingOffice2Icon, roles: ['ADMIN'] },
        { key: 'departments', path: '/university/departments', icon: Squares2X2Icon, roles: ['ADMIN'] },
        { key: 'programs', path: '/university/programs', icon: AcademicCapIcon, roles: ['ADMIN', 'DEAN'] },
        { key: 'classrooms', path: '/university/classrooms', icon: MapPinIcon, roles: ['ADMIN', 'DEAN'] },
        { key: 'academic-years', path: '/university/academic-years', icon: CalendarDaysIcon, roles: ['ADMIN'] },
        { key: 'levels', path: '/university/levels', icon: ChartBarSquareIcon, roles: ['ADMIN'] },
        { key: 'audit-logs', path: '/admin/audit', icon: ShieldCheckIcon, roles: ['ADMIN'] },
      ],
    },
    { key: 'users', path: '/admin/users', icon: UserGroupIcon, roles: ['ADMIN'] },
  ], []);

  useEffect(() => {
    navigation.forEach((entry) => {
      if ('items' in entry && entry.items.some((item) => location.pathname.startsWith(item.path))) {
        setOpenGroups((current) => current.includes(entry.key) ? current : [...current, entry.key]);
      }
    });
    onMobileClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasRole = (roles?: string[]) => !roles || (!!user && roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleGroup = (groupKey: string) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((current) => current.includes(groupKey) ? current : [...current, groupKey]);
      return;
    }
    setOpenGroups((current) => current.includes(groupKey)
      ? current.filter((key) => key !== groupKey)
      : [...current, groupKey]);
  };

  const renderNavItem = (item: NavItem, nested = false) => {
    if (!hasRole(item.roles)) return null;

    const isActive = location.pathname === item.path
      || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
    const Icon = item.icon;
    const label = t(`sidebar.${item.key}`, item.key);

    return (
      <Link
        key={item.path}
        to={item.path}
        title={collapsed ? label : undefined}
        className={`group relative mx-2 flex min-h-11 items-center rounded-xl transition-all duration-200 ${nested && !collapsed ? 'ps-4' : ''} ${collapsed ? 'justify-center px-2' : 'px-3'} ${
          isActive
            ? 'bg-white text-blue-800 shadow-md shadow-blue-950/15'
            : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-blue-100/75 group-hover:text-white'
        }`}>
          <Icon className="h-5 w-5" />
        </span>
        {!collapsed && <span className="ms-2.5 truncate text-sm font-semibold">{label}</span>}
        {isActive && !collapsed && <span className="ms-auto h-2 w-2 rounded-full bg-green-500 ring-4 ring-green-100" />}

        {collapsed && (
          <span className="pointer-events-none absolute start-full top-1/2 z-[70] ms-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition group-hover:opacity-100">
            {label}
          </span>
        )}
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    if (!hasRole(group.roles)) return null;

    const isOpen = openGroups.includes(group.key);
    const hasActiveItem = group.items.some((item) => location.pathname.startsWith(item.path));
    const Icon = group.icon;
    const label = t(`sidebar.${group.key}`, group.key);

    return (
      <div key={group.key} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleGroup(group.key)}
          title={collapsed ? label : undefined}
          className={`mx-2 flex min-h-11 w-[calc(100%-1rem)] items-center rounded-xl px-3 text-start transition ${
            hasActiveItem ? 'text-white' : 'text-blue-100/60 hover:bg-white/10 hover:text-white'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <Icon className={`h-5 w-5 shrink-0 ${hasActiveItem ? 'text-orange-400' : ''}`} />
          {!collapsed && (
            <>
              <span className="ms-3 truncate text-xs font-bold uppercase tracking-[0.13em]">{label}</span>
              <ChevronDownIcon className={`ms-auto h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {!collapsed && isOpen && (
          <div className="space-y-1 border-s border-white/10 ps-1">
            {group.items.map((item) => renderNavItem(item, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        aria-label={t('common.close_menu', 'Fermer le menu')}
        onClick={onMobileClose}
        className={`fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside className={`app-sidebar fixed inset-y-0 start-0 z-50 flex h-screen w-[18rem] shrink-0 flex-col overflow-hidden bg-blue-950 text-white shadow-floating transition-all duration-300 lg:sticky lg:top-0 lg:z-50 ${
        collapsed ? 'lg:w-24' : 'lg:w-[18rem]'
      } ${mobileOpen ? 'app-sidebar-open' : ''}`}>
        <div className="h-1.5 shrink-0 bg-gradient-to-r from-orange-500 via-green-500 to-blue-400" />

        <div className="flex min-h-[5.25rem] items-center gap-3 border-b border-white/10 px-4">
          <img
            src={logo}
            alt="Université Privée Attawoune"
            className="h-12 w-12 shrink-0 rounded-2xl border-2 border-white/80 bg-white object-cover p-0.5 shadow-lg"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-green-300">Université Privée</p>
              <p className="truncate text-lg font-extrabold tracking-tight text-white">Attawoune</p>
            </div>
          )}

          <button
            type="button"
            onClick={onMobileClose}
            className="ms-auto inline-flex h-10 w-10 items-center justify-center rounded-xl text-blue-100 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label={t('common.close', 'Fermer')}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-1 py-4">
          {navigation.map((entry) => 'items' in entry ? renderNavGroup(entry) : renderNavItem(entry))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={`rounded-2xl bg-white/8 p-2 ${collapsed ? 'flex justify-center' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 text-sm font-extrabold text-white shadow-md ring-2 ring-white/15">
                {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </div>

              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}
                    </p>
                    <p className="truncate text-xs font-medium text-blue-100/60">
                      {t(`admin.users.roles.${user?.role}`, user?.role || '')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-blue-100/70 transition hover:bg-orange-500/15 hover:text-orange-300"
                    title={t('common.logout', 'Déconnexion')}
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mt-2 hidden min-h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-blue-100/60 transition hover:bg-white/10 hover:text-white lg:flex"
          >
            {collapsed ? <ChevronDoubleRightIcon className="h-4 w-4 rtl:rotate-180" /> : <ChevronDoubleLeftIcon className="h-4 w-4 rtl:rotate-180" />}
            {!collapsed && t('common.collapse', 'Réduire')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
