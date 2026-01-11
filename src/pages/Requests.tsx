import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { CheckCircle, XCircle, Clock, User, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BorrowingRequest {
  id: string;
  purpose: string;
  requested_at: string;
  start_time: string;
  end_time: string;
  status: string;
  approval_notes?: string;
  return_condition?: string;
  return_photo_url?: string;
  returned_at?: string;
  item_id: string;
  items: {
    name: string;
    type: string;
    room_name: string;
  };
  profiles: {
    full_name: string;
    nim_nip?: string;
  };
}

const Requests = () => {
  const { userRole, profile } = useAuth();
  const [requests, setRequests] = useState<BorrowingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<BorrowingRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");

  useEffect(() => {
    fetchRequests();

    // Setup realtime subscription
    const channel = supabase
      .channel("requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrowing_requests" },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, profile?.id]);

  const fetchRequests = async () => {
    setLoading(true);
    
    // Build query based on role
    let query = supabase
      .from("borrowing_requests")
      .select(
        `
        *,
        items(name, type, room_name),
        profiles!borrowing_requests_borrower_id_fkey(full_name, nim_nip)
      `
      )
      .order("requested_at", { ascending: false });

    // Siswa hanya bisa melihat request mereka sendiri
    if (userRole === 'siswa' && profile?.id) {
      query = query.eq('borrower_id', profile.id);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Gagal memuat permintaan");
      console.error(error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleApproveReject = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error: updateError } = await supabase
      .from("borrowing_requests")
      .update({
        status,
        approved_by: userData.user.id,
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes,
      })
      .eq("id", requestId);

    if (updateError) {
      toast.error("Gagal memproses permintaan");
      console.error(updateError);
      return;
    }

    // Update item status if approved
    if (status === "approved" && selectedRequest) {
      await supabase
        .from("items")
        .update({ status: "dipinjam" })
        .eq("id", selectedRequest.item_id); // Fixed: gunakan item_id, bukan items.name
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      request_id: requestId,
      action: status === "approved" ? "approve" : "reject",
      performed_by: userData.user.id,
      notes: approvalNotes,
    });

    toast.success(
      status === "approved" ? "Permintaan disetujui" : "Permintaan ditolak"
    );
    setDialogOpen(false);
    setApprovalNotes("");
    fetchRequests(); // Removed duplicate call
  };

  const handleReturnVerification = async (
    requestId: string,
    itemId: string
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // 1. Update request status to 'returned'
    const { error: updateRequestError } = await supabase
      .from("borrowing_requests")
      .update({
        status: "returned", // Final status
        // approved_by for return verification could be useful but we might need a separate column or just rely on activity logs
      })
      .eq("id", requestId);

    if (updateRequestError) {
      toast.error("Gagal memverifikasi pengembalian");
      console.error(updateRequestError);
      return;
    }

    // 2. Update item status to 'tersedia'
    const { error: updateItemError } = await supabase
      .from("items")
      .update({ status: "tersedia" })
      .eq("id", itemId);

    if (updateItemError) {
      toast.error("Gagal mengupdate status item");
      console.error(updateItemError);
      // Optional: rollback request status?
      return;
    }

    // 3. Log activity
    await supabase.from("activity_logs").insert({
      request_id: requestId,
      action: "verify_return",
      performed_by: userData.user.id,
      notes: "Verifikasi pengembalian disetujui",
    });

    toast.success("Pengembalian diverifikasi");
    fetchRequests();
  };

  const handleDeletePhoto = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("borrowing_requests")
        .update({ return_photo_url: null })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Foto berhasil dihapus dari database");
      fetchRequests();
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast.error("Gagal menghapus foto");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> =
      {
        pending: { variant: "secondary", label: "Pending", icon: Clock },
        approved: { variant: "default", label: "Disetujui", icon: CheckCircle },
        rejected: { variant: "destructive", label: "Ditolak", icon: XCircle },
        returned: {
          variant: "outline",
          label: "Dikembalikan",
          icon: CheckCircle,
        },
        pending_return: {
          variant: "warning",
          label: "Menunggu Verifikasi",
          icon: Clock,
        },
      };

    const config = variants[status] || {
      variant: "secondary",
      label: status,
      icon: Clock,
    };
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant as any}
        className="flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout currentPage="/requests">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Permintaan Peminjaman
          </h2>
          <p className="text-muted-foreground">
            {userRole === "siswa"
              ? "Riwayat permintaan Anda"
              : "Kelola permintaan peminjaman"}
          </p>
        </div>

        {/* Requests List */}
        {/* Requests List with Tabs */}
        <Tabs defaultValue="new-requests" className="w-full">
          {/* Siswa hanya melihat 1 tab, Admin/Guru melihat 2 tab */}
          {userRole === 'siswa' ? (
            <TabsList className="grid w-full grid-cols-1 mb-4">
              <TabsTrigger value="new-requests">Riwayat Permintaan</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="new-requests">Peminjaman Baru</TabsTrigger>
              <TabsTrigger value="returns">Verifikasi Pengembalian</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="new-requests" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Memuat data...
                  </p>
                </CardContent>
              </Card>
            ) : requests.filter((r) => r.status !== "pending_return").length ===
              0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Belum ada permintaan peminjaman baru
                  </p>
                </CardContent>
              </Card>
            ) : (
              requests
                .filter((r) => r.status !== "pending_return")
                .map((request) => (
                  <Card
                    key={request.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {request.items?.name} - {request.items?.room_name}
                          </CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {request.profiles?.full_name}
                              {request.profiles?.nim_nip &&
                                ` (${request.profiles.nim_nip})`}
                            </div>
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Tujuan:</p>
                        <p className="text-sm text-muted-foreground">
                          {request.purpose}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Waktu Mulai:</p>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(request.start_time),
                              "dd MMM yyyy, HH:mm",
                              { locale: id }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Waktu Selesai:</p>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(request.end_time),
                              "dd MMM yyyy, HH:mm",
                              { locale: id }
                            )}
                          </p>
                        </div>
                      </div>
                      {request.approval_notes && (
                        <div>
                          <p className="text-sm font-medium">
                            Catatan Approval:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.approval_notes}
                          </p>
                        </div>
                      )}
                      {request.status === "returned" && (
                        <div className="space-y-3 pt-2 border-t mt-2">
                          <p className="text-sm font-semibold">
                            Detail Pengembalian:
                          </p>
                          {request.returned_at && (
                            <p className="text-xs text-muted-foreground">
                              Waktu Kembali:{" "}
                              {format(
                                new Date(request.returned_at),
                                "dd MMM yyyy, HH:mm",
                                { locale: id }
                              )}
                            </p>
                          )}
                          {request.return_condition && (
                            <div>
                              <p className="text-sm font-medium">Kondisi:</p>
                              <p className="text-sm text-muted-foreground">
                                {request.return_condition}
                              </p>
                            </div>
                          )}
                          {request.return_photo_url && (
                            <div>
                              <p className="text-sm font-medium mb-2">
                                Bukti Foto:
                              </p>
                               <div className="relative group max-w-[200px]">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <div className="relative group cursor-zoom-in w-full h-32 rounded-md overflow-hidden border">
                                      <img
                                        src={request.return_photo_url}
                                        alt="Bukti Pengembalian"
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[600px] p-1">
                                    <img
                                      src={request.return_photo_url}
                                      alt="Bukti Pengembalian (Besar)"
                                      className="w-full h-auto rounded-sm"
                                    />
                                  </DialogContent>
                                </Dialog>
                                
                                {(userRole === 'admin' || userRole === 'guru') && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Foto Bukti?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tindakan ini akan menghapus tautan foto personal dari database. Pastikan ini adalah foto yang salah unggah.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeletePhoto(request.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                          Hapus Foto
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {request.status === "pending" &&
                        (userRole === "admin" || userRole === "guru") && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
                                setDialogOpen(true);
                              }}
                              className="flex-1"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Setujui
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request);
                                handleApproveReject(request.id, "rejected");
                              }}
                              className="flex-1"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Tolak
                            </Button>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          <TabsContent value="returns" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Memuat data...
                  </p>
                </CardContent>
              </Card>
            ) : requests.filter((r) => r.status === "pending_return").length ===
              0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Tidak ada permintaan verifikasi pengembalian
                  </p>
                </CardContent>
              </Card>
            ) : (
              requests
                .filter((r) => r.status === "pending_return")
                .map((request) => (
                  <Card
                    key={request.id}
                    className="hover:shadow-md transition-shadow border-l-4 border-l-warning"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {request.items?.name} - {request.items?.room_name}
                          </CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {request.profiles?.full_name}
                              {request.profiles?.nim_nip &&
                                ` (${request.profiles.nim_nip})`}
                            </div>
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-3 pt-2">
                        <p className="text-sm font-semibold">
                          Detail Pengembalian:
                        </p>
                        {request.returned_at && (
                          <p className="text-xs text-muted-foreground">
                            Waktu Kembali:{" "}
                            {format(
                              new Date(request.returned_at),
                              "dd MMM yyyy, HH:mm",
                              { locale: id }
                            )}
                          </p>
                        )}
                        {request.return_condition && (
                          <div>
                            <p className="text-sm font-medium">Kondisi:</p>
                            <p className="text-sm text-muted-foreground">
                              {request.return_condition}
                            </p>
                          </div>
                        )}
                        {request.return_photo_url && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Bukti Foto:
                            </p>
                             <div className="relative group max-w-[200px]">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div className="relative group cursor-zoom-in w-full h-32 rounded-md overflow-hidden border">
                                    <img
                                      src={request.return_photo_url}
                                      alt="Bukti Pengembalian"
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] p-1">
                                  <img
                                    src={request.return_photo_url}
                                    alt="Bukti Pengembalian (Besar)"
                                    className="w-full h-auto rounded-sm"
                                  />
                                </DialogContent>
                              </Dialog>

                              {(userRole === 'admin' || userRole === 'guru') && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      size="icon" 
                                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Foto Bukti?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tindakan ini akan menghapus tautan foto personal dari database.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeletePhoto(request.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Hapus Foto
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() =>
                            handleReturnVerification(
                              request.id,
                              request.item_id
                            )
                          }
                          className="w-full"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Verifikasi Pengembalian
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>

        {/* Approval Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Setujui Permintaan</DialogTitle>
              <DialogDescription>
                Tambahkan catatan untuk peminjaman ini (opsional)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  placeholder="Contoh: Harap kembalikan tepat waktu"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setApprovalNotes("");
                }}
              >
                Batal
              </Button>
              <Button
                onClick={() =>
                  selectedRequest &&
                  handleApproveReject(selectedRequest.id, "approved")
                }
              >
                Setujui
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Requests;
