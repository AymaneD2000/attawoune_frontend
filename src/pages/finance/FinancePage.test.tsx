import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import FinancePage from './FinancePage';
import financeService from '../../services/financeService';
import universityService from '../../services/universityService';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'finance.tabs.dashboard': 'Tableau de bord',
        'finance.tabs.payments': 'Paiements',
        'finance.tabs.salaries': 'Salaires',
        'finance.tabs.expenses': 'Dépenses',
        'finance.tabs.recovery': 'Recouvrement',
        'finance.payments.title': 'Historique des paiements',
        'finance.payments.delete': 'Supprimer',
        'finance.payments.delete_title': 'Supprimer ce paiement ?',
        'finance.payments.confirm_delete': 'Supprimer le paiement',
        'finance.empty.payments': 'Aucun paiement enregistré',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ADMIN' } }),
}));

jest.mock('../../services/financeService', () => ({
  __esModule: true,
  default: {
    getDashboardStats: jest.fn(),
    getPayments: jest.fn(),
    deletePayment: jest.fn(),
    exportPayments: jest.fn(),
    importPayments: jest.fn(),
    downloadPaymentTemplate: jest.fn(),
    getSalaries: jest.fn(),
    getExpenses: jest.fn(),
    getOutstandingBalances: jest.fn(),
    importSalaries: jest.fn(),
    downloadSalaryTemplate: jest.fn(),
    importExpenses: jest.fn(),
    downloadExpenseTemplate: jest.fn(),
  },
}));

jest.mock('../../services/universityService', () => ({
  __esModule: true,
  default: {
    getLevels: jest.fn().mockResolvedValue({ results: [] }),
    getSemesters: jest.fn().mockResolvedValue({ results: [] }),
    getTeachers: jest.fn().mockResolvedValue({ results: [] }),
  },
}));

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('./FinanceAnalytics', () => () => <div>Finance analytics</div>);
jest.mock('./PaymentExcelImportModal', () => () => null);
jest.mock('./FinanceExcelImportModal', () => () => null);
jest.mock('../../components/common/SearchableSelect', () => () => <div />);

const payment = {
  id: 42,
  student: 7,
  student_name: 'Aminata Traoré',
  student_matricule: 'ATT-007',
  academic_year: 3,
  academic_year_name: '2026-2027',
  level: 2,
  level_name: 'Licence 2',
  semester: null,
  semester_name: '',
  amount: '125000.00',
  payment_method: 'CASH',
  payment_method_display: 'Espèces',
  status: 'COMPLETED' as const,
  status_display: 'Complété',
  reference: 'PAY-DELETE-001',
  payment_date: '2026-07-15',
};

describe('Finance payment deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (financeService.getDashboardStats as jest.Mock).mockResolvedValue({});
    (financeService.getPayments as jest.Mock)
      .mockResolvedValueOnce({ results: [payment], count: 1 })
      .mockResolvedValue({ results: [], count: 0 });
    (financeService.deletePayment as jest.Mock).mockResolvedValue(undefined);
    (universityService.getLevels as jest.Mock).mockResolvedValue({ results: [] });
    (universityService.getSemesters as jest.Mock).mockResolvedValue({ results: [] });
    (universityService.getTeachers as jest.Mock).mockResolvedValue({ results: [] });
  });

  it('requires confirmation and refreshes the payment ledger after deletion', async () => {
    render(<FinancePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Paiements' }));
    expect(await screen.findByText('PAY-DELETE-001')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer PAY-DELETE-001' }),
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Supprimer ce paiement ?')).toBeInTheDocument();
    expect(within(dialog).getByText('Aminata Traoré')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer le paiement' }),
    );

    await waitFor(() => {
      expect(financeService.deletePayment).toHaveBeenCalledWith(42);
    });
    expect(await screen.findByText('Aucun paiement enregistré')).toBeInTheDocument();
  });
});
