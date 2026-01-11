import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const runSeedData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('seed-data');
      
      if (error) throw error;
      
      setResult(data);
      toast({
        title: "Berhasil!",
        description: "Data berhasil di-seed ke database",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menjalankan seed data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Seed Database
          </CardTitle>
          <CardDescription>
            Jalankan fungsi ini untuk membuat data test di database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>User Test yang akan dibuat:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Guru: guru@sekolah.ac.id (password: password123)</li>
                <li>Siswa: siswa@sekolah.ac.id (password: password123)</li>
                <li>Admin: admin@sekolah.ac.id (password: password123)</li>
                <li>+ 5 Dosen dan ratusan mahasiswa lainnya</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runSeedData} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sedang memproses...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Jalankan Seed Data
              </>
            )}
          </Button>

          {result && (
            <Alert className="border-green-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <strong>Selesai!</strong>
                <div className="mt-2 space-y-1">
                  <p>✓ Test Users: {result.stats?.test_users || 0}</p>
                  <p>✓ Admins: {result.stats?.admins || 0}</p>
                  <p>✓ Dosen: {result.stats?.dosen || 0}</p>
                  <p>✓ Mahasiswa: {result.stats?.mahasiswa || 0}</p>
                  <p>✓ Items: {result.stats?.items || 0}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;
