import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { LoginInput, LoginResponse } from '../../../server/src/schema';

interface LoginFormProps {
  onLogin: (loginResponse: LoginResponse) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await trpc.login.mutate(formData);
      onLogin(response);
    } catch (error: any) {
      setError(error?.message || 'Login gagal. Silakan periksa kembali kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              🏥 Klinik Sehat Pata2
            </CardTitle>
            <CardDescription className="text-gray-600">
              Masuk ke sistem manajemen klinik
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  📧 Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@klinik.com"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  disabled={isLoading}
                  className="bg-white border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  🔒 Kata Sandi
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  disabled={isLoading}
                  className="bg-white border-gray-300 focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sedang masuk...
                  </div>
                ) : (
                  '🚀 Masuk'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p><strong>Demo Login:</strong></p>
                <p>👤 Admin: admin@klinik.com</p>
                <p>👨‍⚕️ Dokter: dokter@klinik.com</p>
                <p>👩‍💼 Resepsionis: resepsionis@klinik.com</p>
                <p>🔑 Password: password123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}