import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LoginButton } from '../../src/components/auth/LoginButton';

// Mock useAuth since LoginButton uses it
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: mockIsLoading,
    user: null,
    isAuthenticated: false,
    error: null,
    logout: vi.fn(),
    isLoggingOut: false,
    isDemoMode: false,
  }),
}));

let mockLogin = vi.fn();
let mockIsLoading = false;

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('LoginButton', () => {
  it('renders login text', () => {
    mockIsLoading = false;
    renderWithProviders(<LoginButton />);
    expect(screen.getByText('使用 Google 登入')).toBeInTheDocument();
  });

  it('calls login on click', () => {
    mockLogin = vi.fn();
    mockIsLoading = false;
    renderWithProviders(<LoginButton />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockLogin).toHaveBeenCalled();
  });

  it('shows connecting state when loading', () => {
    mockIsLoading = true;
    renderWithProviders(<LoginButton />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    mockIsLoading = true;
    renderWithProviders(<LoginButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders Google SVG icon', () => {
    mockIsLoading = false;
    renderWithProviders(<LoginButton />);
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
