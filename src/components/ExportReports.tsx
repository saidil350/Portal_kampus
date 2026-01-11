import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
}

interface ExportReportsProps {
  stats: BorrowingStats;
  itemStats: ItemStats[];
  departmentStats: DepartmentStats[];
  recentActivities: RecentActivity[];
}

const statusLabels: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  returned: 'Dikembalikan',
  pending_return: 'Menunggu Verifikasi',
};

export const ExportReports = ({
  stats,
  itemStats,
  departmentStats,
  recentActivities,
}: ExportReportsProps) => {
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: id });
  const fileName = `Laporan_Peminjaman_${format(new Date(), 'yyyy-MM-dd')}`;

  const exportToPDF = () => {
    try {
      // Debug: Log data yang akan di-export
      console.log('=== DEBUG EXPORT PDF ===');
      console.log('Recent Activities:', recentActivities);
      console.log('Borrower Names:', recentActivities.map(a => ({ id: a.id, borrowerName: a.borrowerName })));
      console.log('========================');
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN PEMINJAMAN', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistem Manajemen Kunci & Infokus', 105, 28, { align: 'center' });
      doc.text(`Tanggal: ${currentDate}`, 105, 36, { align: 'center' });
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(14, 42, 196, 42);

      // Summary Statistics
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Ringkasan Statistik', 14, 52);
      
      autoTable(doc, {
        startY: 56,
        head: [['Kategori', 'Jumlah']],
        body: [
          ['Total Permintaan', String(stats.totalRequests || 0)],
          ['Disetujui', String(stats.approvedRequests || 0)],
          ['Ditolak', String(stats.rejectedRequests || 0)],
          ['Sedang Dipinjam', String(stats.activeLoans || 0)],
          ['Sudah Dikembalikan', String(stats.returnedItems || 0)],
          ['Terlambat', String(stats.overdueItems || 0)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Item Statistics
      let currentY = (doc as any).lastAutoTable?.finalY || 100;
      currentY += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Statistik Per Item', 14, currentY);
      
      if (itemStats && itemStats.length > 0) {
        autoTable(doc, {
          startY: currentY + 4,
          head: [['Nama Item', 'Tipe', 'Total Dipinjam', 'Status']],
          body: itemStats.map(item => [
            item.itemName || '-',
            (item.itemType || '-').charAt(0).toUpperCase() + (item.itemType || '-').slice(1),
            String(item.totalBorrowed || 0) + 'x',
            (item.currentStatus || '-').charAt(0).toUpperCase() + (item.currentStatus || '-').slice(1),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
        currentY = (doc as any).lastAutoTable?.finalY || currentY + 50;
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Tidak ada data item', 14, currentY + 10);
        currentY += 20;
      }

      // Department Statistics
      currentY += 15;
      
      // Check if need new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Statistik Per Jurusan', 14, currentY);
      
      if (departmentStats && departmentStats.length > 0) {
        autoTable(doc, {
          startY: currentY + 4,
          head: [['Jurusan', 'Total Permintaan', 'Disetujui', 'Tingkat Persetujuan']],
          body: departmentStats.map(dept => [
            dept.jurusan || '-',
            String(dept.totalRequests || 0),
            String(dept.approvedRequests || 0),
            dept.totalRequests > 0 ? Math.round((dept.approvedRequests / dept.totalRequests) * 100) + '%' : '0%',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Tidak ada data jurusan', 14, currentY + 10);
      }

      // Recent Activities (new page)
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Riwayat Peminjaman', 14, 20);
      
      if (recentActivities && recentActivities.length > 0) {
        autoTable(doc, {
          startY: 24,
          head: [['Tanggal', 'Peminjam', 'NIM/NIP', 'Item', 'Status']],
          body: recentActivities.slice(0, 30).map(activity => [
            activity.requestedAt ? format(new Date(activity.requestedAt), 'dd/MM/yyyy') : '-',
            activity.borrowerName || '-',
            activity.nim_nip || '-',
            activity.itemName || '-',
            statusLabels[activity.status] || activity.status || '-',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 },
        });
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Tidak ada riwayat peminjaman', 14, 30);
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Halaman ${i} dari ${pageCount} | Dicetak: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save PDF with proper filename using blob
      const pdfBlob = doc.output('blob');
      const pdfFileName = `Laporan_Peminjaman_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      saveAs(pdfBlob, pdfFileName);
      
      toast.success('Laporan PDF berhasil diunduh');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat laporan PDF: ' + (error as Error).message);
    }
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary Statistics
      const summaryData = [
        ['LAPORAN PEMINJAMAN'],
        ['Sistem Manajemen Kunci & Infokus'],
        [`Tanggal: ${currentDate}`],
        [''],
        ['RINGKASAN STATISTIK'],
        ['Kategori', 'Jumlah'],
        ['Total Permintaan', stats.totalRequests],
        ['Disetujui', stats.approvedRequests],
        ['Ditolak', stats.rejectedRequests],
        ['Sedang Dipinjam', stats.activeLoans],
        ['Sudah Dikembalikan', stats.returnedItems],
        ['Terlambat', stats.overdueItems],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      // Sheet 2: Item Statistics
      const itemData = [
        ['STATISTIK PER ITEM'],
        ['Nama Item', 'Tipe', 'Total Dipinjam', 'Status Saat Ini'],
        ...itemStats.map(item => [
          item.itemName,
          item.itemType,
          item.totalBorrowed,
          item.currentStatus,
        ]),
      ];
      const wsItems = XLSX.utils.aoa_to_sheet(itemData);
      wsItems['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsItems, 'Statistik Item');

      // Sheet 3: Department Statistics
      const deptData = [
        ['STATISTIK PER JURUSAN'],
        ['Jurusan', 'Total Permintaan', 'Disetujui', 'Tingkat Persetujuan'],
        ...departmentStats.map(dept => [
          dept.jurusan,
          dept.totalRequests,
          dept.approvedRequests,
          `${Math.round((dept.approvedRequests / dept.totalRequests) * 100)}%`,
        ]),
      ];
      const wsDept = XLSX.utils.aoa_to_sheet(deptData);
      wsDept['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsDept, 'Statistik Jurusan');

      // Sheet 4: All Activities
      const activityData = [
        ['RIWAYAT PEMINJAMAN LENGKAP'],
        ['Tanggal', 'Peminjam', 'NIM/NIP', 'Jurusan', 'Item', 'Keperluan', 'Waktu Mulai', 'Waktu Selesai', 'Status'],
        ...recentActivities.map(activity => [
          format(new Date(activity.requestedAt), 'dd/MM/yyyy'),
          activity.borrowerName,
          activity.nim_nip,
          activity.jurusan,
          activity.itemName,
          activity.purpose,
          format(new Date(activity.startTime), 'dd/MM/yyyy HH:mm'),
          format(new Date(activity.endTime), 'dd/MM/yyyy HH:mm'),
          statusLabels[activity.status] || activity.status,
        ]),
      ];
      const wsActivity = XLSX.utils.aoa_to_sheet(activityData);
      wsActivity['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
        { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, wsActivity, 'Riwayat Lengkap');

      // Generate file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `${fileName}.xlsx`);
      
      toast.success('Laporan Excel berhasil diunduh');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Gagal membuat laporan Excel');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Laporan
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-500" />
          Export ke PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-500" />
          Export ke Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
