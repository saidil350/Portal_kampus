import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting data seeding process...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Helper function to create user
    const createUser = async (email: string, password: string, fullName: string, metadata: any) => {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (userError) {
        console.error(`Error creating user ${email}:`, userError);
        return null;
      }

      console.log(`Created user: ${email}`);

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(metadata)
        .eq('id', userData.user.id);

      if (profileError) {
        console.error(`Error updating profile for ${email}:`, profileError);
      }

      return userData.user;
    };

    // Helper function to assign role
    const assignRole = async (userId: string, role: string) => {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        console.error(`Error assigning role ${role} to user ${userId}:`, error);
      }
    };

    // 1. Create test users (simple login)
    console.log('Creating test users...');
    const testGuru = await createUser(
      'guru@sekolah.ac.id',
      'password123',
      'Guru Test',
      { nim_nip: 'GURU001' }
    );
    if (testGuru) await assignRole(testGuru.id, 'guru');

    const testSiswa = await createUser(
      'siswa@sekolah.ac.id',
      'password123',
      'Siswa Test',
      { nim_nip: 'SISWA001' }
    );
    if (testSiswa) await assignRole(testSiswa.id, 'siswa');

    // 2. Create Admin users
    console.log('Creating admin users...');
    const admin1 = await createUser(
      'admin@sekolah.ac.id',
      'password123',
      'Admin Sistem',
      { nim_nip: 'ADM001' }
    );
    if (admin1) await assignRole(admin1.id, 'admin');

    const admin2 = await createUser(
      'admin2@sekolah.ac.id',
      'password123',
      'Admin Backup',
      { nim_nip: 'ADM002' }
    );
    if (admin2) await assignRole(admin2.id, 'admin');

    // 3. Create Guru/Dosen users
    console.log('Creating guru/dosen users...');
    const dosenData = [
      { email: 'dosen1@sekolah.ac.id', name: 'Dr. Budi Santoso, M.Kom', nip: 'DSN001' },
      { email: 'dosen2@sekolah.ac.id', name: 'Siti Rahayu, S.Kom, M.T', nip: 'DSN002' },
      { email: 'dosen3@sekolah.ac.id', name: 'Ahmad Fauzi, M.Eng', nip: 'DSN003' },
      { email: 'dosen4@sekolah.ac.id', name: 'Dr. Rina Wati, M.Kom', nip: 'DSN004' },
      { email: 'dosen5@sekolah.ac.id', name: 'Dedi Susanto, S.T, M.T', nip: 'DSN005' },
    ];

    for (const dosen of dosenData) {
      const user = await createUser(dosen.email, 'password123', dosen.name, { nim_nip: dosen.nip });
      if (user) await assignRole(user.id, 'guru');
    }

    // 4. Create Mahasiswa users
    console.log('Creating mahasiswa users...');
    const tahunAngkatan = [2021, 2022, 2023, 2024];
    
    // TRKJ - 4 kelas
    for (const tahun of tahunAngkatan) {
      for (let kelas = 1; kelas <= 4; kelas++) {
        for (let i = 1; i <= 5; i++) {
          const nim = `${tahun}TRKJ${kelas}${String(i).padStart(3, '0')}`;
          const email = `${nim.toLowerCase()}@student.ac.id`;
          const name = `Mahasiswa TRKJ ${kelas}${String.fromCharCode(64 + i)}`;
          
          const user = await createUser(email, 'password123', name, {
            nim_nip: nim,
            jurusan: 'trkj',
            kelas: `TRKJ-${kelas}`,
            angkatan: tahun,
          });
          if (user) await assignRole(user.id, 'siswa');
        }
      }
    }

    // TI - 5 kelas
    for (const tahun of tahunAngkatan) {
      for (let kelas = 1; kelas <= 5; kelas++) {
        for (let i = 1; i <= 5; i++) {
          const nim = `${tahun}TI${kelas}${String(i).padStart(3, '0')}`;
          const email = `${nim.toLowerCase()}@student.ac.id`;
          const name = `Mahasiswa TI ${kelas}${String.fromCharCode(64 + i)}`;
          
          const user = await createUser(email, 'password123', name, {
            nim_nip: nim,
            jurusan: 'ti',
            kelas: `TI-${kelas}`,
            angkatan: tahun,
          });
          if (user) await assignRole(user.id, 'siswa');
        }
      }
    }

    // TRMM - 3 kelas
    for (const tahun of tahunAngkatan) {
      for (let kelas = 1; kelas <= 3; kelas++) {
        for (let i = 1; i <= 5; i++) {
          const nim = `${tahun}TRMM${kelas}${String(i).padStart(3, '0')}`;
          const email = `${nim.toLowerCase()}@student.ac.id`;
          const name = `Mahasiswa TRMM ${kelas}${String.fromCharCode(64 + i)}`;
          
          const user = await createUser(email, 'password123', name, {
            nim_nip: nim,
            jurusan: 'trmm',
            kelas: `TRMM-${kelas}`,
            angkatan: tahun,
          });
          if (user) await assignRole(user.id, 'siswa');
        }
      }
    }

    // 5. Create Items (Kunci & Infokus)
    console.log('Creating items...');
    const itemsData = [];

    // Kunci Ruangan (10 kunci)
    const rooms = [
      { name: 'Ruang Telematika', room: 'Ruang 101' },
      { name: 'Sistem Komputer', room: 'Ruang 102' },
      { name: 'Lab Proses Informasi', room: 'Ruang 103' },
      { name: 'Lab Rekayasa Perangkat Lunak', room: 'Ruang 104' },
      { name: 'Big Data', room: 'Ruang 105' },
      { name: 'Lab Proses Otomasi Robot', room: 'Ruang 106' },
      { name: 'Lab Jaringan Komputer', room: 'Ruang 107' },
      { name: 'Lab Infrastruktur Jaringan', room: 'Ruang 108' },
      { name: 'Lab Keamanan Jaringan', room: 'Ruang 109' },
      { name: 'Lab Komputasi Awan', room: 'Ruang 110' }
    ];

    for (const room of rooms) {
      itemsData.push({
        name: `Kunci ${room.name}`,
        type: 'kunci',
        room_name: room.room,
        status: 'tersedia',
      });
    }

    // Infokus
    for (let i = 1; i <= 10; i++) {
      itemsData.push({
        name: `Infokus ${String(i).padStart(2, '0')}`,
        type: 'infokus',
        room_name: `Portable Unit ${i}`,
        status: 'tersedia',
        condition_notes: 'Kondisi baik',
      });
    }

    const { error: itemsError } = await supabaseAdmin
      .from('items')
      .insert(itemsData);

    if (itemsError) {
      console.error('Error creating items:', itemsError);
    } else {
      console.log(`Created ${itemsData.length} items`);
    }

    console.log('Data seeding completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data seeding completed successfully',
        stats: {
          test_users: 2,
          admins: 2,
          dosen: 5,
          mahasiswa: (4 * 4 * 5) + (5 * 4 * 5) + (3 * 4 * 5), // TRKJ + TI + TRMM
          items: itemsData.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in seed-data function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});