<script setup lang="ts">
definePageMeta({
  layout: "landing",
});

const instagramDmUrl = "https://ig.me/m/kasir.ok";

const features = [
  {
    icon: "i-heroicons-shopping-cart-20-solid",
    title: "Kasir cepat",
    text: "Klik barang, scan barcode, atau input harga cepat saat barang belum didata.",
  },
  {
    icon: "i-heroicons-cube-20-solid",
    title: "Barang dan stok",
    text: "Catat nama barang, harga jual, modal, SKU, dan stok tanpa format rumit.",
  },
  {
    icon: "i-heroicons-chart-bar-20-solid",
    title: "Laporan harian",
    text: "Lihat penjualan hari ini, transaksi terakhir, barang laris, dan pengeluaran.",
  },
  {
    icon: "i-heroicons-printer-20-solid",
    title: "Struk sederhana",
    text: "Struk bisa dicetak lewat menu print bawaan HP, tablet, atau komputer.",
  },
  {
    icon: "i-heroicons-arrow-down-tray-20-solid",
    title: "Backup mandiri",
    text: "Pemilik toko bisa export data sendiri untuk jaga-jaga saat pindah perangkat.",
  },
  {
    icon: "i-heroicons-building-storefront-20-solid",
    title: "Cocok banyak usaha",
    text: "Bisa dipakai toko kecil, warung, cafe, barber, laundry, dan jasa harian.",
  },
];

const simpleSteps = [
  "Daftar akun",
  "Isi nama toko",
  "Tambah barang sedikit-sedikit",
  "Langsung mulai jualan",
];
</script>

<template>
  <div class="landing-page">
    <section class="hero-section">
      <div class="page-container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Kasir web untuk toko kecil</p>
          <h1>Jualan lebih rapi tanpa ribet belajar sistem besar.</h1>
          <p class="hero-text">
            KasirOK dibuat untuk pemilik toko yang biasa pakai kalkulator dan catatan kertas.
            Buka dari HP, tambah barang, catat transaksi, lalu lihat laporan harian.
          </p>

          <div class="hero-actions">
            <a :href="instagramDmUrl" target="_blank" rel="noopener" class="btn-primary">
              DM Instagram @kasir.ok
              <UIcon name="i-simple-icons-instagram" class="btn-icon" />
            </a>
            <NuxtLink to="/auth/register" class="btn-secondary">
              Coba daftar
            </NuxtLink>
          </div>

          <div class="hero-notes">
            <span>Mulai Rp20.000/bulan</span>
            <span>Bisa dibuka di HP</span>
            <span>Tidak perlu install</span>
          </div>
        </div>

        <div class="hero-preview" aria-label="Tampilan aplikasi kasir">
          <img
            src="/images/hero_pos.png"
            alt="Tampilan KasirOK"
            loading="eager"
            class="hero-image"
          >
        </div>
      </div>
    </section>

    <section id="features" class="features-section">
      <div class="page-container">
        <div class="section-heading">
          <p class="eyebrow">Yang sering dipakai</p>
          <h2>Fitur fokus untuk jualan harian.</h2>
          <p>
            Tidak dibuat ramai. Yang penting transaksi cepat, barang rapi, laporan kebaca.
          </p>
        </div>

        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon">
              <UIcon :name="feature.icon" class="icon-size" />
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="how-section">
      <div class="page-container how-grid">
        <div>
          <p class="eyebrow">Cara pakai</p>
          <h2>Dibuat supaya orang toko cepat paham.</h2>
          <p class="section-text">
            KasirOK tidak memaksa semua data lengkap dari awal. Kalau barang belum ada,
            kasir tetap bisa input harga cepat lalu transaksi jalan.
          </p>
        </div>

        <ol class="step-list">
          <li v-for="step in simpleSteps" :key="step">
            <span>{{ simpleSteps.indexOf(step) + 1 }}</span>
            {{ step }}
          </li>
        </ol>
      </div>
    </section>

    <section id="pricing" class="pricing-section">
      <div class="page-container">
        <div class="section-heading">
          <p class="eyebrow">Harga</p>
          <h2>Pilih yang ringan dulu.</h2>
          <p>Untuk toko kecil yang baru mulai rapiin penjualan.</p>
        </div>

        <div class="pricing-grid">
          <article class="price-card">
            <div>
              <h3>Bulanan</h3>
              <p class="price-desc">Cocok untuk coba jalan dulu.</p>
            </div>
            <div class="price">
              <strong>Rp20.000</strong>
              <span>/ bulan</span>
            </div>
            <ul>
              <li>Semua fitur kasir utama</li>
              <li>Produk, stok, laporan</li>
              <li>Backup data mandiri</li>
            </ul>
            <a :href="instagramDmUrl" target="_blank" rel="noopener" class="btn-secondary full">
              Tanya paket bulanan
            </a>
          </article>

          <article class="price-card featured">
            <div class="save-badge">Lebih hemat</div>
            <div>
              <h3>Tahunan</h3>
              <p class="price-desc">Bayar sekali, dipakai setahun.</p>
            </div>
            <div class="price">
              <strong>Rp150.000</strong>
              <span>/ tahun</span>
            </div>
            <p class="saving-text">Setara Rp12.500/bulan.</p>
            <ul>
              <li>Semua fitur paket bulanan</li>
              <li>Lebih murah untuk pemakaian rutin</li>
              <li>Bantuan setup awal via DM</li>
            </ul>
            <a :href="instagramDmUrl" target="_blank" rel="noopener" class="btn-primary full">
              DM Instagram sekarang
            </a>
          </article>
        </div>
      </div>
    </section>

    <section class="final-cta">
      <div class="page-container cta-box">
        <div>
          <p class="eyebrow">Mau coba dulu?</p>
          <h2>Kirim DM ke @kasir.ok.</h2>
          <p>
            Tulis jenis usaha kamu, nanti dibantu arahkan mulai dari mana.
          </p>
        </div>
        <a :href="instagramDmUrl" target="_blank" rel="noopener" class="btn-primary">
          DM @kasir.ok
          <UIcon name="i-simple-icons-instagram" class="btn-icon" />
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-page {
  background: #f8fafc;
  color: #111827;
}

.page-container {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
}

.hero-section {
  padding: 56px 0 40px;
  background: linear-gradient(180deg, #fff 0%, #f5f3ff 100%);
}

.hero-grid {
  display: grid;
  gap: 32px;
  align-items: center;
}

.hero-copy {
  display: grid;
  gap: 18px;
}

.eyebrow {
  color: #6d28d9;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  max-width: 720px;
  color: #171717;
  font-size: clamp(2.25rem, 8vw, 4.7rem);
  font-weight: 900;
  line-height: 1.02;
}

h2 {
  color: #171717;
  font-size: clamp(1.8rem, 5vw, 3rem);
  font-weight: 900;
  line-height: 1.08;
}

h3 {
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 850;
}

.hero-text,
.section-heading p,
.section-text,
.final-cta p {
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 20px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 850;
  text-decoration: none;
}

.btn-primary {
  background: #6d28d9;
  color: #fff;
  box-shadow: 0 12px 26px rgba(109, 40, 217, 0.22);
}

.btn-secondary {
  background: #fff;
  color: #4c1d95;
  border: 1px solid #ddd6fe;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.hero-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #4b5563;
  font-size: 0.82rem;
  font-weight: 750;
}

.hero-notes span {
  padding: 8px 10px;
  border: 1px solid #e9d5ff;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
}

.hero-preview {
  overflow: hidden;
  border: 1px solid #e9d5ff;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(76, 29, 149, 0.12);
}

.hero-image {
  display: block;
  width: 100%;
  height: auto;
}

.features-section,
.how-section,
.pricing-section,
.final-cta {
  padding: 56px 0;
}

.features-section,
.pricing-section {
  background: #fff;
}

.section-heading {
  display: grid;
  max-width: 680px;
  gap: 10px;
  margin-bottom: 24px;
}

.feature-grid {
  display: grid;
  gap: 12px;
}

.feature-card,
.price-card,
.cta-box {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fff;
}

.feature-card {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.feature-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: #f3e8ff;
  color: #6d28d9;
}

.icon-size {
  width: 22px;
  height: 22px;
}

.feature-card p,
.price-desc,
.price-card li,
.saving-text {
  color: #6b7280;
  font-size: 0.92rem;
  line-height: 1.55;
}

.how-grid {
  display: grid;
  gap: 24px;
}

.step-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.step-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  color: #374151;
  font-weight: 800;
}

.step-list span {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: #6d28d9;
  color: #fff;
  font-size: 0.85rem;
}

.pricing-grid {
  display: grid;
  gap: 16px;
  max-width: 820px;
}

.price-card {
  position: relative;
  display: grid;
  gap: 18px;
  padding: 22px;
}

.price-card.featured {
  border-color: #6d28d9;
  box-shadow: 0 18px 40px rgba(109, 40, 217, 0.14);
}

.save-badge {
  width: fit-content;
  padding: 7px 10px;
  border-radius: 999px;
  background: #ede9fe;
  color: #5b21b6;
  font-size: 0.78rem;
  font-weight: 900;
}

.price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price strong {
  color: #171717;
  font-size: clamp(2rem, 8vw, 3rem);
  font-weight: 950;
}

.price span {
  color: #6b7280;
  font-size: 0.92rem;
  font-weight: 750;
}

.price-card ul {
  display: grid;
  gap: 8px;
  padding-left: 18px;
  margin: 0;
}

.full {
  width: 100%;
}

.final-cta {
  background: #f8fafc;
}

.cta-box {
  display: grid;
  gap: 20px;
  padding: 24px;
}

@media (min-width: 720px) {
  .hero-actions {
    flex-direction: row;
  }

  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .cta-box {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}

@media (min-width: 980px) {
  .hero-section {
    padding: 78px 0 62px;
  }

  .hero-grid {
    grid-template-columns: 0.95fr 1.05fr;
    gap: 46px;
  }

  .features-section,
  .how-section,
  .pricing-section,
  .final-cta {
    padding: 72px 0;
  }

  .feature-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .how-grid {
    grid-template-columns: 1fr 0.85fr;
    align-items: start;
  }
}
</style>
