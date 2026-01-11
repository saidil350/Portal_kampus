import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KeyRound, Projector, Search, Package, Clock, CheckCircle, AlertCircle, XCircle, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AddItemButton, ItemActions } from '@/components/ItemManagement';

interface Item {
  id: string;
  name: string;
  type: string;
  room_name: string;
  status: string;
  condition_notes?: string;
  created_at: string;
}

const Items = () => {
  const { userRole } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [startDay, setStartDay] = useState('');
  const [startTimeHour, setStartTimeHour] = useState('');
  const [endTimeHour, setEndTimeHour] = useState('');

  // Function to get next date for a given day name
  const getNextDateForDay = (dayName: string, baseDate: Date = new Date()): Date => {
    const daysMap: { [key: string]: number } = {
      'minggu': 0,
      'senin': 1,
      'selasa': 2,
      'rabu': 3,
      'kamis': 4,
      'jumat': 5,
      'sabtu': 6,
    };
    
    const targetDay = daysMap[dayName.toLowerCase()];
    const currentDay = baseDate.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    const resultDate = new Date(baseDate);
    resultDate.setDate(baseDate.getDate() + (daysUntilTarget === 0 ? 0 : daysUntilTarget));
    return resultDate;
  };

  useEffect(() => {
    fetchItems();

    // Setup realtime subscription
    const channel = supabase
      .channel('items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, filterStatus, filterType, items]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Gagal memuat data item');
      console.error(error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const filterItems = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.room_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    setFilteredItems(filtered);
  };

  const handleBorrowRequest = async () => {
    if (!selectedItem || !purpose || !startDay || !startTimeHour || !endTimeHour) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    // Validasi waktu: jam selesai harus lebih besar dari jam mulai
    const [startHour, startMinute] = startTimeHour.split(':').map(Number);
    const [endHour, endMinute] = endTimeHour.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      toast.error('Jam selesai harus lebih besar dari jam mulai');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Calculate date from selected day
    const borrowDate = getNextDateForDay(startDay);
    
    // Set time to the calculated date (same day for start and end)
    const startDateTime = new Date(borrowDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(borrowDate); // Same day
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Check for double-booking (overlapping time slots)
    const { data: existingBookings, error: checkError } = await supabase
      .from('borrowing_requests')
      .select('id, start_time, end_time, status')
      .eq('item_id', selectedItem.id)
      .in('status', ['approved', 'pending', 'pending_return'])
      .gte('end_time', startDateTime.toISOString())
      .lte('start_time', endDateTime.toISOString());

    if (checkError) {
      toast.error('Gagal memeriksa ketersediaan jadwal');
      console.error(checkError);
      return;
    }

    // Check if any booking overlaps with the requested time
    const hasConflict = existingBookings?.some(booking => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      
      // Check overlap: A overlaps B if A.start < B.end AND A.end > B.start
      return startDateTime < bookingEnd && endDateTime > bookingStart;
    });

    if (hasConflict) {
      toast.error('Jadwal bentrok! Item sudah dibooking pada waktu tersebut. Silakan pilih waktu lain.', {
        duration: 5000,
      });
      return;
    }

    const { error: requestError } = await supabase
      .from('borrowing_requests')
      .insert({
        item_id: selectedItem.id,
        borrower_id: userData.user.id,
        purpose,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });

    if (requestError) {
      toast.error('Gagal membuat permintaan');
      console.error(requestError);
      return;
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      request_id: (await supabase.from('borrowing_requests').select('id').order('created_at', { ascending: false }).limit(1).single()).data?.id,
      action: 'request',
      performed_by: userData.user.id,
      notes: `Mengajukan peminjaman ${selectedItem.name}`,
    });

    toast.success('Permintaan peminjaman berhasil dibuat');
    setBorrowDialogOpen(false);
    setPurpose('');
    setStartDay('');
    setStartTimeHour('');
    setEndTimeHour('');
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'kunci':
        return <KeyRound className="h-5 w-5 text-primary" />;
      case 'infokus':
        return <Projector className="h-5 w-5 text-primary" />;
      default:
        return <Package className="h-5 w-5 text-primary" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'tersedia':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'dipinjam':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'rusak':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      tersedia: { variant: 'default', label: 'Tersedia' },
      dipinjam: { variant: 'secondary', label: 'Dipinjam' },
      overdue: { variant: 'destructive', label: 'Overdue' },
      rusak: { variant: 'destructive', label: 'Rusak' },
    };

    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout currentPage="/items">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Daftar Item</h2>
            <p className="text-muted-foreground">Kelola kunci dan infokus sekolah</p>
          </div>
          <AddItemButton onItemChanged={fetchItems} userRole={userRole} />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Cari</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nama item atau ruangan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="tersedia">Tersedia</SelectItem>
                    <SelectItem value="dipinjam">Dipinjam</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="rusak">Rusak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="kunci">Kunci</SelectItem>
                    <SelectItem value="infokus">Infokus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Memuat data...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada item ditemukan</p>
        ) : (
          <div className="space-y-8">
            {/* Kunci Ruangan Section */}
            {(filterType === 'all' || filterType === 'kunci') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Kunci Ruangan</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.filter(item => item.type === 'kunci').length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground py-4">Tidak ada kunci ditemukan</p>
                  ) : (
                    filteredItems.filter(item => item.type === 'kunci').map((item) => (
                      <Card key={item.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getItemIcon(item.type)}
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(item.status)}
                              <ItemActions item={item} onItemChanged={fetchItems} userRole={userRole} />
                            </div>
                          </div>
                          <CardDescription>{item.room_name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tipe:</span>
                            <Badge variant="outline" className="capitalize">{item.type}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            {getStatusBadge(item.status)}
                          </div>
                          {item.condition_notes && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Catatan: {item.condition_notes}
                            </p>
                          )}
                          {item.status === 'tersedia' && (
                            <Dialog open={borrowDialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                              setBorrowDialogOpen(open);
                              if (open) setSelectedItem(item);
                            }}>
                              <DialogTrigger asChild>
                                <Button className="w-full mt-2">
                                  <Clock className="mr-2 h-4 w-4" />
                                  Pinjam
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Pinjam {item.name}</DialogTitle>
                                  <DialogDescription>
                                    Isi detail peminjaman untuk {item.room_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Tujuan Peminjaman</Label>
                                    <Textarea
                                      placeholder="Contoh: Kuliah Pemrograman Web"
                                      value={purpose}
                                      onChange={(e) => setPurpose(e.target.value)}
                                    />
                                  </div>
                                    <div className="bg-muted/50 p-4 rounded-xl space-y-4 border border-border/50">
                                      {/* Day Selection */}
                                      <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-primary">
                                          <Calendar className="w-4 h-4" />
                                          Hari Peminjaman
                                        </Label>
                                        <Select value={startDay} onValueChange={setStartDay}>
                                          <SelectTrigger className="bg-background border-input hover:bg-accent/50 transition-colors">
                                            <SelectValue placeholder="Pilih hari kuliah" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="senin">Senin</SelectItem>
                                            <SelectItem value="selasa">Selasa</SelectItem>
                                            <SelectItem value="rabu">Rabu</SelectItem>
                                            <SelectItem value="kamis">Kamis</SelectItem>
                                            <SelectItem value="jumat">Jumat</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Time Selection */}
                                      <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground ml-1">Jam Mulai</Label>
                                          <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                              type="time"
                                              value={startTimeHour}
                                              onChange={(e) => setStartTimeHour(e.target.value)}
                                              className="pl-9 bg-background border-input hover:bg-accent/50 transition-colors cursor-pointer"
                                            />
                                          </div>
                                        </div>
                                        
                                        <div className="pb-3 text-muted-foreground flex justify-center">
                                          <ArrowRight className="w-4 h-4" />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground ml-1">Jam Selesai</Label>
                                          <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                              type="time"
                                              value={endTimeHour}
                                              onChange={(e) => setEndTimeHour(e.target.value)}
                                              className="pl-9 bg-background border-input hover:bg-accent/50 transition-colors cursor-pointer"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleBorrowRequest}>
                                    Ajukan Peminjaman
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Infokus Section */}
            {(filterType === 'all' || filterType === 'infokus') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Projector className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Infokus</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.filter(item => item.type === 'infokus').length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground py-4">Tidak ada infokus ditemukan</p>
                  ) : (
                    filteredItems.filter(item => item.type === 'infokus').map((item) => (
                      <Card key={item.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getItemIcon(item.type)}
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(item.status)}
                              <ItemActions item={item} onItemChanged={fetchItems} userRole={userRole} />
                            </div>
                          </div>
                          <CardDescription>{item.room_name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tipe:</span>
                            <Badge variant="outline" className="capitalize">{item.type}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            {getStatusBadge(item.status)}
                          </div>
                          {item.condition_notes && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Catatan: {item.condition_notes}
                            </p>
                          )}
                          {item.status === 'tersedia' && (
                            <Dialog open={borrowDialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                              setBorrowDialogOpen(open);
                              if (open) setSelectedItem(item);
                            }}>
                              <DialogTrigger asChild>
                                <Button className="w-full mt-2">
                                  <Clock className="mr-2 h-4 w-4" />
                                  Pinjam
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Pinjam {item.name}</DialogTitle>
                                  <DialogDescription>
                                    Isi detail peminjaman untuk {item.room_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Tujuan Peminjaman</Label>
                                    <Textarea
                                      placeholder="Contoh: Kuliah Pemrograman Web"
                                      value={purpose}
                                      onChange={(e) => setPurpose(e.target.value)}
                                    />
                                  </div>
                                    <div className="bg-muted/50 p-4 rounded-xl space-y-4 border border-border/50">
                                      {/* Day Selection */}
                                      <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-primary">
                                          <Calendar className="w-4 h-4" />
                                          Hari Peminjaman
                                        </Label>
                                        <Select value={startDay} onValueChange={setStartDay}>
                                          <SelectTrigger className="bg-background border-input hover:bg-accent/50 transition-colors">
                                            <SelectValue placeholder="Pilih hari kuliah" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="senin">Senin</SelectItem>
                                            <SelectItem value="selasa">Selasa</SelectItem>
                                            <SelectItem value="rabu">Rabu</SelectItem>
                                            <SelectItem value="kamis">Kamis</SelectItem>
                                            <SelectItem value="jumat">Jumat</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Time Selection */}
                                      <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground ml-1">Jam Mulai</Label>
                                          <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                              type="time"
                                              value={startTimeHour}
                                              onChange={(e) => setStartTimeHour(e.target.value)}
                                              className="pl-9 bg-background border-input hover:bg-accent/50 transition-colors cursor-pointer"
                                            />
                                          </div>
                                        </div>
                                        
                                        <div className="pb-3 text-muted-foreground flex justify-center">
                                          <ArrowRight className="w-4 h-4" />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground ml-1">Jam Selesai</Label>
                                          <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                              type="time"
                                              value={endTimeHour}
                                              onChange={(e) => setEndTimeHour(e.target.value)}
                                              className="pl-9 bg-background border-input hover:bg-accent/50 transition-colors cursor-pointer"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleBorrowRequest}>
                                    Ajukan Peminjaman
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Items;