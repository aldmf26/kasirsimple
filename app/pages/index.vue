<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

definePageMeta({
  layout: 'landing'
})

let interval: any
let scrollTriggers: any[] = []

onMounted(() => {
  // Wait for BOTH GSAP and ScrollTrigger to load from CDN
  interval = setInterval(() => {
    const w = window as any
    if (w.gsap && w.ScrollTrigger) {
      clearInterval(interval)
      // Small delay to ensure DOM is fully painted
      setTimeout(() => {
        initAnimations(w.gsap, w.ScrollTrigger)
      }, 150)
    }
  }, 50)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
  scrollTriggers.forEach(st => st.kill())
})

function initAnimations(gsap: any, ScrollTrigger: any) {
  gsap.registerPlugin(ScrollTrigger)

  // --- Hero Section Animations ---
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  heroTl
    .fromTo('.hero-badge', 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.7 }
    )
    .fromTo('.hero-title', 
      { y: 50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8 }, 
      '-=0.4'
    )
    .fromTo('.hero-subtitle', 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6 }, 
      '-=0.4'
    )
    .fromTo('.hero-cta', 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6 }, 
      '-=0.3'
    )
    .fromTo('.hero-social-proof', 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5 }, 
      '-=0.2'
    )
    .fromTo('.hero-image-wrap', 
      { x: 80, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 1, ease: 'power2.out' }, 
      '-=0.8'
    )
    .fromTo('.hero-float-badge', 
      { scale: 0, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, 
      '-=0.3'
    )

  // Floating animation for the badge
  gsap.to('.hero-float-badge', {
    y: -10,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  })

  // Parallax glow
  gsap.to('.hero-glow', {
    scale: 1.1,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  })

  // --- Feature Section Header ---
  const headerTrig1 = ScrollTrigger.create({
    trigger: '#features',
    start: 'top 85%',
    animation: gsap.fromTo('.features-header', 
      { y: 40, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    )
  })
  scrollTriggers.push(headerTrig1)

  // --- Feature Cards Stagger ---
  const cardsTrig1 = ScrollTrigger.create({
    trigger: '.features-grid',
    start: 'top 80%',
    animation: gsap.fromTo('.feature-card', 
      { y: 60, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out' }
    )
  })
  scrollTriggers.push(cardsTrig1)

  // --- Pricing Section Header ---
  const headerTrig2 = ScrollTrigger.create({
    trigger: '#pricing',
    start: 'top 85%',
    animation: gsap.fromTo('.pricing-header', 
      { y: 40, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    )
  })
  scrollTriggers.push(headerTrig2)

  // --- Pricing Cards Stagger ---
  const cardsTrig2 = ScrollTrigger.create({
    trigger: '.pricing-grid',
    start: 'top 80%',
    animation: gsap.fromTo('.pricing-card', 
      { y: 60, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.15, ease: 'power2.out' }
    )
  })
  scrollTriggers.push(cardsTrig2)

  // Force ScrollTrigger to recalculate layout
  setTimeout(() => {
    ScrollTrigger.refresh()
  }, 500)
}
</script>

<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg-shapes">
        <div class="hero-shape hero-shape-1" />
        <div class="hero-shape hero-shape-2" />
        <div class="hero-shape hero-shape-3" />
      </div>

      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-text">
            <div class="hero-badge">
              <span class="hero-badge-dot">
                <span class="hero-badge-ping" />
                <span class="hero-badge-core" />
              </span>
              Solusi Kasir #1 di Indonesia
            </div>

            <h1 class="hero-title">
              Kelola Bisnis<br>
              <span class="hero-title-gradient">Tanpa Ribet</span>
            </h1>

            <p class="hero-subtitle">
              Aplikasi kasir pintar yang membantu membukukan penjualan, kelola stok, dan pantau laba rugi secara otomatis. Praktis, modern, dan mudah digunakan.
            </p>

            <div class="hero-cta">
              <NuxtLink to="/auth/register" class="btn-primary">
                Coba Gratis Sekarang
                <UIcon name="i-heroicons-arrow-right-20-solid" class="btn-icon" />
              </NuxtLink>
            </div>

            <div class="hero-social-proof">
              <div class="avatar-stack">
                <div class="avatar avatar-1">A</div>
                <div class="avatar avatar-2">B</div>
                <div class="avatar avatar-3">+</div>
              </div>
              <p>Bergabung dengan <strong>10.000+</strong> Pengusaha</p>
            </div>
          </div>

          <div class="hero-visual">
            <div class="hero-glow" />
            <div class="hero-image-wrap">
              <img src="/images/hero_pos.png" alt="Kasir Simple Illustration" class="hero-image">
            </div>
            <div class="hero-float-badge">
              <div class="float-badge-icon">
                <UIcon name="i-heroicons-check-circle-20-solid" class="w-6 h-6" />
              </div>
              <div>
                <p class="float-badge-label">Status</p>
                <p class="float-badge-value">Online & Siap Jual</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features-section">
      <div class="section-container">
        <div class="section-header features-header">
          <h2 class="section-title">Fitur Lengkap untuk Bisnis Anda</h2>
          <p class="section-subtitle">Semua yang Anda butuhkan untuk mengembangkan bisnis, ada di dalam satu aplikasi kasir yang simpel.</p>
        </div>

        <div class="features-grid">
          <!-- Feature 1 -->
          <div class="feature-card">
            <div class="feature-icon feature-icon-blue">
              <UIcon name="i-heroicons-cube-20-solid" class="w-7 h-7" />
            </div>
            <h3 class="feature-title">Manajemen Stok</h3>
            <p class="feature-desc">Pantau ketersediaan barang secara otomatis. Dapatkan notifikasi saat stok menipis agar tidak kehabisan barang.</p>
          </div>

          <!-- Feature 2 -->
          <div class="feature-card">
            <div class="feature-icon feature-icon-purple">
              <UIcon name="i-heroicons-chart-bar-20-solid" class="w-7 h-7" />
            </div>
            <h3 class="feature-title">Laporan Keuangan</h3>
            <p class="feature-desc">Analisis performa bisnis Anda dengan laporan grafik yang mudah dipahami. Pantau omset harian hingga bulanan.</p>
          </div>

          <!-- Feature 3 -->
          <div class="feature-card">
            <div class="feature-icon feature-icon-green">
              <UIcon name="i-heroicons-clock-20-solid" class="w-7 h-7" />
            </div>
            <h3 class="feature-title">Laporan Shift</h3>
            <p class="feature-desc">Pantau pembukaan dan penutupan kasir dengan laporan shift yang akurat. Minimalisir selisih uang kas.</p>
          </div>

          <!-- Feature 4 -->
          <div class="feature-card">
            <div class="feature-icon feature-icon-amber">
              <UIcon name="i-heroicons-printer-20-solid" class="w-7 h-7" />
            </div>
            <h3 class="feature-title">Cetak Struk</h3>
            <p class="feature-desc">Cetak struk lewat menu print bawaan HP, tablet, atau komputer dengan ukuran thermal 58mm dan 80mm.</p>
          </div>

          <!-- Feature 5 -->
          <div class="feature-card">
            <div class="feature-icon feature-icon-red">
              <UIcon name="i-heroicons-wifi-20-solid" class="w-7 h-7" />
            </div>
            <h3 class="feature-title">Mode Offline</h3>
            <p class="feature-desc">Tetap bisa berjualan meski internet mati. Data akan tersinkronisasi otomatis saat online kembali.</p>
          </div>

          <!-- Feature 6 -->
          <div class="feature-card">
            <div class="feature-icon feature-icon-teal">
              <UIcon name="i-heroicons-banknotes-20-solid" class="w-7 h-7" />
            </div>
            <h3 class="feature-title">Manajemen Pengeluaran</h3>
            <p class="feature-desc">Catat semua biaya operasional bisnis Anda. Pantau pengeluaran harian agar laba bersih tetap terjaga.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="pricing-section">
      <div class="section-container">
        <div class="section-header pricing-header">
          <h2 class="section-title">Pilihan Harga yang Terjangkau</h2>
          <p class="section-subtitle">Investasi kecil untuk pertumbuhan bisnis yang besar.</p>
        </div>

        <div class="pricing-grid">
          <!-- Monthly Plan -->
          <div class="pricing-card">
            <div class="pricing-card-inner">
              <div class="pricing-plan-name">
                <h3>Paket Bulanan</h3>
                <p>Bayar fleksibel tiap bulan</p>
              </div>

              <div class="pricing-amount">
                <span class="price">Rp 40.000</span>
                <span class="period">/bulan</span>
              </div>

              <ul class="pricing-features">
                <li>
                  <UIcon name="i-heroicons-check-circle-20-solid" class="check-icon" />
                  Semua Fitur Kasir
                </li>
                <li>
                  <UIcon name="i-heroicons-check-circle-20-solid" class="check-icon" />
                  Update Fitur Gratis
                </li>
                <li>
                  <UIcon name="i-heroicons-check-circle-20-solid" class="check-icon" />
                  Data Cloud Aman
                </li>
                <li>
                  <UIcon name="i-heroicons-check-circle-20-solid" class="check-icon" />
                  Support Teknis
                </li>
              </ul>

              <NuxtLink to="/auth/register" class="btn-outline">
                Pilih Paket
              </NuxtLink>
            </div>
          </div>

          <!-- Annual Plan (Featured) -->
          <div class="pricing-card pricing-card-featured">
            <div class="pricing-badge-popular">Hemat 2 Bulan (17%)</div>
            <div class="pricing-card-inner">
              <div class="pricing-plan-name">
                <h3>Paket Tahunan</h3>
                <p class="italic">Hemat & Lebih Untung</p>
              </div>

              <div class="pricing-amount">
                <span class="price price-large">Rp 400.000</span>
                <span class="period">/tahun</span>
              </div>
              <p class="pricing-equivalent">Setara Rp 33.333/bulan</p>

              <ul class="pricing-features pricing-features-bold">
                <li>
                  <UIcon name="i-heroicons-sparkles-20-solid" class="spark-icon" />
                  Semua Fitur Kasir
                </li>
                <li>
                  <UIcon name="i-heroicons-check-circle-20-solid" class="check-icon" />
                  Update Fitur Prioritas
                </li>
                <li>
                  <UIcon name="i-heroicons-check-circle-20-solid" class="check-icon" />
                  Backup Data Mingguan
                </li>
                <li>
                  <UIcon name="i-heroicons-check-circle-20-solid" class="check-icon" />
                  Support Prioritas WA
                </li>
              </ul>

              <NuxtLink to="/auth/register" class="btn-primary btn-full">
                Mulai Sekarang
              </NuxtLink>
            </div>
          </div>

          <!-- Custom Plan -->
          <div class="pricing-card pricing-card-custom">
            <div class="pricing-card-inner">
              <div class="pricing-plan-name">
                <h3>Custom Aplikasi</h3>
                <p>Whitelabel & Fitur Khusus</p>
              </div>

              <div class="pricing-amount pricing-amount-custom">
                <span class="price-label">Mulai Dari</span>
                <span class="price">Rp 2.000.000</span>
              </div>

              <ul class="pricing-features">
                <li>
                  <UIcon name="i-heroicons-sparkles-20-solid" class="spark-icon" />
                  Logo & Brand Sendiri
                </li>
                <li>
                  <UIcon name="i-heroicons-code-bracket-20-solid" class="spark-icon" />
                  Custom Fitur Spesifik
                </li>
                <li>
                  <UIcon name="i-heroicons-server-stack-20-solid" class="spark-icon" />
                  Server Mandiri
                </li>
                <li>
                  <UIcon name="i-heroicons-device-phone-mobile-20-solid" class="spark-icon" />
                  Input Data Awal
                </li>
              </ul>

              <a href="https://wa.me/62895413111053?text=Halo,%20saya%20tertarik%20dengan%20jasa%20Custom%20Aplikasi%20Kasir" target="_blank" class="btn-outline">
                WhatsApp Kami
              </a>
            </div>
          </div>
        </div>

        <p class="pricing-footnote">
          * Harga transparan, tanpa biaya tersembunyi lainnya.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ========================================
   LANDING PAGE — Professional Clean Design
   GSAP-ready with centered mobile-first layout
   ======================================== */

/* ---------- Hero Section ---------- */
.hero-section {
  position: relative;
  /* Reduced padding to avoid empty space */
  padding: 3.5rem 0 4rem;
  overflow: hidden;
  background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
}

.hero-bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}

.hero-shape-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #a5b4fc, transparent 70%);
  top: -120px;
  right: -100px;
}

.hero-shape-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #93c5fd, transparent 70%);
  bottom: -80px;
  left: -60px;
}

.hero-shape-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #c4b5fd, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 10;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 3rem;
}

.hero-text {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* Badge */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  background: rgba(239, 246, 255, 0.8);
  border: 1px solid #dbeafe;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  backdrop-filter: blur(8px);
}

.hero-badge-dot {
  position: relative;
  display: flex;
  width: 8px;
  height: 8px;
}

.hero-badge-ping {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #60a5fa;
  opacity: 0.75;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.hero-badge-core {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Title */
.hero-title {
  font-size: 2.5rem;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #111827;
}

.hero-title-gradient {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  max-width: 520px;
}

/* CTA */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 2rem;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  border-radius: 1rem;
  border: none;
  text-decoration: none;
  box-shadow: 0 8px 30px rgba(37, 99, 235, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(37, 99, 235, 0.4);
}

.btn-primary:active {
  transform: scale(0.97);
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.3s;
}

.btn-primary:hover .btn-icon {
  transform: translateX(4px);
}

.btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: all 0.25s;
  cursor: pointer;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn-full {
  width: 100%;
}

/* Social proof */
.hero-social-proof {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.hero-social-proof strong {
  color: #111827;
}

.avatar-stack {
  display: flex;
}

.avatar-stack .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #4b5563;
  margin-right: -8px;
}

.avatar-1 { background: #e5e7eb; }
.avatar-2 { background: #d1d5db; }
.avatar-3 { background: #9ca3af; color: #fff; }

/* Hero Visual */
.hero-visual {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.hero-glow {
  position: absolute;
  inset: -16px;
  background: radial-gradient(ellipse, rgba(165, 180, 252, 0.4), rgba(196, 181, 253, 0.3), transparent 70%);
  border-radius: 50%;
  filter: blur(40px);
}

.hero-image-wrap {
  position: relative;
  z-index: 2;
}

.hero-image {
  width: 100%;
  border-radius: 1.25rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: transform 0.6s ease;
}

.hero-image:hover {
  transform: scale(1.02);
}

.hero-float-badge {
  position: absolute;
  bottom: -12px;
  left: -8px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border-radius: 0.85rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid #f3f4f6;
}

.float-badge-icon {
  width: 40px;
  height: 40px;
  background: #ecfdf5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #16a34a;
}

.float-badge-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.05em;
}

.float-badge-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #111827;
}

/* ---------- Sections Shared ---------- */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 3rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.01em;
  margin-bottom: 0.75rem;
}

.section-subtitle {
  font-size: 1.05rem;
  color: #6b7280;
  line-height: 1.6;
}

/* ---------- Features Section ---------- */
.features-section {
  /* Reduced padding */
  padding: 4rem 0;
  background: #fff;
  position: relative;
}

.features-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, #e5e7eb, transparent);
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

.feature-card {
  background: #fafbfc;
  padding: 2rem;
  border-radius: 1.5rem;
  border: 1px solid #f3f4f6;
  text-align: center;
  transition: all 0.35s ease;
}

.feature-card:hover {
  background: #fff;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  transform: translateY(-4px);
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.35s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(3deg);
}

.feature-icon-blue { color: #2563eb; }
.feature-card:hover .feature-icon-blue { background: #2563eb; color: #fff; }
.feature-icon-purple { color: #7c3aed; }
.feature-card:hover .feature-icon-purple { background: #7c3aed; color: #fff; }
.feature-icon-green { color: #16a34a; }
.feature-card:hover .feature-icon-green { background: #16a34a; color: #fff; }
.feature-icon-amber { color: #d97706; }
.feature-card:hover .feature-icon-amber { background: #d97706; color: #fff; }
.feature-icon-red { color: #dc2626; }
.feature-card:hover .feature-icon-red { background: #dc2626; color: #fff; }
.feature-icon-teal { color: #0d9488; }
.feature-card:hover .feature-icon-teal { background: #0d9488; color: #fff; }

.feature-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.6rem;
}

.feature-desc {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.6;
}

/* ---------- Pricing Section ---------- */
.pricing-section {
  /* Reduced padding */
  padding: 4rem 0 5rem;
  background: #f9fafb;
  position: relative;
}

.pricing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.pricing-card {
  position: relative;
  border-radius: 1.75rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  transition: all 0.35s ease;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
}

.pricing-card-inner {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  text-align: center;
}

/* Featured card */
.pricing-card-featured {
  border: 2px solid #2563eb;
  box-shadow: 0 16px 50px rgba(37, 99, 235, 0.12);
}

.pricing-badge-popular {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  padding: 0.4rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.pricing-card-custom {
  background: rgba(249, 250, 251, 0.6);
  border-color: #e5e7eb;
}

.pricing-plan-name h3 {
  font-size: 1.2rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.25rem;
}

.pricing-plan-name p {
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 500;
}

.pricing-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin: 1.5rem 0;
}

.pricing-amount-custom {
  flex-direction: column;
  align-items: center;
}

.price {
  font-size: 1.85rem;
  font-weight: 900;
  color: #111827;
}

.price-large {
  font-size: 2.15rem;
}

.price-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ca3af;
}

.period {
  font-size: 0.85rem;
  font-weight: 700;
  color: #9ca3af;
}

.pricing-equivalent {
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  margin-top: -1rem;
  margin-bottom: 1rem;
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  text-align: left;
}

.pricing-features li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: #4b5563;
  font-weight: 500;
}

.pricing-features-bold li:first-child {
  color: #111827;
  font-weight: 700;
}

.check-icon {
  width: 20px;
  height: 20px;
  color: #22c55e;
  flex-shrink: 0;
}

.spark-icon {
  width: 20px;
  height: 20px;
  color: #3b82f6;
  flex-shrink: 0;
}

.pricing-footnote {
  text-align: center;
  margin-top: 2.5rem;
  color: #9ca3af;
  font-size: 0.85rem;
  font-weight: 500;
  font-style: italic;
}

.italic {
  font-style: italic;
}

/* ========================================
   Responsive Breakpoints
   ======================================== */

/* Tablet */
@media (min-width: 640px) {
  .hero-title {
    font-size: 3.5rem;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .pricing-grid {
    gap: 1.75rem;
  }

  .section-title {
    font-size: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .hero-section {
    padding: 5rem 0 6rem;
  }

  .features-section {
    padding: 5rem 0;
  }

  .pricing-section {
    padding: 5rem 0 6rem;
  }

  .hero-content {
    flex-direction: row;
    text-align: left;
    gap: 4rem;
  }

  .hero-text {
    align-items: flex-start;
    flex: 1;
  }

  .hero-visual {
    flex: 1;
  }

  .hero-title {
    font-size: 4rem;
  }

  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .pricing-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .section-title {
    font-size: 2.25rem;
  }
}
</style>
