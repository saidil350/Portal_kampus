import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, Users, Clock, CheckCircle, AlertCircle, Package, Camera, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Dashboard = () => {
  const { userRole, profile } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    borrowedItems: 0,
    overdueItems: 0,
    pendingRequests: 0,
    myActiveRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedReturnRequest, setSelectedReturnRequest] = useState<any>(null);
  const [returnPhoto, setReturnPhoto] = useState<File | null>(null);
  const [returnCondition, setReturnCondition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecentRequests();

    // Setup realtime subscriptions
    const itemsChannel = supabase
      .channel('items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchStats();
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrowing_requests' }, () => {
        fetchStats();
        fetchRecentRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [profile?.id]);

  const fetchStats = async () => {
    // Fetch items stats
    const { data: items } = await supabase.from('items').select('status');
    
    const totalItems = items?.length || 0;
    const availableItems = items?.filter(i => i.status === 'tersedia').length || 0;
    const borrowedItems = items?.filter(i => i.status === 'dipinjam').length || 0;
    const overdueItems = items?.filter(i => i.status === 'overdue').length || 0;

    // Fetch requests stats
    const { data: requests } = await supabase
      .from('borrowing_requests')
      .select('status, borrower_id');

    const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
    const myActiveRequests = requests?.filter(
      r => r.borrower_id === profile?.id && ['pending', 'approved', 'pending_return'].includes(r.status)
    ).length || 0;

    setStats({
      totalItems,
      availableItems,
      borrowedItems,
      overdueItems,
      pendingRequests,
      myActiveRequests,
    });
  };

  const fetchRecentRequests = async () => {
    let query = supabase
      .from('borrowing_requests')
      .select(`
        *,
        items(name, type, room_name),
        profiles!borrowing_requests_borrower_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (userRole === 'siswa') {
      query = query
        .eq('borrower_id', profile?.id)
        .in('status', ['pending', 'approved', 'pending_return']); // Hanya tampilkan yang masih aktif
    }

    const { data } = await query;
    setRecentRequests(data || []);
  };

  const handleReturnItem = async () => {
    if (!selectedReturnRequest || !returnPhoto) {
      toast.error('Mohon lampirkan foto bukti pengembalian');
      return;
    }

    setIsSubmitting(true);
    try {
      const fileExt = returnPhoto.name.split('.').pop();
      // Format: namauser_namaitem_tanggal.ext
      const userName = profile?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'user';
      const itemName = selectedReturnRequest.items?.name?.replace(/\s+/g, '-').toLowerCase() || 'item';
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const uniqueId = Math.random().toString(36).substring(7);
      const fileName = `${userName}_${itemName}_${dateStr}_${uniqueId}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload photo to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('return-proofs')
        .upload(filePath, returnPhoto);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('return-proofs')
        .getPublicUrl(filePath);

      // Update borrowing_requests
      const { error: updateRequestError } = await supabase
        .from('borrowing_requests')
        .update({
          status: 'pending_return',
          returned_at: new Date().toISOString(),
          return_condition: returnCondition,
          return_photo_url: publicUrl,
        })
        .eq('id', selectedReturnRequest.id);

      if (updateRequestError) throw updateRequestError;

      // Log activity
      await supabase.from('activity_logs').insert({
        request_id: selectedReturnRequest.id,
        action: 'return_request',
        performed_by: profile?.id,
        notes: `Mengajukan pengembalian item: ${selectedReturnRequest.items?.name}. Kondisi: ${returnCondition}`,
      });

      toast.success('Pengembalian diajukan, menunggu verifikasi admin');
      setReturnDialogOpen(false);
      resetReturnForm();
      fetchStats();
      fetchRecentRequests();
    } catch (error: any) {
      console.error('Error returning item:', error);
      toast.error('Gagal mengembalikan item: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetReturnForm = () => {
    setSelectedReturnRequest(null);
    setReturnPhoto(null);
    setReturnCondition('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      approved: { variant: 'default', label: 'Disetujui' },
      rejected: { variant: 'destructive', label: 'Ditolak' },
      returned: { variant: 'outline', label: 'Dikembalikan' },
      pending_return: { variant: 'warning', label: 'Menunggu Verifikasi' },
    };

    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout currentPage="/dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Selamat datang, {profile?.full_name}!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Item</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">Kunci & Infokus</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tersedia</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.availableItems}</div>
              <p className="text-xs text-muted-foreground">Siap dipinjam</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dipinjam</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.borrowedItems}</div>
              <p className="text-xs text-muted-foreground">Sedang digunakan</p>
            </CardContent>
          </Card>

          {stats.overdueItems > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.overdueItems}</div>
                <p className="text-xs text-muted-foreground">Perlu perhatian</p>
              </CardContent>
            </Card>
          )}

          {(userRole === 'admin' || userRole === 'guru') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Perlu Approval</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                <p className="text-xs text-muted-foreground">Permintaan masuk</p>
              </CardContent>
            </Card>
          )}

          {userRole === 'siswa' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peminjaman Saya</CardTitle>
                <KeyRound className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.myActiveRequests}</div>
                <p className="text-xs text-muted-foreground">Aktif</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Permintaan peminjaman terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada aktivitas
                </p>
              ) : (
                recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {request.items?.name} - {request.items?.room_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.profiles?.full_name} • {request.purpose}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      {getStatusBadge(request.status)}
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.requested_at).toLocaleDateString('id-ID')}
                      </p>
                      {userRole === 'siswa' && request.status === 'approved' && !request.returned_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 text-xs"
                          onClick={() => {
                            setSelectedReturnRequest(request);
                            setReturnDialogOpen(true);
                          }}
                        >
                          <Send className="mr-1 h-3 w-3" />
                          Kembalikan
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Return Item Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={(open) => {
          setReturnDialogOpen(open);
          if (!open) resetReturnForm();
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Kembalikan Item</DialogTitle>
              <DialogDescription>
                Unggah bukti foto dan berikan catatan kondisi barang saat dikembalikan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Item: {selectedReturnRequest?.items?.name}</p>
                <p className="text-sm text-muted-foreground">Ruangan: {selectedReturnRequest?.items?.room_name}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo" className="flex items-center gap-1">
                  Foto Bukti Pengembalian
                  <span className="text-destructive">*</span>
                </Label>
                <div className={`p-4 border-2 border-dashed rounded-lg transition-colors ${
                  returnPhoto 
                    ? 'border-success bg-success/10' 
                    : 'border-destructive/50 bg-destructive/5'
                }`}>
                  <div className="flex flex-col items-center gap-2">
                    <Camera className={`h-8 w-8 ${returnPhoto ? 'text-success' : 'text-destructive/50'}`} />
                    {returnPhoto ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-success">Foto berhasil dipilih</p>
                        <p className="text-xs text-muted-foreground">{returnPhoto.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-destructive">Foto wajib diunggah!</p>
                        <p className="text-xs text-muted-foreground">Pilih foto sebagai bukti pengembalian</p>
                      </div>
                    )}
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReturnPhoto(e.target.files?.[0] || null)}
                      className="cursor-pointer max-w-[200px]"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Catatan Kondisi (Opsional)</Label>
                <Textarea
                  id="condition"
                  placeholder="Contoh: Barang dalam kondisi baik dan lengkap"
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {!returnPhoto && (
                <p className="text-xs text-destructive flex-1 text-left">
                  ⚠️ Upload foto terlebih dahulu untuk mengembalikan item
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReturnDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleReturnItem} 
                  disabled={isSubmitting || !returnPhoto}
                >
                  {isSubmitting ? 'Memproses...' : 'Kirim Pengembalian'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;