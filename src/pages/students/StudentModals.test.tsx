import React from 'react';
import { act, render, screen } from '@testing-library/react';
import StudentDetailModal from './StudentDetailsModal';
import StudentFormModal from './StudentFormModal';
import { Student } from '../../types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || _key,
  }),
}));

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../../services/universityService', () => ({
  __esModule: true,
  default: {
    getPrograms: async () => ({ results: [] }),
    getLevels: async () => ({ results: [] }),
  },
}));

jest.mock('../../services/userService', () => ({
  __esModule: true,
  default: {
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
  },
}));

jest.mock('../../services/studentService', () => ({
  __esModule: true,
  default: {
    createStudent: jest.fn(),
    updateStudent: jest.fn(),
  },
}));

const student: Student = {
  id: 1,
  user: 2,
  user_full_name: 'Mariam Diallo',
  first_name: 'Mariam',
  last_name: 'Diallo',
  date_of_birth: '2005-01-01',
  user_email: 'mariam@example.com',
  user_phone: '70000000',
  student_id: 'ATT-001',
  program: 3,
  program_name: 'Études islamiques',
  current_level: 1,
  level_display: 'Licence 1',
  enrollment_date: '2025-09-01',
  status: 'ACTIVE',
  guardian_name: '',
  guardian_phone: '',
  emergency_contact: '',
  photo: null,
};

describe('Student modals remain inside the viewport', () => {
  it('keeps the detail header and tabs fixed while only the body scrolls', () => {
    render(<StudentDetailModal student={student} onClose={jest.fn()} />);

    const dialog = screen.getByRole('dialog');
    const scrollBody = screen.getByTestId('student-detail-scroll-body');

    expect(dialog).toHaveClass('flex-col', 'overflow-hidden');
    expect(scrollBody).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('keeps form navigation outside the scrollable form body', async () => {
    render(<StudentFormModal onClose={jest.fn()} onSuccess={jest.fn()} />);
    await act(async () => {
      await Promise.resolve();
    });

    const dialog = screen.getByRole('dialog');
    const scrollBody = screen.getByTestId('student-form-scroll-body');
    const nextButton = screen.getByRole('button', { name: 'Suivant' });

    expect(dialog).toHaveClass('flex-col', 'overflow-hidden');
    expect(scrollBody).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    expect(scrollBody.contains(nextButton)).toBe(false);
  });
});
