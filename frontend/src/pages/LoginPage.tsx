/**
 * Login page component.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginButton } from '../components/auth/LoginButton';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to planner if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/planner');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#f0f4f8',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#1a1a2e' }}>
          Mimi Journey
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '32px' }}>
          旅行規劃與軌跡紀錄
        </p>

        <div
          style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <p style={{ marginBottom: '24px', color: '#444' }}>
            使用 Google 帳號登入，即可同步您的行事曆事件並規劃行程。
          </p>
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
