import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { ResepsionisData, UserRole } from '../../../server/src/schema';

interface ResepsionisDesktopProps {
  user: {
    id: number;
    email: string;
    full_name: string;
    role: UserRole;
  };
  onLogout: () => void;
}

export function ResepsionisDesktop({ user, onLogout }: ResepsionisDesktopProps) {
  const [dashboardData, setDashboardData] = useState<ResepsionisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getResepsionisData.query();
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-3">
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
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    👩‍💼 {user.role}
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Resepsionis</h2>
          <p className="text-gray-600">Selamat datang, {user.full_name}! 👋</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dashboardData ? (
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">👩‍💼</span>
                  Profil Resepsionis
                </CardTitle>
                <CardDescription>
                  Informasi detail resepsionis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white text-xl">👩‍💼</span>
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-900">{dashboardData.receptionist_info.full_name}</p>
                    <p className="text-gray-600">📧 {dashboardData.receptionist_info.email}</p>
                    <p className="text-sm text-gray-500">ID: {dashboardData.receptionist_info.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-yellow-600 text-2xl">⏳</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Janji Temu Tertunda</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.pending_appointments}</p>
                      <p className="text-sm text-yellow-600">Memerlukan perhatian</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-green-600 text-2xl">📅</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Janji Temu Hari Ini</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.today_appointments}</p>
                      <p className="text-sm text-green-600">Terjadwal untuk hari ini</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">⚡</span>
                  Aksi Cepat
                </CardTitle>
                <CardDescription>
                  Fitur yang sering digunakan resepsionis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col space-y-2 hover:bg-purple-50">
                    <span className="text-2xl">👥</span>
                    <span className="text-sm">Daftar Pasien</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2 hover:bg-pink-50">
                    <span className="text-2xl">📅</span>
                    <span className="text-sm">Buat Janji Temu</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2 hover:bg-blue-50">
                    <span className="text-2xl">🔍</span>
                    <span className="text-sm">Cari Pasien</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2 hover:bg-green-50">
                    <span className="text-2xl">💰</span>
                    <span className="text-sm">Pembayaran</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2 hover:bg-yellow-50">
                    <span className="text-2xl">📋</span>
                    <span className="text-sm">Antrian</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2 hover:bg-indigo-50">
                    <span className="text-2xl">📞</span>
                    <span className="text-sm">Hubungi Pasien</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2 hover:bg-red-50">
                    <span className="text-2xl">🚨</span>
                    <span className="text-sm">Darurat</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2 hover:bg-gray-50">
                    <span className="text-2xl">📊</span>
                    <span className="text-sm">Laporan</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Daily Summary */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">📈</span>
                  Ringkasan Hari Ini
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{dashboardData.today_appointments}</div>
                    <p className="text-sm text-gray-600 mt-1">Total Janji Temu</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{dashboardData.pending_appointments}</div>
                    <p className="text-sm text-gray-600 mt-1">Menunggu Konfirmasi</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.max(0, dashboardData.today_appointments - dashboardData.pending_appointments)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Terkonfirmasi</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">⏰</div>
                    <p className="text-sm text-gray-600 mt-1">Status Aktif</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}