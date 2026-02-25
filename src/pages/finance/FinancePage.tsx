import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import financeService, { DashboardData, Salary, Expense } from '../../services/financeService';
import universityService from '../../services/universityService';
import api from '../../services/api';
import { TuitionPayment, Level, Semester } from '../../types';
import {
  UserGroupIcon,
  CreditCardIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import SearchableSelect, { Option } from '../../components/common/SearchableSelect';
import PaymentExcelImportModal from './PaymentExcelImportModal';
import FinanceExcelImportModal from './FinanceExcelImportModal';

const FinancePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'salaries' | 'expenses' | 'recovery'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [currentYearOnly, setCurrentYearOnly] = useState(true);
  const [showPaymentFilters, setShowPaymentFilters] = useState(false);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  // Reset filters when changing tabs
  useEffect(() => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPaymentMethodFilter('');
    setPaymentStatusFilter('');
  }, [activeTab]);

  // Data States
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [payments, setPayments] = useState<TuitionPayment[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [studentStatement, setStudentStatement] = useState<any>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [studentProgramLevels, setStudentProgramLevels] = useState<{id: number, display_name: string}[]>([]);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSalaryImportModal, setShowSalaryImportModal] = useState(false);
  const [showExpenseImportModal, setShowExpenseImportModal] = useState(false);

  // Forms
  const [expenseForm, setExpenseForm] = useState({
    category: 'OTHER',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [salaryForm, setSalaryForm] = useState({
    employee: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    base_salary: '',
    bonuses: '0',
    deductions: '0',
    remarks: ''
  });

  useEffect(() => {
    if (dashboardData?.current_year) {
      const year = parseInt(dashboardData.current_year.split('-')[0]);
      setSalaryForm(prev => ({
        ...prev,
        year: year
      }));
    }
  }, [dashboardData]);

  const [paymentForm, setPaymentForm] = useState({
    student: '',
    amount: '',
    payment_method: 'CASH',
    academic_year: '', 
    level: '',
    semester: '',
    reference: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { [key: string]: any } = {};
      if (searchTerm) params.search = searchTerm;
      if (startDate) params.date_after = startDate;
      if (endDate) params.date_before = endDate;
      if (minAmount) params.amount_min = minAmount;
      if (maxAmount) params.amount_max = maxAmount;
      if (currentYearOnly) params.current_year_only = currentYearOnly;
      if (paymentMethodFilter) params.payment_method = paymentMethodFilter;
      if (paymentStatusFilter) params.status = paymentStatusFilter;

      if (activeTab === 'dashboard') {
        const data = await financeService.getDashboardStats();
        setDashboardData(data);
      } else if (activeTab === 'payments') {
        const data = await financeService.getPayments(params);
        setPayments(data.results);

        if (levels.length === 0) {
            const levelsRes = await universityService.getLevels();
            setLevels(levelsRes.results || []);
        }
        if (semesters.length === 0) {
            const semestersRes = await universityService.getSemesters();
            setSemesters(semestersRes.results || []);
        }
      } else if (activeTab === 'salaries') {
        const data = await financeService.getSalaries(params);
        setSalaries(data.results);

        if (teachers.length === 0) {
          const teacherRes = await universityService.getTeachers();
          setTeachers(teacherRes.results || []);
        }
      } else if (activeTab === 'expenses') {
        const data = await financeService.getExpenses(params);
        setExpenses(data.results);
      } else if (activeTab === 'recovery') {
        const data = await financeService.getOutstandingBalances(params);
        setOutstandingBalances(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, startDate, endDate, minAmount, maxAmount, currentYearOnly, paymentMethodFilter, paymentStatusFilter, levels.length, semesters.length, teachers.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.createSalary({
        ...salaryForm,
        employee: parseInt(salaryForm.employee),
        month: parseInt(salaryForm.month as any),
        year: parseInt(salaryForm.year as any),
        base_salary: parseFloat(salaryForm.base_salary),
        bonuses: parseFloat(salaryForm.bonuses),
        deductions: parseFloat(salaryForm.deductions)
      });
      setShowSalaryModal(false);
      setSalaryForm({
        employee: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        base_salary: '',
        bonuses: '0',
        deductions: '0',
        remarks: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating salary:', error);
      window.alert(t('finance.errors.salary_creation', "Erreur lors de la création du salaire."));
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.createExpense(expenseForm);
      setShowExpenseModal(false);
      setExpenseForm({ category: 'OTHER', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        student: parseInt(paymentForm.student),
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method
      };
      if (paymentForm.academic_year) payload.academic_year = parseInt(paymentForm.academic_year);
      if (paymentForm.level) payload.level = parseInt(paymentForm.level);
      if (paymentForm.semester) payload.semester = parseInt(paymentForm.semester);
      if (paymentForm.reference) payload.reference = paymentForm.reference;

      await financeService.createPayment(payload);
      setShowPaymentModal(false);
      setPaymentForm({ student: '', amount: '', payment_method: 'CASH', academic_year: '', level: '', semester: '', reference: '' });
      fetchData();
    } catch (error) {
      console.error("Error creating payment", error);
      window.alert(t('finance.errors.payment_error', "Une erreur est survenue lors du paiement. Veuillez réessayer."));
    }
  };

  const handleSearchStudents = async (query: string): Promise<Option[]> => {
    try {
      const response = await api.get(`/students/?search=${query}`);
      return (response.data.results || []).map((s: any) => ({
        id: s.id,
        label: s.user_name || `${s.first_name} ${s.last_name}`,
        subLabel: s.student_id
      }));
    } catch (error) {
      console.error("Error searching students", error);
      return [];
    }
  };

  const handleStudentChange = async (studentId: string | number) => {
    setPaymentForm(prev => ({ ...prev, student: studentId.toString() }));
    if (studentId) {
      try {
        const response = await api.get(`/students/${studentId}/`);
        const studentDetail = response.data;
        if (studentDetail.current_level) {
          setPaymentForm(prev => ({ ...prev, level: studentDetail.current_level.toString() }));
        }
        // Store program-specific levels for filtering the dropdown
        if (studentDetail.program_levels) {
          setStudentProgramLevels(studentDetail.program_levels);
        } else {
          setStudentProgramLevels([]);
        }
      } catch (error) {
        console.error("Error fetching student details", error);
      }
    } else {
      setPaymentForm(prev => ({ ...prev, level: '' }));
      setStudentProgramLevels([]);
    }
  };

  useEffect(() => {
    if (paymentForm.student && showPaymentModal) {
      financeService.getStudentStatement(paymentForm.student).then(data => {
        setStudentStatement(data);
      }).catch(err => {
        console.error("Error fetching statement", err);
        setStudentStatement(null);
      });
    } else {
      setStudentStatement(null);
    }
  }, [paymentForm.student, showPaymentModal]);

  const handlePaySalary = async (id: number) => {
    try {
      await financeService.paySalary(id);
      fetchData();
    } catch (error) {
      console.error('Error paying salary:', error);
    }
  };

  const handleApprovePayment = async (id: number) => {
    try {
      if (window.confirm(t('common.confirm.validate', "Voulez-vous vraiment valider ce paiement ?"))) {
        await financeService.approvePayment(id);
        fetchData();
      }
    } catch (error) {
      console.error("Error approving payment", error);
      window.alert(t('common.errors.validation_error', "Erreur lors de la validation."));
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {t(`finance.salary_status.${status}`, status)}
      </span>
    );
  };

  // Helper render functions
  const renderFilters = (showDate = true, showAmount = true) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Search */}
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search', 'Rechercher')}</label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={t('common.search_placeholder', 'Rechercher...')}
            />
          </div>
        </div>

        {/* Date Range */}
        {showDate && (
          <div className="flex gap-2 w-full md:w-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.date_start', 'Début')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.date_end', 'Fin')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        )}

        {/* Amount Range */}
        {showAmount && (
          <div className="flex gap-2 w-full md:w-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.min_amount', 'Min')}</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.max_amount', 'Max')}</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="∞"
              />
            </div>
          </div>
        )}

        {/* Reset */}
        <button
          onClick={() => {
            setSearchTerm('');
            setStartDate('');
            setEndDate('');
            setMinAmount('');
            setMaxAmount('');
            setCurrentYearOnly(true);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <XMarkIcon className="h-5 w-5 mr-1" />
          {t('common.reset', 'Réinitialiser')}
        </button>
      </div>
      <div className="mt-4 flex items-center space-x-2">
            <input
              type="checkbox"
              id="currentYearOnly"
              checked={currentYearOnly}
              onChange={(e) => setCurrentYearOnly(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-5 w-5"
            />
            <label htmlFor="currentYearOnly" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              {t('finance.filters.current_year_only', 'Année en cours seulement')}
            </label>
        </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-400">{t('finance.dashboard.annual')}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.collected_revenue')}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.total_tuition_collected || 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-400">{t('finance.dashboard.annual')}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.total_expenses')}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.total_expenses || 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.expected_revenue')}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(Number(dashboardData?.total_tuition_collected || 0) + Number(dashboardData?.outstanding_balances || 0))}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.salaries_paid')}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.total_salaries_paid || 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.outstanding')}</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(dashboardData?.outstanding_balances || 0)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('finance.dashboard.financial_balance')}</h3>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">{t('finance.dashboard.net_balance')}</p>
            <p className={`text-3xl font-bold ${dashboardData?.net_balance && dashboardData.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(dashboardData?.net_balance || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">{t('finance.payments.title')}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              try {
                const blob = await financeService.exportPayments();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'paiements.xlsx');
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (error) {
                console.error('Export error:', error);
              }
            }}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            {t('finance.payments.export', 'Exporter')}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
            {t('finance.payments.import', 'Importer')}
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('finance.payments.new')}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('finance.payments.search_placeholder', 'Rechercher par référence, nom, matricule...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowPaymentFilters(!showPaymentFilters)}
            className={`flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showPaymentFilters || paymentMethodFilter || paymentStatusFilter || startDate || endDate || minAmount || maxAmount
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            {t('finance.payments.filters', 'Filtres')}
          </button>
        </div>

        {showPaymentFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('finance.payments.filter.date_from', 'Date début')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('finance.payments.filter.date_to', 'Date fin')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('finance.payments.filter.method', 'Méthode')}</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">{t('common.all', 'Tous')}</option>
                <option value="CASH">{t('finance.payment_methods.CASH', 'Espèces')}</option>
                <option value="BANK_TRANSFER">{t('finance.payment_methods.BANK_TRANSFER', 'Virement')}</option>
                <option value="MOBILE_MONEY">{t('finance.payment_methods.MOBILE_MONEY', 'Mobile Money')}</option>
                <option value="CHECK">{t('finance.payment_methods.CHECK', 'Chèque')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('finance.payments.filter.status', 'Statut')}</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">{t('common.all', 'Tous')}</option>
                <option value="COMPLETED">{t('finance.status.COMPLETED', 'Complété')}</option>
                <option value="PENDING">{t('finance.status.PENDING', 'En attente')}</option>
                <option value="FAILED">{t('finance.status.FAILED', 'Échoué')}</option>
                <option value="REFUNDED">{t('finance.status.REFUNDED', 'Remboursé')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('finance.payments.filter.min_amount', 'Montant min')}</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('finance.payments.filter.max_amount', 'Montant max')}</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="∞"
                className="w-full border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                  setMinAmount('');
                  setMaxAmount('');
                  setPaymentMethodFilter('');
                  setPaymentStatusFilter('');
                }}
                className="w-full px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {t('common.reset', 'Réinitialiser')}
              </button>
            </div>
          </div>
        )}
      </div>


      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.reference')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.student')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.level_semester')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.amount')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.method')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.status')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.payments.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  {t('finance.empty.payments')}
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.student_name}</div>
                    <div className="text-sm text-gray-500">{payment.student_matricule}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.level_name ? `${payment.level_name}` : '-'}
                    {payment.semester_name ? ` / ${payment.semester_name}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {t(`finance.payment_methods.${payment.payment_method}`, payment.payment_method_display)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.payment_date}</div>
                    <div className="text-xs text-gray-400">
                      {(payment as any).created_at ? new Date((payment as any).created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {payment.status === 'PENDING' && (
                      <button
                        onClick={() => handleApprovePayment(payment.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {t('common.actions.validate', 'Valider')}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSalaries = () => {
    const filteredSalaries = salaries.filter(salary => {
      const matchesSearch = searchTerm === '' || 
        salary.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salary.status.toLowerCase().includes(searchTerm.toLowerCase());

      const salaryDate = new Date(salary.year, salary.month - 1, 1);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      let matchesDate = true;
      if (start) matchesDate = matchesDate && salaryDate >= start;
      if (end) matchesDate = matchesDate && salaryDate <= end;

      const amount = parseFloat(salary.net_salary);
      const min = minAmount ? parseFloat(minAmount) : null;
      const max = maxAmount ? parseFloat(maxAmount) : null;

      let matchesAmount = true;
      if (min !== null) matchesAmount = matchesAmount && amount >= min;
      if (max !== null) matchesAmount = matchesAmount && amount <= max;

      return matchesSearch && matchesDate && matchesAmount;
    });

    return (
    <div className="space-y-6">
      {renderFilters(true, true)}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">{t('finance.salaries.title')}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                try {
                  const blob = await financeService.exportSalaries();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'salaires.xlsx');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (error) { console.error('Export error:', error); }
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              {t('finance.salaries.export', 'Exporter')}
            </button>
            <button
              onClick={() => setShowSalaryImportModal(true)}
              className="flex items-center px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
            >
              <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
              {t('finance.salaries.import', 'Importer')}
            </button>
            <button
              onClick={() => setShowSalaryModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('finance.salaries.new')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.salaries.table.employee')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.salaries.table.period')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.salaries.table.base')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.salaries.table.bonuses')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.salaries.table.deductions')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.salaries.table.net')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status', 'Statut')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {t('finance.empty.salaries')}
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{salary.employee_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{salary.month}/{salary.year}</div>
                      <div className="text-xs text-gray-400">
                        {(salary as any).created_at ? new Date((salary as any).created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(salary.base_salary)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">+{formatCurrency(salary.bonuses)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">-{formatCurrency(salary.deductions)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">{formatCurrency(salary.net_salary)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{getStatusBadge(salary.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {salary.status === 'PENDING' && (
                        <button
                          onClick={() => handlePaySalary(salary.id)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {t('common.actions.pay', 'Payer')}
                        </button>
                      )}
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  const renderExpenses = () => {
    const filteredExpenses = expenses.filter(expense => {
      const matchesSearch = searchTerm === '' || 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());

      const expenseDate = new Date(expense.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      let matchesDate = true;
      if (start) matchesDate = matchesDate && expenseDate >= start;
      if (end) matchesDate = matchesDate && expenseDate <= end;

      const amount = parseFloat(expense.amount);
      const min = minAmount ? parseFloat(minAmount) : null;
      const max = maxAmount ? parseFloat(maxAmount) : null;

      let matchesAmount = true;
      if (min !== null) matchesAmount = matchesAmount && amount >= min;
      if (max !== null) matchesAmount = matchesAmount && amount <= max;

      return matchesSearch && matchesDate && matchesAmount;
    });

    return (
    <div className="space-y-6">
      {renderFilters(true, true)}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">{t('finance.expenses.title')}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                try {
                  const blob = await financeService.exportExpenses();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'depenses.xlsx');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (error) { console.error('Export error:', error); }
              }}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              {t('finance.expenses.export', 'Exporter')}
            </button>
            <button
              onClick={() => setShowExpenseImportModal(true)}
              className="flex items-center px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
            >
              <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
              {t('finance.expenses.import', 'Importer')}
            </button>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('finance.expenses.new')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.expenses.table.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.expenses.table.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.expenses.table.description')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.expenses.table.amount')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {t('finance.empty.expenses')}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{expense.date}</div>
                      <div className="text-xs text-gray-400">
                        {(expense as any).created_at ? new Date((expense as any).created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {t(`finance.expense_categories.${expense.category}`, expense.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  const renderRecovery = () => {
    const filteredBalances = outstandingBalances.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student_matricule.toLowerCase().includes(searchTerm.toLowerCase());

      const amount = parseFloat(item.balance);
      const min = minAmount ? parseFloat(minAmount) : null;
      const max = maxAmount ? parseFloat(maxAmount) : null;

      let matchesAmount = true;
      if (min !== null) matchesAmount = matchesAmount && amount >= min;
      if (max !== null) matchesAmount = matchesAmount && amount <= max;

      return matchesSearch && matchesAmount;
    });

    return (
    <div className="space-y-6">
      {renderFilters(false, true)}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">{t('finance.recovery.title_students')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.recovery.table.student')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('university.level.title', 'Niveau')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.recovery.table.program')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.recovery.table.total_due')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.recovery.table.paid')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.recovery.table.remaining')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status', 'Statut')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {t('finance.empty.recovery')}
                  </td>
                </tr>
              ) : (
                filteredBalances.map((item) => {
                  const percentPaid = item.total_due > 0 ? (item.total_paid / item.total_due) : 0;
                  const isGoodPayer = percentPaid >= 0.60;
                  
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${isGoodPayer ? 'bg-green-50/50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.student_name}
                        <div className="text-xs text-gray-500">{item.student_matricule}</div>
                        {isGoodPayer && (
                           <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                             {Math.round(percentPaid * 100)}% {t('finance.recovery.paid')}
                           </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.student_level || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.student_program || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(item.total_due)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isGoodPayer ? 'text-green-700 font-bold' : 'text-green-600'}`}>{formatCurrency(item.total_paid)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-bold">{formatCurrency(item.balance)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {t('finance.recovery.unpaid')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setPaymentForm(prev => ({ ...prev, student: item.student || item.student_id, amount: item.balance }));
                            setShowPaymentModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t('common.actions.pay', 'Payer')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  const renderPaymentModal = () => (
    showPaymentModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('finance.modals.payment.title')}</h2>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">{t('common.close', 'Fermer')}</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div>
              <SearchableSelect
                label={t('finance.modals.payment.labels.student')}
                required
                value={paymentForm.student}
                onChange={handleStudentChange}
                onSearch={handleSearchStudents}
                placeholder={t('finance.modals.payment.labels.select_student')}
              />
            </div>

            {studentStatement && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{t('finance.modals.payment.financial_situation')}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="block text-xs text-gray-500">{t('finance.modals.payment.program_cost')}</span>
                    <span className="block text-sm font-bold text-gray-900">{formatCurrency(studentStatement.total_due)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">{t('finance.modals.payment.already_paid')}</span>
                    <span className="block text-sm font-bold text-green-600">{formatCurrency(studentStatement.total_paid)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">{t('finance.modals.payment.remaining')}</span>
                    <span className={`block text-sm font-bold ${studentStatement.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(studentStatement.balance)}
                    </span>
                  </div>
                </div>
                {studentStatement.balance > 0 && (
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, amount: studentStatement.balance })}
                      className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                    >
                      {t('finance.modals.payment.pay_balance')}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.payment.labels.level')}</label>
              <select
                value={paymentForm.level}
                onChange={(e) => setPaymentForm({ ...paymentForm, level: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">{t('finance.modals.payment.labels.select')}</option>
                {(studentProgramLevels.length > 0 ? studentProgramLevels : levels).map(level => (
                  <option key={level.id} value={level.id}>
                    {level.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.payment.labels.amount')}</label>
              <input
                type="number"
                required
                min="0"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.payment.labels.method')}</label>
              <select
                required
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="CASH">{t('finance.payment_methods.CASH')}</option>
                <option value="BANK_TRANSFER">{t('finance.payment_methods.BANK_TRANSFER')}</option>
                <option value="MOBILE_MONEY">{t('finance.payment_methods.MOBILE_MONEY')}</option>
                <option value="CHECK">{t('finance.payment_methods.CHECK')}</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {t('common.save', 'Enregistrer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  const renderExpenseModal = () => (
    showExpenseModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('finance.modals.expense.title')}</h2>
            <button
              onClick={() => setShowExpenseModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
               <span className="sr-only">{t('common.close', 'Fermer')}</span>
               <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.expense.labels.category')}</label>
              <select
                required
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="SALARIES">{t('finance.expense_categories.SALARIES')}</option>
                <option value="UTILITIES">{t('finance.expense_categories.UTILITIES')}</option>
                <option value="MAINTENANCE">{t('finance.expense_categories.MAINTENANCE')}</option>
                <option value="EQUIPMENT">{t('finance.expense_categories.EQUIPMENT')}</option>
                <option value="SUPPLIES">{t('finance.expense_categories.SUPPLIES')}</option>
                <option value="OTHER">{t('finance.expense_categories.OTHER')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.expense.labels.amount')}</label>
              <input
                type="number"
                required
                min="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.expense.labels.date')}</label>
              <input
                type="date"
                required
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.expense.labels.description')}</label>
              <textarea
                required
                rows={3}
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {t('common.save', 'Enregistrer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  const renderSalaryModal = () => (
    showSalaryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('finance.modals.salary.title')}</h2>
            <button
              onClick={() => setShowSalaryModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">{t('common.close', 'Fermer')}</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleCreateSalary} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.salary.labels.employee')}</label>
              <select
                required
                value={salaryForm.employee}
                onChange={(e) => setSalaryForm({ ...salaryForm, employee: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">{t('finance.modals.salary.labels.select_employee')}</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.user}>
                    {teacher.user_name} ({teacher.employee_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.modals.salary.labels.month')}</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={salaryForm.month}
                  onChange={(e) => setSalaryForm({ ...salaryForm, month: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.modals.salary.labels.year')}</label>
                <input
                  type="number"
                  min="2000"
                  required
                  value={salaryForm.year}
                  onChange={(e) => setSalaryForm({ ...salaryForm, year: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.salary.labels.base_salary')}</label>
              <input
                type="number"
                required
                min="0"
                value={salaryForm.base_salary}
                onChange={(e) => setSalaryForm({ ...salaryForm, base_salary: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.modals.salary.labels.bonuses')}</label>
                <input
                  type="number"
                  min="0"
                  value={salaryForm.bonuses}
                  onChange={(e) => setSalaryForm({ ...salaryForm, bonuses: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.modals.salary.labels.deductions')}</label>
                <input
                  type="number"
                  min="0"
                  value={salaryForm.deductions}
                  onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('finance.modals.salary.labels.remarks')}</label>
              <textarea
                rows={2}
                value={salaryForm.remarks}
                onChange={(e) => setSalaryForm({ ...salaryForm, remarks: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSalaryModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {t('common.save', 'Enregistrer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('finance.title')}</h1>
          <p className="text-gray-500">{t('finance.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'dashboard', label: t('finance.tabs.dashboard') },
            { key: 'payments', label: t('finance.tabs.payments') },
            { key: 'salaries', label: t('finance.tabs.salaries') },
            { key: 'expenses', label: t('finance.tabs.expenses') },
            { key: 'recovery', label: t('finance.tabs.recovery') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'payments' && renderPayments()}
          {activeTab === 'salaries' && renderSalaries()}
          {activeTab === 'expenses' && renderExpenses()}
          {activeTab === 'recovery' && renderRecovery()}
        </>
      )}

      {/* Modals */}
      {renderPaymentModal()}
      {renderExpenseModal()}
      {renderSalaryModal()}
      <PaymentExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onRefresh={fetchData}
      />
      <FinanceExcelImportModal
        isOpen={showSalaryImportModal}
        onClose={() => setShowSalaryImportModal(false)}
        onRefresh={fetchData}
        title="Importer des Salaires (Excel)"
        requiredColumns="Email, Mois, Année, Salaire de base, Primes, Déductions"
        importFn={financeService.importSalaries}
        downloadTemplateFn={financeService.downloadSalaryTemplate}
        templateFileName="template_import_salaires.xlsx"
      />
      <FinanceExcelImportModal
        isOpen={showExpenseImportModal}
        onClose={() => setShowExpenseImportModal(false)}
        onRefresh={fetchData}
        title="Importer des Dépenses (Excel)"
        requiredColumns="Date, Catégorie, Description, Montant"
        importFn={financeService.importExpenses}
        downloadTemplateFn={financeService.downloadExpenseTemplate}
        templateFileName="template_import_depenses.xlsx"
      />
    </div>
  );
};

export default FinancePage;
