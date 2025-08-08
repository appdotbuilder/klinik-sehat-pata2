import { useState, useEffect, useCallback } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { DokterDashboard } from '@/components/DokterDashboard';
import { ResepsionisDesktop } from '@/components/ResepsionisDesktop';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { trpc } from '@/utils/trpc';
import type { LoginResponse, UserRole } from '../../server/src/schema';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: UserRole;
  } | null;
  token: string | null;
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on app load
  const checkExistingAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await trpc.verifyToken.query();
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          setAuthState({
            isAuthenticated: true,
            user,
            token
          });
        }
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        console.error('Token verification failed:', error);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkExistingAuth();
  }, [checkExistingAuth]);

  const handleLogin = async (loginResponse: LoginResponse) => {
    const { user, token } = loginResponse;
    
    // Store auth data
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    
    // Update auth state
    setAuthState({
      isAuthenticated: true,
      user,
      token
    });
  };

  const handleLogout = () => {
    // Clear storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Reset auth state
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null
    });
  };

  // Note: Authentication headers are configured in the tRPC client setup
  // The token from localStorage is automatically included in requests

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!authState.isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (authState.user?.role) {
      case 'admin':
        return <AdminDashboard user={authState.user} onLogout={handleLogout} />;
      case 'dokter':
        return <DokterDashboard user={authState.user} onLogout={handleLogout} />;
      case 'resepsionis':
        return <ResepsionisDesktop user={authState.user} onLogout={handleLogout} />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-red-600">Error: Invalid User Role</h1>
              <p className="text-gray-600 mt-2">Unable to determine dashboard for role: {authState.user?.role}</p>
              <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
}

export default App;