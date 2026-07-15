import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import StudentDetailModal from './StudentDetailsModal';
import StudentFormModal from './StudentFormModal';
import { Student } from '../../types';
import api from '../../services/api';
import studentService from '../../services/studentService';
import userService from '../../services/userService';

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
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({ data: { results: [] } });
  });

  it('keeps the detail header and tabs fixed while only the body scrolls', () => {
    render(<StudentDetailModal student={student} onClose={jest.fn()} />);

    const dialog = screen.getByRole('dialog');
    const scrollBody = screen.getByTestId('student-detail-scroll-body');

    expect(dialog).toHaveClass('flex-col', 'overflow-hidden', 'max-w-3xl', 'sm:max-h-[90dvh]');
    expect(scrollBody).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('opens editing from the same header action used by the teacher modal', () => {
    const onEdit = jest.fn();
    render(<StudentDetailModal student={student} onClose={jest.fn()} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('shows a retry action instead of an endless ID-card spinner after a timeout', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce({ code: 'ECONNABORTED' });
    render(<StudentDetailModal student={student} onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: "Carte d'étudiant" }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La génération prend trop de temps');
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('keeps form navigation outside the scrollable form body', async () => {
    render(<StudentFormModal onClose={jest.fn()} onSuccess={jest.fn()} />);
    await act(async () => {
      await Promise.resolve();
    });

    const dialog = screen.getByRole('dialog');
    const scrollBody = screen.getByTestId('student-form-scroll-body');
    const nextButton = screen.getByRole('button', { name: 'Suivant' });

    expect(dialog).toHaveClass('flex-col', 'overflow-hidden', 'max-w-2xl', 'sm:max-h-[90dvh]');
    expect(scrollBody).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    expect(scrollBody.contains(nextButton)).toBe(false);
  });

  it('uploads a replacement profile photo as multipart student data', async () => {
    (userService.getUser as jest.Mock).mockResolvedValue({
      id: 2,
      first_name: 'Mariam',
      last_name: 'Diallo',
      email: 'mariam@example.com',
      username: 'mariam',
      phone: '70000000',
      address: '',
      date_of_birth: '2005-01-01',
    });
    (userService.updateUser as jest.Mock).mockResolvedValue({});
    (studentService.updateStudent as jest.Mock).mockResolvedValue({
      ...student,
      photo: 'https://api.example.test/media/students/photos/new-profile.png',
    });
    const onSuccess = jest.fn();
    const onClose = jest.fn();

    render(
      <StudentFormModal
        student={student}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const replacement = new File(['photo-bytes'], 'new-profile.png', {
      type: 'image/png',
    });
    fireEvent.change(screen.getByLabelText('Photo de profil'), {
      target: { files: [replacement] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(studentService.updateStudent).toHaveBeenCalledTimes(1);
    const [, payload] = (studentService.updateStudent as jest.Mock).mock.calls[0];
    expect(payload).toBeInstanceOf(FormData);
    expect(payload.get('photo')).toBe(replacement);
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ photo: expect.stringContaining('new-profile.png') }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
