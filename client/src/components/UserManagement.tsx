import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, UpdateUserInput, UserRole } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    full_name: '',
    role: 'resepsionis'
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateUserInput>>({
    email: '',
    full_name: '',
    role: 'resepsionis',
    is_active: true
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await trpc.getUsers.query();
      setUsers(userData);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newUser = await trpc.createUser.mutate(createFormData);
      setUsers((prev: User[]) => [...prev, newUser]);
      setCreateFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'resepsionis'
      });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat pengguna baru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      const updatedUser = await trpc.updateUser.mutate({
        id: selectedUser.id,
        ...editFormData
      });
      setUsers((prev: User[]) => 
        prev.map((user: User) => 
          user.id === selectedUser.id ? updatedUser : user
        )
      );
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    });
    setIsEditModalOpen(true);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return '👑';
      case 'dokter': return '👨‍⚕️';
      case 'resepsionis': return '👩‍💼';
      default: return '👤';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'dokter': return 'bg-green-100 text-green-800';
      case 'resepsionis': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Kelola Pengguna</h3>
          <p className="text-gray-600">Tambah, edit, dan kelola semua pengguna sistem</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              <span className="mr-2">➕</span>
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>
                  Buat akun pengguna baru untuk sistem klinik
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Nama Lengkap</Label>
                  <Input
                    id="create-name"
                    value={createFormData.full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                    }
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="nama@klinik.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Kata Sandi</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createFormData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">Peran</Label>
                  <Select
                    value={createFormData.role}
                    onValueChange={(value: UserRole) =>
                      setCreateFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">👑 Admin</SelectItem>
                      <SelectItem value="dokter">👨‍⚕️ Dokter</SelectItem>
                      <SelectItem value="resepsionis">👩‍💼 Resepsionis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Membuat...' : 'Buat Pengguna'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user: User) => (
            <Card key={user.id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getRoleIcon(user.role)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{user.full_name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge className={getRoleColor(user.role)} variant="secondary">
                      {user.role}
                    </Badge>
                    {!user.is_active && (
                      <Badge variant="destructive">Nonaktif</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>ID: {user.id}</span>
                  <span>{user.created_at.toLocaleDateString('id-ID')}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(user)}
                  className="w-full"
                >
                  ✏️ Edit Pengguna
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditUser}>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>
                Ubah informasi pengguna {selectedUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input
                  id="edit-name"
                  value={editFormData.full_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateUserInput>) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateUserInput>) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="nama@klinik.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Peran</Label>
                <Select
                  value={editFormData.role || 'resepsionis'}
                  onValueChange={(value: UserRole) =>
                    setEditFormData((prev: Partial<UpdateUserInput>) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">👑 Admin</SelectItem>
                    <SelectItem value="dokter">👨‍⚕️ Dokter</SelectItem>
                    <SelectItem value="resepsionis">👩‍💼 Resepsionis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={editFormData.is_active || false}
                  onCheckedChange={(checked: boolean) =>
                    setEditFormData((prev: Partial<UpdateUserInput>) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="edit-active">Pengguna Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}