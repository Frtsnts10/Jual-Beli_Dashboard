# Setup n8n untuk WhatsApp (langkah demi langkah)

Dashboard dan website **tidak** mengirim WhatsApp sendiri. Keduanya mengirim satu webhook
bertanda tangan ke n8n, lalu n8n meneruskannya ke provider WhatsApp milik toko (Fonnte,
Wablas, atau Meta). Workflow siap pakai: [`n8n-workflow.json`](./n8n-workflow.json).
Format data lengkapnya: [`n8n.md`](./n8n.md).

Workflow ini menangani semua event: pengiriman akun, pengingat H-3, broadcast, kabari
restock, notifikasi pembayaran ke pembeli, dan "bukti bayar masuk" ke penjual.

## 1. Siapkan n8n

Pilih salah satu.

**A. n8n Cloud** (paling mudah): daftar di n8n.io, buat workspace.

**B. Self-host** (VPS dengan Docker):

```bash
docker run -d --name n8n --restart unless-stopped -p 5678:5678 \
  -e N8N_HOST=n8n.domainanda.com -e N8N_PROTOCOL=https \
  -e WEBHOOK_URL=https://n8n.domainanda.com/ \
  -e N8N_WEBHOOK_SECRET=<rahasia-yang-sama-dengan-Vercel> \
  -e NODE_FUNCTION_ALLOW_BUILTIN=crypto \
  -e N8N_BLOCK_ENV_ACCESS_IN_NODE=false \
  -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```

Pasang HTTPS di depannya (Caddy, Nginx, atau Cloudflare Tunnel).

## 2. Buat rahasia webhook

Buat satu string acak, misalnya dengan `openssl rand -hex 32`. Simpan baik-baik dan
jangan pernah ditempel di chat. String yang sama dipakai di tiga tempat:

- n8n: `N8N_WEBHOOK_SECRET` (self-host), atau langsung di node *Verify & split* (Cloud, lihat langkah 3);
- Vercel proyek **dashboard**: `N8N_WEBHOOK_SECRET`;
- Vercel proyek **website**: `N8N_WEBHOOK_SECRET`.

## 3. Import workflow

1. Di n8n: **Workflows → ⋯ → Import from file**, lalu pilih `docs/n8n-workflow.json`.
2. **Hanya untuk n8n Cloud**, karena Cloud tidak bisa membaca env:
   - buka node **Verify & split**;
   - ganti `$env.N8N_WEBHOOK_SECRET || ''` menjadi `'<rahasia Anda>'`.
3. Klik **Publish** (atau **Active**) di kanan atas.
4. Buka node **Webhook** dan salin **Production URL**. Bentuknya
   `https://…/webhook/shop-wa`; jangan pakai Test URL.

## 4. Isi env di Vercel

Di kedua proyek (dashboard **dan** website):

| Nama | Nilai |
|---|---|
| `N8N_WEBHOOK_URL` | Production URL dari langkah 3 |
| `N8N_WEBHOOK_SECRET` | rahasia dari langkah 2 |

Setelah itu redeploy kedua proyek.

## 5. Atur WhatsApp di dashboard

Buka **Pengaturan → WhatsApp & Bot** (paket Pro/Ultimate):

1. **Provider + API token.**
   - Fonnte: token dari menu *Device*.
   - Wablas: token dan server, misalnya `tegal.wablas.com`.
   - Meta: token System User permanen dan *Phone Number ID*.
2. **Template pesan** pengiriman akun (opsional).
3. **Notifikasi pembayaran.**
   - "Kabari pembeli": nyala secara default.
   - "Kabari saya saat ada bukti bayar masuk": isi nomor WA Anda, sebaiknya **bukan** nomor
     yang dipakai provider.

### Khusus Meta (WhatsApp Cloud API)

Di luar 24 jam setelah pembeli terakhir mengirim pesan, Meta hanya mengirim **template yang
sudah disetujui**. Workflow ini memakai template `pengiriman_akun` dengan bahasa `id` dan satu
variabel body `{{1}}`. Buat template tersebut di WhatsApp Manager (kategori *Utility*) dan
tunggu sampai disetujui. Kalau nama template Anda lain, ubah di node **Meta (template)**.

## 6. Tes

1. Dari dashboard toko demo, konfirmasi satu pesanan yang punya bukti bayar.
2. Di n8n, buka **Executions**. Harus ada eksekusi hijau dan WhatsApp masuk ke nomor pembeli.
3. Di website, checkout lalu unggah bukti bayar. Nomor WA penjual menerima "Bukti bayar masuk".

## Cara kerja workflow

| Node | Tugas |
|---|---|
| Webhook | Menerima POST dari dashboard atau website (raw body diaktifkan). |
| Verify & split | Mengecek tanda tangan `X-Signature` (HMAC-SHA256) dan menolak request palsu. Memecah broadcast/restock menjadi satu item per nomor. |
| Many recipients? | Broadcast dijawab `202` dulu, karena dashboard hanya menunggu 10 detik, baru dikirim pelan-pelan. |
| Provider | Memilih Fonnte, Wablas, atau Meta sesuai pengaturan toko. |
| Fonnte / Wablas / Meta | Mengirim pesan, satu nomor tiap 6 detik untuk broadcast supaya nomor tidak dianggap spam. |
| Provider accepted? | Fonnte/Wablas kadang menjawab HTTP 200 padahal gagal (`status: false`). Kasus itu dijadikan error. |
| Single message? → Reply: sent | Pesan tunggal baru dijawab `200` **setelah** provider menerima. Kalau gagal, n8n menjawab `500` dan dashboard menandai pengiriman gagal (bisa dikirim ulang dari Pesanan). |

## Masalah umum

- **Executions merah "Bad signature"**: rahasia di n8n berbeda dengan di Vercel, atau env di
  Vercel belum di-redeploy.
- **`Cannot find module 'crypto'`** (self-host): tambahkan `NODE_FUNCTION_ALLOW_BUILTIN=crypto`.
- **`$env` diblokir** (self-host): tambahkan `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`, atau tulis
  rahasia langsung di node seperti di n8n Cloud.
- **"WhatsApp provider refused: …"**: token salah, device Fonnte terputus, atau kuota habis.
  Cek di dashboard provider.
- **Pesan Meta tidak sampai**: template belum disetujui, atau namanya tidak sama.
