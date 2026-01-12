import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, School, Loader2, Check, X } from 'lucide-react';

// Fungsi untuk validasi kekuatan password
const validatePassword = (password: string) => {
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = (passedChecks / 5) * 100;
  
  return {
    checks,
    strength,
    isValid: Object.values(checks).every(Boolean),
  };
};

// Komponen untuk menampilkan kriteria password
const PasswordCriteria = ({ label, met }: { label: string; met: boolean }) => (
  <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-muted-foreground'}`}>
    {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    <span>{label}</span>
  </div>
);

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'guru' | 'siswa'>('siswa');
  const [jurusan, setJurusan] = useState('');
  const [angkatan, setAngkatan] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  // Validasi password secara real-time
  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  // Warna progress bar berdasarkan kekuatan
  const getStrengthColor = (strength: number) => {
    if (strength <= 20) return 'bg-red-500';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-lime-500';
    return 'bg-green-500';
  };

  // Width class untuk progress bar (menggunakan Tailwind class bukan inline style)
  const getStrengthWidth = (strength: number) => {
    if (strength <= 0) return 'w-0';
    if (strength <= 20) return 'w-1/5';
    if (strength <= 40) return 'w-2/5';
    if (strength <= 60) return 'w-3/5';
    if (strength <= 80) return 'w-4/5';
    return 'w-full';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength <= 20) return 'Sangat Lemah';
    if (strength <= 40) return 'Lemah';
    if (strength <= 60) return 'Sedang';
    if (strength <= 80) return 'Kuat';
    return 'Sangat Kuat';
  };

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi
    if (!fullName.trim()) {
      toast.error('Nama lengkap harus diisi');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    // Validasi password yang kuat
    if (!passwordValidation.isValid) {
      toast.error('Password tidak memenuhi kriteria keamanan', {
        description: 'Pastikan password memenuhi semua kriteria yang ditampilkan.',
      });
      return;
    }

    setLoading(true);

    const metadata: { jurusan?: string; angkatan?: number } = {};
    if (jurusan) metadata.jurusan = jurusan;
    if (angkatan) metadata.angkatan = parseInt(angkatan);

    const { error } = await signUp(email, password, fullName, role, metadata);

    if (error) {
      toast.error('Pendaftaran gagal', {
        description: error.message === 'User already registered'
          ? 'Email sudah terdaftar'
          : error.message,
      });
    } else {
      toast.success('Pendaftaran berhasil!', {
        description: 'Silakan cek email Anda untuk verifikasi akun.',
      });
      navigate('/login');
    }

    setLoading(false);
  };

  // Generate tahun angkatan (5 tahun terakhir)
  const currentYear = new Date().getFullYear();
  const angkatanOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <School className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Daftar Akun</CardTitle>
          <CardDescription>
            Buat akun baru untuk mengakses sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@sekolah.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Buat password yang kuat"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              
              {/* Indikator Kekuatan Password */}
              {password && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Kekuatan Password:</span>
                    <span className={`font-medium ${
                      passwordValidation.strength <= 40 ? 'text-red-500' : 
                      passwordValidation.strength <= 60 ? 'text-yellow-500' : 
                      'text-green-500'
                    }`}>
                      {getStrengthLabel(passwordValidation.strength)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthWidth(passwordValidation.strength)} ${getStrengthColor(passwordValidation.strength)}`}
                    />
                  </div>
                  
                  {/* Checklist Kriteria Password */}
                  <div className="grid grid-cols-1 gap-1 mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Password harus memenuhi:</p>
                    <PasswordCriteria label="Minimal 8 karakter" met={passwordValidation.checks.minLength} />
                    <PasswordCriteria label="Mengandung huruf besar (A-Z)" met={passwordValidation.checks.hasUpperCase} />
                    <PasswordCriteria label="Mengandung huruf kecil (a-z)" met={passwordValidation.checks.hasLowerCase} />
                    <PasswordCriteria label="Mengandung angka (0-9)" met={passwordValidation.checks.hasNumber} />
                    <PasswordCriteria label="Mengandung karakter spesial (!@#$%...)" met={passwordValidation.checks.hasSpecialChar} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              {/* Indikator kecocokan password */}
              {confirmPassword && (
                <div className={`flex items-center gap-2 text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                  {password === confirmPassword ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>{password === confirmPassword ? 'Password cocok' : 'Password tidak cocok'}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role / Jabatan</Label>
              <Select 
                value={role} 
                onValueChange={(value: 'admin' | 'guru' | 'siswa') => {
                  setRole(value);
                  // Reset jurusan dan angkatan jika bukan siswa
                  if (value !== 'siswa') {
                    setJurusan('');
                    setAngkatan('');
                  }
                }} 
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="siswa">Siswa / Mahasiswa</SelectItem>
                  <SelectItem value="guru">Guru / Dosen</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'siswa' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="jurusan">Jurusan</Label>
                  <Select value={jurusan} onValueChange={setJurusan} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jurusan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trkj">TRKJ - Teknik Rekayasa dan Jaringan Komputer</SelectItem>
                      <SelectItem value="ti">TI - Teknik Informatika</SelectItem>
                      <SelectItem value="trmm">TRMM - Teknik Rekayasa Multimedia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="angkatan">Angkatan</Label>
                  <Select value={angkatan} onValueChange={setAngkatan} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {angkatanOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mendaftar...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Daftar
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
