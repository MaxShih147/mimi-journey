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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '420px',
          width: '100%',
        }}
      >
        {/* Logo and Title */}
        <div style={{ marginBottom: '40px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}
          >
            ✈️
          </div>
          <h1
            style={{
              fontSize: '2.5rem',
              marginBottom: '8px',
              color: 'white',
              fontWeight: 700,
              letterSpacing: '-1px',
            }}
          >
            Mimi Journey
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: 0,
            }}
          >
            旅行規劃與軌跡紀錄
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '40px 32px',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              color: '#1e293b',
              marginTop: 0,
              marginBottom: '12px',
              fontWeight: 600,
            }}
          >
            Welcome
          </h2>
          <p
            style={{
              marginBottom: '32px',
              color: '#64748b',
              fontSize: '15px',
              lineHeight: 1.6,
            }}
          >
            使用 Google 帳號登入，同步您的行事曆事件並開始規劃行程。
          </p>
          <LoginButton />
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: '32px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px',
          }}
        >
          MVP Version • Built with React & FastAPI
        </p>
      </div>
    </div>
  );
}
