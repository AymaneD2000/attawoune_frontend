import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CreditCardIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  EmptyState,
  EntityAvatar,
  IconActionButton,
  ListLoading,
  PaginationBar,
  StatusPill,
} from '../../components/common/EntityDisplay';
import PageHeader from '../../components/common/PageHeader';
import api from '../../services/api';
import studentService from '../../services/studentService';
import { PaginatedResponse, Student } from '../../types';
import ExcelImportModal from './ExcelImportModal';
import StudentDetailModal from './StudentDetailsModal';
import StudentFormModal from './StudentFormModal';

const StudentsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const canManageUsers = ['ADMIN', 'DEAN', 'SECRETARY'].includes(currentUser?.role || '');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentYearOnly, setCurrentYearOnly] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  const getFullName = (student: Student) =>
    [student.first_name, student.last_name].filter(Boolean).join(' ').trim()
      || student.user_full_name
      || student.student_id;

  const getStatus = (status: Student['status']) => {
    const tones: Record<Student['status'], 'green' | 'blue' | 'orange' | 'red'> = {
      ACTIVE: 'green',
      GRADUATED: 'blue',
      SUSPENDED: 'orange',
      DROPPED: 'red',
    };
    return {
      tone: tones[status],
      label: t(`students.filters.${status.toLowerCase()}`, status),
    };
  };

  const handleDownloadIDCard = async (student: Student) => {
    try {
      const blob = await studentService.downloadIdCard(student.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `carte_etudiant_${student.student_id}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading ID card:', err);
      alert(t('students.errors.id_card', 'Erreur lors du téléchargement de la carte'));
    }
  };

  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) return;
    try {
      const blob = await studentService.downloadBulkIdCards(selectedIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cartes_etudiantes.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading bulk ID cards:', err);
      alert(t('students.errors.bulk_id_cards', 'Erreur lors du téléchargement groupé'));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await studentService.exportStudents({
        search: searchTerm,
        status: statusFilter || undefined,
        current_year_only: currentYearOnly,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'etudiants.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting students:', err);
      alert(t('students.errors.export', 'Erreur lors de l’exportation Excel'));
    }
  };

  const toggleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(event.target.checked ? students.map((student) => student.id) : []);
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((studentId) => studentId !== id)
      : [...current, id]);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Student>>('/students/', {
        params: {
          page: currentPage,
          search: searchTerm,
          status: statusFilter || undefined,
          current_year_only: currentYearOnly,
        },
      });
      setStudents(response.data.results || []);
      setTotalCount(response.data.count || 0);
      setSelectedIds([]);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, currentYearOnly]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openEdit = (student: Student) => {
    setStudentToEdit(student);
    setShowCreateModal(true);
  };

  const studentActions = (student: Student) => (
    <div className="flex items-center gap-1">
      <IconActionButton label={t('common.view', 'Voir les détails')} tone="blue" onClick={() => setSelectedStudent(student)}>
        <EyeIcon className="h-5 w-5" />
      </IconActionButton>
      {canManageUsers && (
        <IconActionButton label={t('common.edit', 'Modifier')} tone="slate" onClick={() => openEdit(student)}>
          <PencilSquareIcon className="h-5 w-5" />
        </IconActionButton>
      )}
      <IconActionButton label={t('students.actions.id_card', "Carte d'étudiant")} tone="green" onClick={() => handleDownloadIDCard(student)}>
        <CreditCardIcon className="h-5 w-5" />
      </IconActionButton>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('sidebar.academics', 'Scolarité')}
        title={t('students.title', 'Gestion des Étudiants')}
        description={t('students.subtitle', { count: totalCount, defaultValue: `${totalCount} étudiants au total` })}
        icon={<UsersIcon className="h-6 w-6" />}
        actions={<>
          {canManageUsers && (
            <button onClick={() => setShowImportModal(true)} className="brand-button-secondary whitespace-nowrap">
              <ArrowUpTrayIcon className="h-5 w-5 text-blue-700" />
              <span className="hidden sm:inline">{t('students.actions.import', 'Importer')}</span>
            </button>
          )}
          <button onClick={handleExport} className="brand-button-secondary whitespace-nowrap">
            <ArrowDownTrayIcon className="h-5 w-5 text-green-700" />
            <span className="hidden sm:inline">{t('students.actions.export', 'Exporter')}</span>
          </button>
          {canManageUsers && (
            <button
              onClick={() => {
                setStudentToEdit(null);
                setShowCreateModal(true);
              }}
              className="brand-button whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">{t('students.actions.add', 'Ajouter')}</span>
            </button>
          )}
        </>}
      />

      <div className="surface-panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder={t('students.search_placeholder', 'Rechercher par nom, matricule, email...')}
              className="brand-input ps-12"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="brand-input w-full lg:w-56"
          >
            <option value="">{t('students.filters.all_status', 'Tous les statuts')}</option>
            <option value="ACTIVE">{t('students.filters.active', 'Actif')}</option>
            <option value="GRADUATED">{t('students.filters.graduated', 'Diplômé')}</option>
            <option value="SUSPENDED">{t('students.filters.suspended', 'Suspendu')}</option>
            <option value="DROPPED">{t('students.filters.dropped', 'Abandonné')}</option>
          </select>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-green-200 hover:bg-green-50">
            <input
              type="checkbox"
              checked={currentYearOnly}
              onChange={(event) => {
                setCurrentYearOnly(event.target.checked);
                setCurrentPage(1);
              }}
              className="h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            {t('students.filters.current_year_only', 'Année en cours')}
          </label>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-blue-900">
            {selectedIds.length} {t('students.selection.selected', 'étudiant(s) sélectionné(s)')}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelectedIds([])} className="brand-button-secondary min-h-10">
              {t('common.cancel', 'Annuler')}
            </button>
            <button type="button" onClick={handleBulkDownload} className="brand-button min-h-10">
              <CreditCardIcon className="h-5 w-5" />
              {t('students.actions.download_cards', 'Télécharger les cartes')}
            </button>
          </div>
        </div>
      )}

      <section className="surface-panel overflow-hidden">
        {loading ? (
          <ListLoading />
        ) : students.length === 0 ? (
          <EmptyState
            title={t('students.empty.title', 'Aucun étudiant trouvé')}
            description={t('students.empty.subtitle', 'Modifiez les filtres ou ajoutez un nouvel étudiant.')}
            action={canManageUsers && (
              <button type="button" onClick={() => setShowCreateModal(true)} className="brand-button">
                <PlusIcon className="h-5 w-5" />
                {t('students.actions.add', 'Ajouter')}
              </button>
            )}
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {students.map((student) => {
                const name = getFullName(student);
                const status = getStatus(student.status);
                return (
                  <article key={student.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-4 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelection(student.id)}
                      />
                      <EntityAvatar name={name} src={student.photo} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-black text-slate-950">{name}</h3>
                            <p className="mt-0.5 text-xs font-bold text-blue-700">{student.student_id}</p>
                          </div>
                          <StatusPill tone={status.tone} dot>{status.label}</StatusPill>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-slate-400">{t('students.table.program', 'Programme')}</p>
                            <p className="mt-1 truncate font-bold text-slate-700">{student.program_name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400">{t('students.table.level', 'Niveau')}</p>
                            <p className="mt-1 truncate font-bold text-slate-700">{student.level_display || '—'}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">{studentActions(student)}</div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table>
                <thead>
                  <tr>
                    <th className="w-12 px-5 py-4 text-start">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        onChange={toggleSelectAll}
                        checked={students.length > 0 && selectedIds.length === students.length}
                      />
                    </th>
                    <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('students.table.student', 'Étudiant')}</th>
                    <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('students.table.academic', 'Parcours académique')}</th>
                    <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('students.table.enrollment', 'Inscription')}</th>
                    <th className="px-5 py-4 text-start text-xs font-black uppercase tracking-wider text-slate-500">{t('students.table.status', 'Statut')}</th>
                    <th className="px-5 py-4 text-end text-xs font-black uppercase tracking-wider text-slate-500">{t('students.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const name = getFullName(student);
                    const status = getStatus(student.status);
                    return (
                      <tr key={student.id}>
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedIds.includes(student.id)}
                            onChange={() => toggleSelection(student.id)}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-[230px] items-center gap-3">
                            <EntityAvatar name={name} src={student.photo} />
                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-950">{name}</p>
                              <p className="mt-0.5 text-xs font-bold text-blue-700">{student.student_id}</p>
                              {student.user_email && <p className="mt-1 truncate text-xs text-slate-400">{student.user_email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[240px] truncate text-sm font-bold text-slate-800">{student.program_name || '—'}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{student.level_display || '—'}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                          {student.enrollment_date
                            ? new Date(student.enrollment_date).toLocaleDateString(i18n.language)
                            : '—'}
                        </td>
                        <td className="px-5 py-4"><StatusPill tone={status.tone} dot>{status.label}</StatusPill></td>
                        <td className="px-5 py-4"><div className="flex justify-end">{studentActions(student)}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationBar
              currentPage={currentPage}
              currentCount={students.length}
              total={totalCount}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => page + 1)}
            />
          </>
        )}
      </section>

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEdit={canManageUsers ? () => {
            setSelectedStudent(null);
            openEdit(selectedStudent);
          } : undefined}
        />
      )}

      {showCreateModal && (
        <StudentFormModal
          student={studentToEdit}
          onClose={() => {
            setShowCreateModal(false);
            setStudentToEdit(null);
          }}
          onSuccess={(savedStudent) => {
            if (savedStudent?.id) {
              setStudents((current) => current.map((listedStudent) => (
                listedStudent.id === savedStudent.id
                  ? { ...listedStudent, ...savedStudent }
                  : listedStudent
              )));
            }
            fetchStudents();
            setShowCreateModal(false);
            setStudentToEdit(null);
          }}
        />
      )}

      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onRefresh={fetchStudents}
      />
    </div>
  );
};

export default StudentsPage;
