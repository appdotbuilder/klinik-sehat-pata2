import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { DokterDashboard as DokterDashboardType, UserRole } from '../../../server/src/schema';

interface DokterDashboardProps {
  user: {
    id: number;
    email: string;
    full_name: string;
    role: UserRole;
  };
  onLogout: () => void;
}

export function DokterDashboard({ user, onLogout }: DokterDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DokterDashboardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getDokterDashboard.query();
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mr-3">
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
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    👨‍⚕️ {user.role}
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
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Dokter</h2>
          <p className="text-gray-600">Selamat datang, Dr. {user.full_name}! 👋</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : dashboardData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Doctor Profile Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">👨‍⚕️</span>
                  Profil Dokter
                </CardTitle>
                <CardDescription>
                  Informasi detail dokter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white text-xl">👨‍⚕️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-900">{dashboardData.doctor_info.full_name}</p>
                    <p className="text-gray-600">📧 {dashboardData.doctor_info.email}</p>
                    <p className="text-sm text-gray-500">ID: {dashboardData.doctor_info.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">📅</div>
                    <p className="text-sm text-gray-600 mt-1">Jadwal Hari Ini</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">⏰</div>
                    <p className="text-sm text-gray-600 mt-1">Status Aktif</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">📋</span>
                  Jadwal Hari Ini
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
                {dashboardData.today_schedule.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🏖️</div>
                    <p className="text-gray-500">Tidak ada jadwal untuk hari ini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.today_schedule.map((appointment: any, index: number) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                        appointment.patient_name 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-gray-50 border-gray-300'
                      }`}>
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            appointment.patient_name 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {appointment.patient_name ? '👤' : '⏳'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              🕐 {appointment.time}
                            </p>
                            <p className="text-sm text-gray-600">
                              {appointment.patient_name || 'Slot kosong'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={appointment.patient_name ? "default" : "secondary"}>
                          {appointment.patient_name ? '📅 Terjadwal' : '🆓 Tersedia'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white shadow-sm border-0 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">⚡</span>
                  Aksi Cepat
                </CardTitle>
                <CardDescription>
                  Fitur yang sering digunakan dokter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col space-y-2">
                    <span className="text-2xl">📝</span>
                    <span className="text-sm">Tulis Resep</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2">
                    <span className="text-2xl">👥</span>
                    <span className="text-sm">Daftar Pasien</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2">
                    <span className="text-2xl">📊</span>
                    <span className="text-sm">Laporan Medis</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col space-y-2">
                    <span className="text-2xl">🕐</span>
                    <span className="text-sm">Atur Jadwal</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}