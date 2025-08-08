import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { UserManagement } from '@/components/UserManagement';
import type { AdminDashboard as AdminDashboardType, UserRole } from '../../../server/src/schema';

interface AdminDashboardProps {
  user: {
    id: number;
    email: string;
    full_name: string;
    role: UserRole;
  };
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [dashboardData, setDashboardData] = useState<AdminDashboardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getAdminDashboard.query();
      setDashboardData(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-800">🏥 Klinik Sehat Pata2</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <div className="flex items-center justify-end">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    👑 {user.role}
                  </Badge>
                </div>
              </div>
              <Button onClick={onLogout} variant="outline" size="sm">
                🚪 Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Kelola Pengguna
            </button>
          </nav>
        </div>

        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Admin</h2>
              <p className="text-gray-600">Selamat datang, {user.full_name}! 👋</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : dashboardData ? (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">👥</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.total_users}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 font-bold">👨‍⚕️</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Dokter</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.total_doctors}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-purple-600 font-bold">👩‍💼</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Resepsionis</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.total_receptionists}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-yellow-600 font-bold">✅</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pengguna Aktif</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.active_users}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Registrations */}
                <Card className="bg-white shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="mr-2">📅</span>
                      Registrasi Terbaru
                    </CardTitle>
                    <CardDescription>
                      Pengguna yang baru saja didaftarkan ke sistem
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.recent_registrations.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Belum ada registrasi baru</p>
                    ) : (
                      <div className="space-y-4">
                        {dashboardData.recent_registrations.map((user: any) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <p className="text-sm text-gray-500">
                                Terdaftar pada {user.created_at.toLocaleDateString('id-ID')}
                              </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {user.role === 'dokter' ? '👨‍⚕️' : user.role === 'resepsionis' ? '👩‍💼' : '👤'} {user.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'users' && (
          <UserManagement />
        )}
      </div>
    </div>
  );
}