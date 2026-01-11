import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, User, MapPin, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface BookingEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    borrowerName: string;
    borrowerId: string;
    itemName: string;
    itemType: string;
    roomName: string;
    purpose: string;
    status: string;
  };
}

interface Item {
  id: string;
  name: string;
  type: string;
  room_name: string;
}

const Calendar = () => {
  const { userRole } = useAuth();
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    fetchItems();
    fetchBookings();

    // Setup realtime subscription
    const channel = supabase
      .channel('calendar-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrowing_requests' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedItem, selectedType, userRole]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('id, name, type, room_name')
      .order('name');

    if (error) {
      toast.error('Gagal memuat daftar item');
      console.error(error);
    } else {
      setItems(data || []);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    
    let query = supabase
      .from('borrowing_requests')
      .select(`
        id,
        start_time,
        end_time,
        purpose,
        status,
        item_id,
        items (id, name, type, room_name),
        profiles!borrowing_requests_borrower_id_fkey (id, full_name)
      `)
      .in('status', ['approved', 'pending', 'pending_return'])
      .order('start_time');

    // Filter by item
    if (selectedItem !== 'all') {
      query = query.eq('item_id', selectedItem);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Gagal memuat data booking');
      console.error(error);
      setLoading(false);
      return;
    }

    // Filter by type if needed
    let filteredData = data || [];
    if (selectedType !== 'all') {
      filteredData = filteredData.filter((booking: any) => booking.items?.type === selectedType);
    }

    // Transform to calendar events
    const calendarEvents: BookingEvent[] = filteredData.map((booking: any) => {
      const statusColors = getStatusColor(booking.status);
      const itemName = booking.items?.name || 'Unknown';
      const roomName = booking.items?.room_name || 'Unknown';
      const borrowerName = booking.profiles?.full_name || 'Unknown';
      const itemType = booking.items?.type || 'unknown';
      
      // Untuk admin, tampilkan informasi lengkap (nama item, ruangan, peminjam)
      // Untuk user lain, tampilkan nama item dan peminjam saja
      const eventTitle = userRole === 'admin' 
        ? `📍${roomName} • ${itemType === 'infokus' ? '📺' : '🔑'}${itemName} • 👤${borrowerName}`
        : `${itemName} - ${borrowerName}`;
      
      return {
        id: booking.id,
        title: eventTitle,
        start: booking.start_time,
        end: booking.end_time,
        backgroundColor: statusColors.bg,
        borderColor: statusColors.border,
        textColor: statusColors.text,
        extendedProps: {
          borrowerName: borrowerName,
          borrowerId: booking.profiles?.id || '',
          itemName: itemName,
          itemType: itemType,
          roomName: roomName,
          purpose: booking.purpose,
          status: booking.status,
        },
      };
    });

    setEvents(calendarEvents);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#22c55e', border: '#16a34a', text: '#ffffff' }; // Green
      case 'pending':
        return { bg: '#f59e0b', border: '#d97706', text: '#ffffff' }; // Yellow/Orange
      case 'pending_return':
        return { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' }; // Blue
      default:
        return { bg: '#6b7280', border: '#4b5563', text: '#ffffff' }; // Gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'pending':
        return 'Menunggu Persetujuan';
      case 'pending_return':
        return 'Menunggu Verifikasi Pengembalian';
      default:
        return status;
    }
  };

  const handleEventClick = (info: any) => {
    const event = events.find(e => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setDetailDialogOpen(true);
    }
  };

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

  // Custom render function untuk event content
  const renderEventContent = (eventInfo: any) => {
    const { extendedProps } = eventInfo.event;
    const timeText = eventInfo.timeText;
    
    if (userRole === 'admin') {
      return (
        <div className="fc-event-main-custom p-1 overflow-hidden text-xs leading-tight">
          <div className="font-bold truncate">{timeText}</div>
          <div className="truncate flex items-center gap-1">
            <span className="text-[10px]">📍</span>
            <span className="font-medium">{extendedProps.roomName}</span>
          </div>
          <div className="truncate flex items-center gap-1">
            <span className="text-[10px]">{extendedProps.itemType === 'infokus' ? '📺' : '🔑'}</span>
            <span>{extendedProps.itemName}</span>
          </div>
          <div className="truncate flex items-center gap-1 opacity-80">
            <span className="text-[10px]">👤</span>
            <span>{extendedProps.borrowerName}</span>
          </div>
        </div>
      );
    }
    
    // Default render untuk non-admin
    return (
      <div className="fc-event-main-custom p-1 overflow-hidden text-xs">
        <div className="font-bold truncate">{timeText}</div>
        <div className="truncate">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <DashboardLayout currentPage="/calendar">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Kalender Booking
          </h2>
          <p className="text-muted-foreground">
            Lihat jadwal peminjaman dalam format kalender
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe Item</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="kunci">Kunci</SelectItem>
                    <SelectItem value="infokus">Infokus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Spesifik</label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Item</SelectItem>
                    {items
                      .filter(item => selectedType === 'all' || item.type === selectedType)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - {item.room_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Legenda Status</label>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-amber-500 hover:bg-amber-500">Pending</Badge>
                  <Badge className="bg-green-500 hover:bg-green-500">Disetujui</Badge>
                  <Badge className="bg-blue-500 hover:bg-blue-500">Pengembalian</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Jadwal Peminjaman</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Hari Ini
                </Button>
                <Button variant="outline" size="sm" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              Klik pada event untuk melihat detail peminjaman
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[500px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="calendar-container">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={{
                    left: 'title',
                    center: '',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }}
                  locale="id"
                  firstDay={1}
                  slotMinTime="06:00:00"
                  slotMaxTime="22:00:00"
                  allDaySlot={false}
                  weekends={true}
                  events={events}
                  eventClick={handleEventClick}
                  eventContent={renderEventContent}
                  height="auto"
                  aspectRatio={1.8}
                  slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }}
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }}
                  dayHeaderFormat={{
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  }}
                  buttonText={{
                    today: 'Hari Ini',
                    month: 'Bulan',
                    week: 'Minggu',
                    day: 'Hari',
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Detail Peminjaman
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang peminjaman ini
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Item:</span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedEvent.extendedProps.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.extendedProps.roomName} ({selectedEvent.extendedProps.itemType})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Peminjam:</span>
                  </div>
                  <p className="font-medium">{selectedEvent.extendedProps.borrowerName}</p>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Waktu:</span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {format(new Date(selectedEvent.start), 'EEEE, dd MMMM yyyy', { locale: id })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedEvent.start), 'HH:mm', { locale: id })} - {format(new Date(selectedEvent.end), 'HH:mm', { locale: id })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span className="text-sm">Keperluan:</span>
                  </div>
                  <p className="text-sm">{selectedEvent.extendedProps.purpose}</p>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm">Status:</span>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: selectedEvent.backgroundColor,
                      color: selectedEvent.textColor,
                    }}
                  >
                    {getStatusLabel(selectedEvent.extendedProps.status)}
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
