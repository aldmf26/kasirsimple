<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})

useSeoMeta({
  title: 'KasirOK — Kasir dari HP untuk warung dan toko kecil',
  description: 'Tap barang, total dan kembalian dihitung, struk keluar, laporan harian jadi sendiri. Mulai Rp29.000/bulan, tanpa install, bisa jualan offline.'
})

const waHello = waLink('Halo KasirOK, saya mau tanya aplikasi kasirnya.')
const waMonthly = waLink('Halo KasirOK, saya mau langganan paket bulanan Rp29.000.')
const waYearly = waLink('Halo KasirOK, saya mau langganan paket tahunan Rp249.000.')
</script>

<template>
  <div class="landing-page">
    <section class="hero">
      <div class="wrap hero-inner">
        <h1>Kasir dari HP.<br>Tap barang, beres.</h1>
        <div class="actions">
          <a
            :href="waHello"
            target="_blank"
            rel="noopener"
            class="btn btn-primary"
          >
            <UIcon
              name="i-simple-icons-whatsapp"
              class="btn-icon"
            />
            Chat WhatsApp
          </a>
          <NuxtLink
            to="/auth/register"
            class="btn btn-ghost"
          >
            Daftar akun
          </NuxtLink>
        </div>
        <p class="facts">
          Rp29.000/bulan <span aria-hidden="true">·</span> Tanpa install <span aria-hidden="true">·</span> Bisa offline
        </p>
        <LandingCounter class="hero-counter" />
      </div>
    </section>

    <section
      id="features"
      class="compare"
    >
      <div class="wrap">
        <LandingCompare />
      </div>
    </section>

    <section class="inside">
      <div class="wrap">
        <h2>Isi aplikasinya.</h2>
        <p class="sub">
          Barang belum didata? Tetap bisa dijual.
        </p>
        <LandingFeatures />
      </div>
    </section>

    <section
      id="pricing"
      class="pricing"
    >
      <div class="wrap">
        <h2>Mulai Rp29.000 sebulan.</h2>
        <p class="sub">
          Semua fitur di atas, di dua paket. Bedanya cuma cara bayar.
        </p>

        <div class="plans">
          <article class="plan">
            <h3>Bulanan</h3>
            <p class="price">
              <strong>Rp29.000</strong><span>/bulan</span>
            </p>
            <p class="plan-note">
              Bayar tiap bulan, berhenti kapan saja.
            </p>
            <a
              :href="waMonthly"
              target="_blank"
              rel="noopener"
              class="btn btn-ghost full"
            >Pilih bulanan</a>
          </article>

          <article class="plan plan-year">
            <div class="plan-top">
              <h3>Tahunan</h3>
              <span class="save">Hemat Rp99.000</span>
            </div>
            <p class="price">
              <strong>Rp249.000</strong><span>/tahun</span>
            </p>
            <p class="plan-note">
              <s>Rp348.000</s> kalau bayar bulanan 12 kali. Jadi sekitar Rp20.750 per bulan,
              plus dibantu setup awal lewat WhatsApp.
            </p>
            <a
              :href="waYearly"
              target="_blank"
              rel="noopener"
              class="btn btn-primary full"
            >Pilih tahunan</a>
          </article>
        </div>
      </div>
    </section>

    <section class="close">
      <div class="wrap close-inner">
        <div>
          <h2>Ceritakan usahamu lewat WhatsApp.</h2>
          <p>Sebutkan jenis usaha dan kira-kira berapa macam barang. Kami bantu mulai dari mana.</p>
        </div>
        <a
          :href="waHello"
          target="_blank"
          rel="noopener"
          class="btn btn-white"
        >
          <UIcon
            name="i-simple-icons-whatsapp"
            class="btn-icon"
          />
          0895-4131-1105-3
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-page {
  --blue: #2563eb;
  --blue-deep: #1d4ed8;
  --blue-50: #eff6ff;
  --blue-100: #dbeafe;
  --yellow: #f0c624;
  --ink: #0f172a;
  --text: #334155;
  --muted: #64748b;
  --line: #e2e8f0;
  --ground: #f8fafc;

  background: var(--ground);
  color: var(--text);
}

.landing-page ::selection {
  background: var(--blue-100);
  color: var(--ink);
}

section {
  scroll-margin-top: 72px;
}

.wrap {
  width: min(1160px, calc(100% - 32px));
  margin: 0 auto;
}

h1, h2, h3, p, ul {
  margin: 0;
}

h1 {
  color: var(--ink);
  font-size: clamp(2.1rem, 7.4vw, 4.1rem);
  font-weight: 900;
  line-height: 1.04;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

h2 {
  color: var(--ink);
  font-size: clamp(1.7rem, 4.6vw, 2.75rem);
  font-weight: 900;
  line-height: 1.08;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

h3 {
  color: var(--ink);
  font-size: 1.05rem;
  font-weight: 800;
}

.sub,
.lead {
  max-width: 60ch;
  color: var(--text);
  font-size: 1.05rem;
  line-height: 1.65;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 22px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.2s, transform 0.15s;
}

.btn:active {
  transform: scale(0.98);
}

.btn:focus-visible {
  outline: 3px solid var(--yellow);
  outline-offset: 2px;
}

.btn-primary {
  background: var(--blue);
  color: #fff;
  box-shadow: 0 8px 20px -6px rgba(37, 99, 235, 0.55);
}

.btn-primary:hover {
  background: var(--blue-deep);
}

.btn-ghost {
  background: #fff;
  color: var(--blue-deep);
  border: 2px solid var(--blue-100);
}

.btn-ghost:hover {
  border-color: var(--blue);
}

.btn-white {
  background: #fff;
  color: var(--blue-deep);
  font-variant-numeric: tabular-nums;
}

.btn-white:hover {
  background: var(--blue-50);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.full {
  width: 100%;
}

/* Hero: everything centered around the phone */
.hero {
  padding: 28px 0 40px;
  background: radial-gradient(ellipse 70% 55% at 50% 62%, #eff6ff, #fff 72%);
  border-bottom: 1px solid var(--line);
  overflow: hidden;
}

.hero-inner {
  display: grid;
  justify-items: center;
  gap: 16px;
  text-align: center;
}

.hero-inner h1 {
  font-size: clamp(2.3rem, 9vw, 3.6rem);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  width: min(100%, 440px);
}

.actions .btn {
  flex: 1 1 180px;
}

.facts {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.hero-counter {
  width: 100%;
  margin-top: 12px;
}

/* Sections */
.compare,
.inside,
.pricing,
.close {
  padding: 64px 0 56px;
}

.inside .sub,
.pricing .sub {
  margin: 12px 0 28px;
}

.inside {
  text-align: center;
}

.inside .sub {
  margin-inline: auto;
}

/* Pricing */
.pricing {
  background: #fff;
  border-top: 1px solid var(--line);
}

.plans {
  display: grid;
  gap: 14px;
  max-width: 860px;
}

.plan {
  display: grid;
  gap: 14px;
  align-content: start;
  padding: 24px;
  border: 2px solid var(--line);
  border-radius: 22px;
  background: #fff;
}

.plan-year {
  border-color: var(--blue);
  background: var(--blue-50);
}

.plan-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.save {
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--yellow);
  color: var(--ink);
  font-size: 0.8rem;
  font-weight: 900;
}

.price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price strong {
  color: var(--ink);
  font-size: clamp(2.2rem, 8vw, 3rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.price span {
  color: var(--muted);
  font-weight: 700;
}

.plan-note {
  color: var(--text);
  font-size: 0.92rem;
  line-height: 1.55;
}

.plan-note s {
  color: var(--muted);
}

/* Closing band */
.close {
  background: var(--blue);
}

.close-inner {
  display: grid;
  gap: 22px;
}

.close h2 {
  color: #fff;
}

.close p {
  max-width: 52ch;
  margin-top: 10px;
  color: #dbeafe;
  font-size: 1.02rem;
  line-height: 1.6;
}

@media (min-width: 720px) {
  .plans {
    grid-template-columns: 1fr 1fr;
  }

  .close-inner {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}

@media (min-width: 980px) {
  .hero {
    padding: 48px 0 40px;
  }

  .compare,
  .inside,
  .pricing,
  .close {
    padding: 96px 0 80px;
  }
}
</style>
