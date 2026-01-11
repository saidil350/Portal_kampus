import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, MoreVertical, Pencil, Trash2, Wrench, CheckCircle } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  type: string;
  room_name: string;
  status: string;
  condition_notes?: string;
}

interface ItemManagementProps {
  onItemChanged: () => void;
  userRole: string | null;
}

export const AddItemButton = ({ onItemChanged, userRole }: ItemManagementProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'kunci',
    room_name: '',
    condition_notes: '',
  });

  if (userRole !== 'admin' && userRole !== 'guru') {
    return null;
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.room_name) {
      toast.error('Nama item dan ruangan harus diisi');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('items').insert({
        name: formData.name,
        type: formData.type,
        room_name: formData.room_name,
        condition_notes: formData.condition_notes || null,
        status: 'tersedia',
      });

      if (error) throw error;

      toast.success('Item berhasil ditambahkan');
      setOpen(false);
      setFormData({ name: '', type: 'kunci', room_name: '', condition_notes: '' });
      onItemChanged();
    } catch (error: any) {
      toast.error('Gagal menambahkan item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Item Baru</DialogTitle>
          <DialogDescription>
            Masukkan informasi item baru yang akan ditambahkan
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Item *</Label>
            <Input
              id="name"
              placeholder="Contoh: Kunci Lab TKJ 1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipe Item *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kunci">Kunci</SelectItem>
                <SelectItem value="infokus">Infokus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room">Nama Ruangan *</Label>
            <Input
              id="room"
              placeholder="Contoh: Lab TKJ 1"
              value={formData.room_name}
              onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Kondisi (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Catatan tentang kondisi item..."
              value={formData.condition_notes}
              onChange={(e) => setFormData({ ...formData, condition_notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ItemActionsProps {
  item: Item;
  onItemChanged: () => void;
  userRole: string | null;
}

export const ItemActions = ({ item, onItemChanged, userRole }: ItemActionsProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item.name,
    type: item.type,
    room_name: item.room_name,
    condition_notes: item.condition_notes || '',
  });
  const [newStatus, setNewStatus] = useState(item.status);

  if (userRole !== 'admin' && userRole !== 'guru') {
    return null;
  }

  const handleEdit = async () => {
    if (!formData.name || !formData.room_name) {
      toast.error('Nama item dan ruangan harus diisi');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({
          name: formData.name,
          type: formData.type,
          room_name: formData.room_name,
          condition_notes: formData.condition_notes || null,
        })
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Item berhasil diperbarui');
      setEditOpen(false);
      onItemChanged();
    } catch (error: any) {
      toast.error('Gagal memperbarui item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('items').delete().eq('id', item.id);

      if (error) throw error;

      toast.success('Item berhasil dihapus');
      setDeleteOpen(false);
      onItemChanged();
    } catch (error: any) {
      toast.error('Gagal menghapus item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: newStatus as 'tersedia' | 'dipinjam' | 'overdue' | 'rusak' })
        .eq('id', item.id);

      if (error) throw error;

      toast.success(`Status berhasil diubah menjadi "${newStatus}"`);
      setStatusOpen(false);
      onItemChanged();
    } catch (error: any) {
      toast.error('Gagal mengubah status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Item
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusOpen(true)}>
            <Wrench className="mr-2 h-4 w-4" />
            Ubah Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Perbarui informasi item "{item.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Item *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Tipe Item *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kunci">Kunci</SelectItem>
                  <SelectItem value="infokus">Infokus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-room">Nama Ruangan *</Label>
              <Input
                id="edit-room"
                value={formData.room_name}
                onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Catatan Kondisi</Label>
              <Textarea
                id="edit-notes"
                value={formData.condition_notes}
                onChange={(e) => setFormData({ ...formData, condition_notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Ubah Status Item</DialogTitle>
            <DialogDescription>
              Pilih status baru untuk "{item.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tersedia">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Tersedia
                  </div>
                </SelectItem>
                <SelectItem value="rusak">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-destructive" />
                    Rusak / Maintenance
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleStatusChange} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus "{item.name}"? 
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua riwayat peminjaman terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
