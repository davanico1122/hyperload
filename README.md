HyperLoad Pro - Advanced Load Testing CLI

HyperLoad Pro adalah alat pengujian beban CLI canggih yang dirancang untuk mensimulasikan ribuan pengguna virtual guna menguji skalabilitas dan performa aplikasi web Anda.

Fitur Utama
 Performa Tinggi - Mampu menangani hingga 50.000+ permintaan per detik

 Dashboard Real-time - Memantau metrik secara langsung selama pengujian

 Statistik Lengkap - Persentil waktu respons (p50, p90, p95, p99), tingkat keberhasilan, RPS

 Multi Metode HTTP - Dukungan untuk GET, POST, PUT, DELETE, PATCH, HEAD

 Header Kustom - Menambahkan header HTTP yang diperlukan untuk pengujian

 Pelacakan Status Code - Pemecahan kode status HTTP yang dikembalikan

 Antarmuka Intuitif - Tampilan CLI berwarna dengan visualisasi data

Instalasi
Sebagai Paket Global
npm install -g hyperload-pro

Sebagai Executable Mandiri
Unduh binary yang sudah di-build untuk platform Anda dari halaman rilis.

Build dari Sumber
1.Clone repositori:
git clone https://github.com/yourusername/hyperload-pro.git
cd hyperload-pro


---


2.Instal dependensi:
npm install


---


3.Build executable:
npm run build
File executable akan tersedia di direktori dist/.

---

Penggunaan
hyperload --url <URL> --vus <NUMBER> --duration <SECONDS> [OPTIONS]

---

Parameter	             Deskripsi	                                    Default
--url	                 #URL target (harus ada http:// atau https://)	(wajib)
--vus	                 #Jumlah pengguna virtual	                      (wajib)
--duration	           #Durasi pengujian dalam detik	                (wajib)
--requests	           #Permintaan per pengguna virtual	                100
--method             	 #Metode HTTP (GET, POST, dll.)	                  GET
--header	             #Header kustom (format: "Key: Value")	        (none)
--help	               #Tampilkan bantuan	
--version	             #Tampilkan versi


---


Contoh
Pengujian dasar:
hyperload --url https://example.com --vus 1000 --duration 60

Pengujian lanjutan dengan header kustom:
hyperload --url https://api.example.com/login --vus 500 --duration 30 \
         --method POST --header "Content-Type: application/json" \
         --header "Authorization: Bearer xyz"


---


Dashboard Real-time

Selama pengujian berjalan, HyperLoad Pro menampilkan dashboard langsung:

   LIVE DASHBOARD
  ──────────────────────────────────────────────────────────────────────
  Progress: [██████████████████████░░░░░░░░░░] 67.5%

  Duration: 20.1s / 30s | Remaining: 9.9s | RPS: 1245
  Requests: 25,000 | Success: 24,850 | Failed: 150 | Success Rate: 99.4%
  Response Times (ms): Min: 12.34 | Avg: 45.67 | Max: 1023.45
  Status Codes: 200: 24850 | 201: 120 | 400: 10 | 500: 20
  ──────────────────────────────────────────────────────────────────────
  Press CTRL+C to stop test
---


Hasil Pengujian
Setelah pengujian selesai, laporan terperinci ditampilkan:

╔══════════════════════════════════════════════════════════════════════════════╗
║                        TEST RESULTS SUMMARY                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

 Performance Summary:
┌──────────────────────────────┬───────────────────────────────────────┐
│ Metric                        │ Value                                │
├──────────────────────────────┼───────────────────────────────────────┤
│ Total Requests                │ 25,000                               │
│ Successful Requests          │ 24,850                               │
│ Failed Requests              │ 150                                  │
│ Success Rate                 │ 99.4%                                │
│ Test Duration                │ 30.00s                               │
│ Requests/sec                 │ 833.3                                │
└──────────────────────────────┴───────────────────────────────────────┘

  Response Time Statistics (ms):
┌────────────────────┬───────────────┐
│ Percentile         │ Time          │
├────────────────────┼───────────────┤
│ Average            │   45.67       │
│ Minimum            │   12.34       │
│ Maximum            │ 1023.45       │
│ 50th percentile    │   32.10       │
│ 90th percentile    │   78.90       │
│ 95th percentile    │  102.33       │
│ 99th percentile    │  345.67       │
└────────────────────┴───────────────┘

 HTTP Status Code Distribution:
┌──────────┬───────────────┬────────────────────┐
│ Code     │ Count         │ Percentage         │
├──────────┼───────────────┼────────────────────┤
│ 200      │ 24850         │ 99.4%              │
│ 201      │   120         │  0.5%              │
│ 400      │    10         │  0.0%              │
│ 500      │    20         │  0.1%              │
└──────────┴───────────────┴────────────────────┘

---

Diagram Arsitektur
#


Workflow Pengujian

#

---


Panduan Penggunaan Lengkap
1. Persiapan Pengujian
Sebelum menjalankan pengujian beban, pastikan:

Server target siap menerima beban tinggi

Lingkungan pengujian memiliki koneksi jaringan stabil

Tidak ada proses berat lain yang berjalan di mesin pengujian

2. Menjalankan Pengujian Dasar
hyperload --url https://api.anda.com --vus 500 --duration 30

3. Pengujian dengan Metode POST
hyperload --url https://api.anda.com/login --method POST --vus 200 --duration 20

4. Menambahkan Header Kustom
hyperload --url https://api.anda.com/data --header "Authorization: Bearer token" --header "X-Custom-Header: nilai"

 Mengoptimalkan Parameter
Untuk beban tinggi, gunakan lebih banyak VUs dengan durasi lebih singkat

Untuk stabilitas, gunakan lebih sedikit VUs dengan durasi lebih panjang

Sesuaikan --requests berdasarkan kemampuan server

6. Menghentikan Pengujian Dini
Tekan CTRL+C untuk menghentikan pengujian kapan saja. Hasil parsial akan ditampilkan.

7. Interpretasi Hasil
Success Rate > 99% = performa bagus

p95 Response Time < 500ms = responsif

RPS Tinggi dengan Error Rendah = skalabilitas baik

Build Executable
Untuk membangun executable mandiri:

1.Instal dependensi:
npm install

2.Build untuk semua platform:
npm run build-all

Atau untuk platform tertentu:
npm run build-windows   # Build untuk Windows
npm run build-linux     # Build untuk Linux
npm run build-macos     # Build untuk macOS

File executable akan tersedia di direktori dist/ dengan format:
dist/
  hyperload-windows.exe
  hyperload-linux
  hyperload-macos

---

Berkontribusi
Kontribusi dipersilakan! Ikuti langkah-langkah:

Fork repositori

Buat branch fitur (git checkout -b fitur-baru)

Commit perubahan Anda (git commit -am 'Tambahkan fitur baru')

Push ke branch (git push origin fitur-baru)

Buat Pull Request

Lisensi
HyperLoad Pro dirilis di bawah lisensi MIT.

