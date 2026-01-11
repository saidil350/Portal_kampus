import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  KeyRound,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ExportReports } from '@/components/ExportReports';

interface BorrowingStats {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  activeLoans: number;
  returnedItems: number;
  overdueItems: number;
}

interface ItemStats {
  itemName: string;
  itemType: string;
  totalBorrowed: number;
  currentStatus: string;
}

interface DepartmentStats {
  jurusan: string;
  totalRequests: number;
  approvedRequests: number;
}

interface RecentActivity {
  id: string;
  borrowerName: string;
  itemName: string;
  purpose: string;
  status: string;
  requestedAt: string;
  startTime: string;
  endTime: string;
  nim_nip: string;
  jurusan: string;
  returnPhotoUrl?: string;
  returnCondition?: string;
}

const Reports = () => {
  const [stats, setStats] = useState<BorrowingStats>({
    totalRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    activeLoans: 0,
    returnedItems: 0,
    overdueItems: 0,
  });
  const [itemStats, setItemStats] = useState<ItemStats[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch overall statistics
      const { data: requests, error: requestsError } = await supabase
        .from('borrowing_requests')
        .select('*');

      if (requestsError) throw requestsError;

      const now = new Date();
      const totalRequests = requests?.length || 0;
      const approvedRequests = requests?.filter(r => r.status === 'approved').length || 0;
      const rejectedRequests = requests?.filter(r => r.status === 'rejected').length || 0;
      const activeLoans = requests?.filter(r => r.status === 'approved' && !r.returned_at).length || 0;
      const returnedItems = requests?.filter(r => r.returned_at).length || 0;
      const overdueItems = requests?.filter(r => 
        r.status === 'approved' && 
        !r.returned_at && 
        new Date(r.end_time) < now
      ).length || 0;

      setStats({
        totalRequests,
        approvedRequests,
        rejectedRequests,
        activeLoans,
        returnedItems,
        overdueItems,
      });

      // Fetch item statistics
      const { data: itemStatsData, error: itemStatsError } = await supabase
        .from('borrowing_requests')
        .select(`
          item_id,
          items (
            name,
            type,
            status
          )
        `)
        .eq('status', 'approved');

      if (itemStatsError) throw itemStatsError;

      const itemMap = new Map<string, ItemStats>();
      itemStatsData?.forEach((record: any) => {
        const itemId = record.item_id;
        const item = record.items;
        if (item) {
          if (!itemMap.has(itemId)) {
            itemMap.set(itemId, {
              itemName: item.name,
              itemType: item.type,
              totalBorrowed: 0,
              currentStatus: item.status,
            });
          }
          const stats = itemMap.get(itemId)!;
          stats.totalBorrowed += 1;
        }
      });

      setItemStats(Array.from(itemMap.values()).sort((a, b) => b.totalBorrowed - a.totalBorrowed));

      // Fetch department statistics
      const { data: deptStatsData, error: deptStatsError } = await supabase
        .from('borrowing_requests')
        .select(`
          status,
          profiles!borrowing_requests_borrower_id_fkey (
            jurusan
          )
        `);

      if (deptStatsError) throw deptStatsError;

      const deptMap = new Map<string, DepartmentStats>();
      deptStatsData?.forEach((record: any) => {
        const jurusan = record.profiles?.jurusan || 'Tidak Diketahui';
        if (!deptMap.has(jurusan)) {
          deptMap.set(jurusan, {
            jurusan,
            totalRequests: 0,
            approvedRequests: 0,
          });
        }
        const stats = deptMap.get(jurusan)!;
        stats.totalRequests += 1;
        if (record.status === 'approved') {
          stats.approvedRequests += 1;
        }
      });

      setDepartmentStats(Array.from(deptMap.values()).sort((a, b) => b.totalRequests - a.totalRequests));

      // Fetch recent activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('borrowing_requests')
        .select(`
          id,
          purpose,
          status,
          requested_at,
          start_time,
          end_time,
          profiles!borrowing_requests_borrower_id_fkey (
            full_name,
            nim_nip,
            jurusan
          ),
          items (
            name
          ),
          return_photo_url,
          return_condition
        `)
        .order('requested_at', { ascending: false })
        .limit(50);

      if (activitiesError) throw activitiesError;

      const activities = activitiesData?.map((record: any) => ({
        id: record.id,
        borrowerName: record.profiles?.full_name || 'Unknown',
        itemName: record.items?.name || 'Unknown',
        purpose: record.purpose,
        status: record.status,
        requestedAt: record.requested_at,
        startTime: record.start_time,
        endTime: record.end_time,
        nim_nip: record.profiles?.nim_nip || '-',
        jurusan: record.profiles?.jurusan || '-',
        returnPhotoUrl: record.return_photo_url,
        returnCondition: record.return_condition,
      })) || [];

      setRecentActivities(activities);

    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast.error('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      // Delete from activity_logs first due to FK
      const { error: logsError } = await supabase
        .from('activity_logs')
        .delete()
        .eq('request_id', id);

      if (logsError) throw logsError;

      const { error } = await supabase
        .from('borrowing_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Riwayat berhasil dihapus');
      fetchReportData();
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast.error('Gagal menghapus riwayat');
    }
  };

  const handleDeleteAllHistory = async () => {
    try {
      // Delete all logs
      const { error: logsError } = await supabase
        .from('activity_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (logsError) throw logsError;

      // Delete all requests
      const { error } = await supabase
        .from('borrowing_requests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast.success('Semua riwayat berhasil dibersihkan');
      fetchReportData();
    } catch (error: any) {
      console.error('Error deleting all history:', error);
      toast.error('Gagal membersihkan riwayat');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Menunggu</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success">Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      case 'returned':
        return <Badge variant="outline" className="bg-muted/50">Dikembalikan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="/reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/reports">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Laporan Peminjaman</h1>
            <p className="text-muted-foreground">Statistik dan analisis peminjaman kunci & infokus</p>
          </div>
          <ExportReports
            stats={stats}
            itemStats={itemStats}
            departmentStats={departmentStats}
            recentActivities={recentActivities}
          />
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permintaan</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">Semua permintaan peminjaman</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalRequests > 0 
                  ? `${Math.round((stats.approvedRequests / stats.totalRequests) * 100)}% dari total`
                  : '0% dari total'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.rejectedRequests}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalRequests > 0 
                  ? `${Math.round((stats.rejectedRequests / stats.totalRequests) * 100)}% dari total`
                  : '0% dari total'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sedang Dipinjam</CardTitle>
              <KeyRound className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.activeLoans}</div>
              <p className="text-xs text-muted-foreground">Item yang sedang dipinjam</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sudah Dikembalikan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.returnedItems}</div>
              <p className="text-xs text-muted-foreground">Item yang sudah kembali</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.overdueItems}</div>
              <p className="text-xs text-muted-foreground">Melewati batas waktu</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics Tabs */}
        <Tabs defaultValue="items" className="space-y-4">
          <TabsList>
            <TabsTrigger value="items">Statistik Item</TabsTrigger>
            <TabsTrigger value="departments">Statistik Jurusan</TabsTrigger>
            <TabsTrigger value="history">Riwayat Lengkap</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistik Peminjaman per Item</CardTitle>
                <CardDescription>Daftar item yang paling sering dipinjam</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Item</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Total Dipinjam</TableHead>
                      <TableHead>Status Saat Ini</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Belum ada data peminjaman
                        </TableCell>
                      </TableRow>
                    ) : (
                      itemStats.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.itemType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <BarChart3 className="mr-2 h-4 w-4 text-primary" />
                              {item.totalBorrowed}x
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={item.currentStatus === 'tersedia' ? 'outline' : 'secondary'}
                              className={item.currentStatus === 'tersedia' ? 'bg-success/10 text-success border-success' : ''}
                            >
                              {item.currentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistik Peminjaman per Jurusan</CardTitle>
                <CardDescription>Analisis peminjaman berdasarkan jurusan/departemen</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jurusan</TableHead>
                      <TableHead>Total Permintaan</TableHead>
                      <TableHead>Disetujui</TableHead>
                      <TableHead>Tingkat Persetujuan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Belum ada data peminjaman
                        </TableCell>
                      </TableRow>
                    ) : (
                      departmentStats.map((dept, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                              {dept.jurusan}
                            </div>
                          </TableCell>
                          <TableCell>{dept.totalRequests}</TableCell>
                          <TableCell className="text-success">{dept.approvedRequests}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(dept.approvedRequests / dept.totalRequests) * 100} 
                                className="h-2 w-[100px]"
                                indicatorClassName="bg-success"
                              />
                              <span className="text-sm min-w-[35px]">
                                {Math.round((dept.approvedRequests / dept.totalRequests) * 100)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Riwayat Peminjaman Lengkap</CardTitle>
                    <CardDescription>50 aktivitas peminjaman terbaru</CardDescription>
                  </div>
                  {userRole === 'admin' && recentActivities.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Hapus Semua Riwayat
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Apakah Anda yakin?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini akan menghapus seluruh data riwayat peminjaman secara permanen. Statistik laporan juga akan terpengaruh.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAllHistory}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Hapus Semua
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Peminjam</TableHead>
                      <TableHead>NIM/NIP</TableHead>
                      <TableHead>Jurusan</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Keperluan</TableHead>
                      <TableHead>Waktu Pinjam</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bukti</TableHead>
                      {userRole === 'admin' && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Belum ada aktivitas peminjaman
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="text-sm">
                            {format(new Date(activity.requestedAt), 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell className="font-medium">{activity.borrowerName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{activity.nim_nip}</TableCell>
                          <TableCell className="text-sm">{activity.jurusan}</TableCell>
                          <TableCell>{activity.itemName}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{activity.purpose}</TableCell>
                          <TableCell className="text-sm">
                            <div className="space-y-1">
                              <div>{format(new Date(activity.startTime), 'dd/MM HH:mm', { locale: id })}</div>
                              <div className="text-muted-foreground">
                                s/d {format(new Date(activity.endTime), 'dd/MM HH:mm', { locale: id })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(activity.status)}</TableCell>
                          <TableCell>
                            {activity.returnPhotoUrl ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                                    <Camera className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                  <DialogHeader>
                                    <DialogTitle>Bukti Pengembalian</DialogTitle>
                                    <DialogDescription>
                                      Kondisi: {activity.returnCondition || 'Tidak ada catatan'}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="mt-2">
                                    <img 
                                      src={activity.returnPhotoUrl} 
                                      alt="Bukti" 
                                      className="w-full h-auto rounded-md border" 
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          {userRole === 'admin' && (
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Riwayat</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Hapus data peminjaman oleh <strong>{activity.borrowerName}</strong> ({activity.itemName})?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteActivity(activity.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
