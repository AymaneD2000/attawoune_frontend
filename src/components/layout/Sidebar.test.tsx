import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

jest.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useLocation: () => ({ pathname: '/dashboard' }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'admin',
      first_name: 'Admin',
      last_name: 'Test',
      full_name: 'Admin Test',
      role: 'ADMIN',
    },
    logout: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || _key,
  }),
}));

describe('Sidebar direction-aware positioning', () => {
  it('uses the semantic sidebar class instead of conflicting RTL transform utilities', () => {
    document.documentElement.dir = 'rtl';

    const { container } = render(
      <Sidebar mobileOpen={false} onMobileClose={jest.fn()} />,
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('app-sidebar');
    expect(sidebar).not.toHaveClass('rtl:translate-x-full');
    expect(sidebar).not.toHaveClass('-translate-x-full');
  });

  it('adds the open state class for the mobile drawer', () => {
    const { container } = render(
      <Sidebar mobileOpen onMobileClose={jest.fn()} />,
    );

    expect(container.querySelector('aside')).toHaveClass('app-sidebar-open');
    expect(screen.getByLabelText('Fermer le menu')).toBeInTheDocument();
  });
});
