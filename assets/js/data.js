/* ============================================================
   Content model. Every string carries an `en` and `id` variant so
   the language switch can re-render without a second HTML tree.
   ============================================================ */
window.PORTFOLIO = (() => {
  'use strict';

  /* Inline icon paths (stroke-based, 24x24 viewBox). */
  const ICONS = {
    cart:     '<path d="M3 4h2l2.4 11.2A2 2 0 0 0 9.4 17h7.5a2 2 0 0 0 2-1.6L20.5 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/>',
    chat:     '<path d="M21 12a8 8 0 0 1-11.7 7.1L3 21l1.9-6.2A8 8 0 1 1 21 12Z"/>',
    heart:    '<path d="M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7-2.7c0 5-7 14.7-7 14.7Z"/>',
    shop:     '<path d="M4 8h16l-1 12H5L4 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    bike:     '<circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17 10 7h4l3 10M9.5 7h5"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    box:      '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    map:      '<path d="m9 4 6 2 5.5-2v14L15 20l-6-2-5.5 2V6L9 4Z"/><path d="M9 4v14M15 6v14"/>',
    brain:    '<path d="M9 5a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 8 19h1V5Z"/><path d="M15 5a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8A3 3 0 0 1 16 19h-1V5Z"/>',
    users:    '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 5M18 20a6 6 0 0 0-2.2-4.6"/>',
    target:   '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    shield:   '<path d="M12 3 5 6v6c0 4.2 3 7.7 7 9 4-1.3 7-4.8 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    badge:    '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1 7.5 4.5-2.4 4.5 2.4-1-7.5"/>',
    scroll:   '<path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V3Z"/><path d="M6 3a2 2 0 0 0-2 2v2h2M10 8h6M10 12h6M10 16h4"/>',
    robot:    '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4.5M9 13h.01M15 13h.01M9.5 16.5h5"/><circle cx="12" cy="3.5" r="1.2"/>',
    code:     '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M13.5 5l-3 14"/>',
    spark:    '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
    grad:     '<path d="M12 4 2 9l10 5 10-5-10-5Z"/><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/>'
  };

  /* ---- Skills. `lvl` is the owner's own self-assessment. ---- */
  const skills = [
    { cat: 'customer', icon: 'cart',   lvl: 85,
      name: { en: 'Sales',             id: 'Penjualan' },
      note: { en: 'Reading what a customer actually needs before pitching anything.',
              id: 'Membaca kebutuhan pelanggan sebelum menawarkan apa pun.' } },
    { cat: 'customer', icon: 'chat',   lvl: 90,
      name: { en: 'Communication',     id: 'Komunikasi' },
      note: { en: 'Clear, calm and polite — in person, on the phone, over chat.',
              id: 'Jelas, tenang, dan sopan — langsung, lewat telepon, atau chat.' } },
    { cat: 'customer', icon: 'heart',  lvl: 88,
      name: { en: 'Customer Service',  id: 'Layanan Pelanggan' },
      note: { en: 'Turning a complaint into a customer who comes back.',
              id: 'Mengubah keluhan menjadi pelanggan yang kembali lagi.' } },
    { cat: 'customer', icon: 'shop',   lvl: 75,
      name: { en: 'Shop Floor (Pramuniaga)', id: 'Pramuniaga' },
      note: { en: 'Greeting, guiding and closing at the counter.',
              id: 'Menyambut, mengarahkan, dan menutup transaksi di konter.' } },

    { cat: 'ops', icon: 'bike',  lvl: 92,
      name: { en: 'Last-mile Delivery', id: 'Pengantaran' },
      note: { en: '17 months of daily routes, rain or shine.',
              id: '17 bulan rute harian, hujan atau panas.' } },
    { cat: 'ops', icon: 'clock', lvl: 88,
      name: { en: 'Time Management',   id: 'Manajemen Waktu' },
      note: { en: 'Sequencing drops so the whole list lands on schedule.',
              id: 'Menyusun urutan antar agar semua pesanan tepat waktu.' } },
    { cat: 'ops', icon: 'box',   lvl: 80,
      name: { en: 'Stock & Display',   id: 'Stok & Display' },
      note: { en: 'Facing, rotation and keeping shelves honest.',
              id: 'Penataan, rotasi barang, dan menjaga rak tetap rapi.' } },
    { cat: 'ops', icon: 'map',   lvl: 85,
      name: { en: 'Route Planning',    id: 'Perencanaan Rute' },
      note: { en: 'Knowing the city well enough to beat the traffic.',
              id: 'Hafal kota cukup baik untuk menghindari macet.' } },

    { cat: 'personal', icon: 'brain',  lvl: 90,
      name: { en: 'Discipline',        id: 'Disiplin' },
      note: { en: 'Shift starts when it starts. Every day.',
              id: 'Shift dimulai tepat waktu. Setiap hari.' } },
    { cat: 'personal', icon: 'users',  lvl: 86,
      name: { en: 'Teamwork',          id: 'Kerja Tim' },
      note: { en: 'Covering for the crew without being asked twice.',
              id: 'Menutup kekurangan tim tanpa perlu diminta dua kali.' } },
    { cat: 'personal', icon: 'target', lvl: 82,
      name: { en: 'Problem Solving',   id: 'Pemecahan Masalah' },
      note: { en: 'Wrong address at 8pm? There is always a next step.',
              id: 'Alamat salah jam 8 malam? Selalu ada langkah berikutnya.' } },
    { cat: 'personal', icon: 'shield', lvl: 90,
      name: { en: 'Accountability',    id: 'Tanggung Jawab' },
      note: { en: 'If it was on my list, it is on me.',
              id: 'Kalau ada di daftar saya, itu tanggung jawab saya.' } }
  ];

  /* ---- Experience ---- */
  const experience = [
    {
      year: '2024 — 2026',
      role:    { en: 'Delivery Man',  id: 'Delivery Man' },
      company: 'PT Indomarco Prismatama · Pangkalpinang',
      summary: {
        en: 'One year and five months running daily customer deliveries across Pangkalpinang — protecting the goods, holding the schedule, and being the face of the store at the door.',
        id: 'Satu tahun lima bulan mengantar pesanan pelanggan setiap hari di Pangkalpinang — menjaga kondisi barang, menepati jadwal, dan menjadi wajah toko di depan pintu pelanggan.'
      },
      points: {
        en: [
          'Planned and ran daily routes so every order arrived inside its promised window.',
          'Handled goods carefully end to end, keeping products in sellable condition on arrival.',
          'Verified orders and payments at handover to keep the store\'s records clean.',
          'Answered questions and defused complaints on the spot, without escalating.'
        ],
        id: [
          'Merencanakan dan menjalankan rute harian agar setiap pesanan tiba sesuai waktu yang dijanjikan.',
          'Menangani barang dengan hati-hati dari gudang sampai pelanggan, menjaga kondisi produk tetap baik.',
          'Memverifikasi pesanan dan pembayaran saat serah terima agar catatan toko tetap rapi.',
          'Menjawab pertanyaan dan meredakan keluhan langsung di tempat, tanpa perlu eskalasi.'
        ]
      },
      tags: ['Delivery', 'Customer Service', 'Time Management', 'Route Planning']
    },
    {
      year: '2024',
      role:    { en: 'Pramuniaga (Retail Associate)', id: 'Pramuniaga' },
      company: 'PT Indomarco Prismatama · Pangkalpinang',
      summary: {
        en: 'A month on the shop floor: serving customers, keeping shelves full and tidy, and supporting the till during busy hours.',
        id: 'Satu bulan di area toko: melayani pelanggan, menjaga rak tetap penuh dan rapi, serta membantu kasir saat jam ramai.'
      },
      points: {
        en: [
          'Served walk-in customers and pointed them to what they were actually looking for.',
          'Restocked, faced and rotated products so the shelves stayed sellable.',
          'Supported cashier transactions during peak hours.'
        ],
        id: [
          'Melayani pelanggan yang datang dan mengarahkan mereka ke produk yang dicari.',
          'Mengisi ulang, menata, dan merotasi produk agar rak selalu siap jual.',
          'Membantu transaksi kasir saat jam sibuk.'
        ]
      },
      tags: ['Sales', 'Customer Service', 'Stock & Display']
    }
  ];

  /* ---- Certificates ---- */
  const certificates = [
    {
      icon: 'heart',
      title:  { en: 'Customer Service Fundamentals', id: 'Pelatihan Dasar Pelayanan Pelanggan' },
      issuer: 'PT Indomarco Prismatama',
      date:   { en: 'Issued Feb 2024', id: 'Terbit Feb 2024' },
      body: {
        en: 'In-house training on the service standard expected at every customer touchpoint: greeting, handling objections, and closing an interaction well.',
        id: 'Pelatihan internal tentang standar pelayanan di setiap titik temu pelanggan: menyambut, menangani keberatan, dan menutup interaksi dengan baik.'
      },
      meta: { en: [['Type', 'In-house training'], ['Year', '2024'], ['Location', 'Pangkalpinang']],
              id: [['Jenis', 'Pelatihan internal'], ['Tahun', '2024'], ['Lokasi', 'Pangkalpinang']] }
    },
    {
      icon: 'bike',
      title:  { en: 'Safety Riding Certification', id: 'Sertifikasi Keselamatan Berkendara' },
      issuer: 'PT Indomarco Prismatama',
      date:   { en: 'Issued Mar 2024', id: 'Terbit Mar 2024' },
      body: {
        en: 'Defensive riding, load handling and road-safety procedure for daily delivery work — the basis for an incident-free record on the route.',
        id: 'Berkendara defensif, penanganan muatan, dan prosedur keselamatan jalan untuk pekerjaan antar harian — dasar dari catatan bebas insiden di rute.'
      },
      meta: { en: [['Type', 'Safety certification'], ['Year', '2024'], ['Location', 'Pangkalpinang']],
              id: [['Jenis', 'Sertifikasi keselamatan'], ['Tahun', '2024'], ['Lokasi', 'Pangkalpinang']] }
    },
    {
      icon: 'chat',
      title:  { en: 'Communication & Selling Skills', id: 'Pelatihan Komunikasi & Penjualan' },
      issuer: 'PT Indomarco Prismatama',
      date:   { en: 'Issued Apr 2024', id: 'Terbit Apr 2024' },
      body: {
        en: 'Practical selling: reading the customer, recommending honestly, and asking for the sale without pressure.',
        id: 'Penjualan praktis: membaca pelanggan, merekomendasikan dengan jujur, dan menawarkan tanpa menekan.'
      },
      meta: { en: [['Type', 'Sales training'], ['Year', '2024'], ['Location', 'Pangkalpinang']],
              id: [['Jenis', 'Pelatihan penjualan'], ['Tahun', '2024'], ['Lokasi', 'Pangkalpinang']] }
    }
  ];

  /* ---- Projects ---- */
  const projects = [
    {
      cat: 'automation', icon: 'robot',
      badge: { en: 'Automation', id: 'Otomasi' },
      title: 'Bot Finance Tracker',
      blurb: {
        en: 'A chat-based bot that logs daily income and spending, then rolls it up into a simple weekly summary.',
        id: 'Bot berbasis chat yang mencatat pemasukan dan pengeluaran harian, lalu merangkumnya jadi laporan mingguan sederhana.'
      },
      body: {
        en: 'Built after a year of tracking delivery earnings on paper. Send a message like "5000 fuel" and the bot files it, keeps a running balance, and sends a summary at the end of the week — no spreadsheet discipline required.',
        id: 'Dibuat setelah setahun mencatat penghasilan antar di kertas. Kirim pesan seperti "5000 bensin", bot mencatatnya, menjaga saldo berjalan, dan mengirim ringkasan di akhir minggu — tanpa perlu disiplin spreadsheet.'
      },
      highlights: {
        en: ['Natural-language entry from a chat app', 'Automatic weekly rollup', 'Categories inferred from the message'],
        id: ['Input bahasa natural lewat aplikasi chat', 'Rekap mingguan otomatis', 'Kategori ditebak dari isi pesan']
      },
      tags: ['Automation', 'Chatbot', 'Finance'],
      links: [{ label: 'GitHub', href: 'https://github.com/DjorghiTzy' }]
    },
    {
      cat: 'web', icon: 'code',
      badge: { en: 'Web', id: 'Web' },
      title: { en: 'This Portfolio', id: 'Portofolio Ini' },
      blurb: {
        en: 'A single-page portfolio with a scroll-driven WebGL background, smooth scrolling, a command palette, bilingual content and a printable CV view.',
        id: 'Portofolio satu halaman dengan latar WebGL yang digerakkan scroll, scroll halus, command palette, konten dua bahasa, dan tampilan CV siap cetak.'
      },
      body: {
        en: 'Hand-written HTML, CSS and vanilla JavaScript — no framework, and the repository root is what gets deployed. The background is a three.js scene whose every transform is a function of scroll position, layered over a smooth-scroll implementation that eases the page toward the real scroll offset. Both are progressive enhancement: without WebGL, or with reduced motion requested, it falls back to a 2D canvas field and native scrolling.',
        id: 'HTML, CSS, dan JavaScript murni ditulis tangan — tanpa framework, dan yang di-deploy adalah root repositori apa adanya. Latarnya adalah scene three.js yang setiap transformasinya merupakan fungsi dari posisi scroll, di atas implementasi smooth scroll yang meng-ease halaman menuju posisi scroll sebenarnya. Keduanya peningkatan bertahap: tanpa WebGL, atau ketika pengguna meminta gerakan minimal, situs kembali ke particle field canvas 2D dan scroll bawaan.'
      },
      highlights: {
        en: ['Scroll-driven three.js background with a 2D fallback', 'Frame-rate independent smooth scrolling', 'Command palette with keyboard shortcuts', 'EN / ID language switch', 'Light & dark themes with five accents', 'Print stylesheet that outputs a clean CV'],
        id: ['Latar three.js yang digerakkan scroll, dengan fallback 2D', 'Smooth scroll yang independen dari frame rate', 'Command palette dengan pintasan keyboard', 'Pengalih bahasa EN / ID', 'Tema terang & gelap dengan lima warna aksen', 'Print stylesheet yang menghasilkan CV rapi']
      },
      tags: ['HTML', 'CSS', 'JavaScript', 'three.js', 'WebGL'],
      links: [{ label: 'GitHub', href: 'https://github.com/DjorghiTzy/Portofolio' }]
    }
  ];

  /* ---- Typewriter roles ---- */
  const roles = {
    en: ['Sales Professional', 'Delivery Specialist', 'Customer Service', 'Reliable Teammate'],
    id: ['Profesional Sales', 'Spesialis Pengantaran', 'Layanan Pelanggan', 'Rekan Tim yang Andal']
  };

  /* ---- Marquee words ---- */
  const marquee = {
    en: ['Sales', 'Communication', 'Customer Service', 'Delivery', 'Time Management', 'Discipline', 'Teamwork', 'Accountability'],
    id: ['Penjualan', 'Komunikasi', 'Layanan Pelanggan', 'Pengantaran', 'Manajemen Waktu', 'Disiplin', 'Kerja Tim', 'Tanggung Jawab']
  };

  /* ---- UI strings used by JS-generated markup ---- */
  const ui = {
    viewCert:   { en: 'View certificate', id: 'Lihat sertifikat' },
    caseStudy:  { en: 'Read more',        id: 'Selengkapnya' },
    copied:     { en: 'Copied to clipboard', id: 'Tersalin ke clipboard' },
    copyFailed: { en: 'Could not copy — select it manually', id: 'Gagal menyalin — silakan salin manual' },
    themeLight: { en: 'Light theme on',   id: 'Tema terang aktif' },
    themeDark:  { en: 'Dark theme on',    id: 'Tema gelap aktif' },
    langSet:    { en: 'Language: English', id: 'Bahasa: Indonesia' },
    accentSet:  { en: 'Accent updated',   id: 'Warna aksen diperbarui' },
    required:   { en: 'This field is required', id: 'Kolom ini wajib diisi' },
    badEmail:   { en: 'Enter a valid email address', id: 'Masukkan alamat email yang valid' },
    tooShort:   { en: 'Please write at least 10 characters', id: 'Tulis minimal 10 karakter' },
    formOpened: { en: 'Opening your email app…', id: 'Membuka aplikasi email…' },
    waOpened:   { en: 'Opening WhatsApp…', id: 'Membuka WhatsApp…' },
    formFix:    { en: 'Please check the highlighted fields', id: 'Periksa kolom yang ditandai' },
    draftClear: { en: 'Draft cleared', id: 'Draf dihapus' },
    printing:   { en: 'Opening print view — choose "Save as PDF"', id: 'Membuka tampilan cetak — pilih "Simpan sebagai PDF"' },
    konami:     { en: 'You found it. Thanks for looking closely.', id: 'Kamu menemukannya. Terima kasih sudah teliti.' },
    statusOpen: { en: 'Available for work',  id: 'Terbuka untuk kerja' },
    statusBusy: { en: 'Slower to reply now', id: 'Balasan agak lambat' },
    statusAway: { en: 'Asleep — back in the morning', id: 'Sedang istirahat — kembali pagi' }
  };

  return { ICONS, skills, experience, certificates, projects, roles, marquee, ui };
})();
