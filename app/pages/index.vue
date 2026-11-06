<script setup lang="ts">
import type { GoodsKind } from '~/components/LandingGoodsPile.vue'

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

// Demo cart (synthetic prices), in the order the goods drop onto the pile.
const cart: { kind: GoodsKind, name: string, qty: string, price: number }[] = [
  { kind: 'egg', name: 'Telur', qty: '1 kg', price: 28000 },
  { kind: 'box', name: 'Snack', qty: '1 dus', price: 24000 },
  { kind: 'laundry', name: 'Keranjang', qty: '1 pcs', price: 21000 },
  { kind: 'drink', name: 'Teh kotak', qty: '3 pcs', price: 12000 },
  { kind: 'noodle', name: 'Mie rebus', qty: '1 porsi', price: 15500 },
  { kind: 'charger', name: 'Kepala charger', qty: '1 pcs', price: 35000 }
]
const kinds = cart.map(c => c.kind)
const total = cart.reduce((s, c) => s + c.price, 0)
const PAID = 150000

const landed = ref(0)
const printed = ref(false)
const shown = computed(() => cart.slice(0, landed.value))
const runningTotal = computed(() => shown.value.reduce((s, c) => s + c.price, 0))

let printTimer: ReturnType<typeof setTimeout> | undefined
function onLand(i: number) {
  landed.value = Math.max(landed.value, i + 1)
  if (landed.value === cart.length) printTimer = setTimeout(() => (printed.value = true), 450)
}

const goods = ref<{ replay: () => void }>()
function replay() {
  clearTimeout(printTimer)
  landed.value = 0
  printed.value = false
  goods.value?.replay()
}
onBeforeUnmount(() => clearTimeout(printTimer))

const compare = [
  { icon: 'i-lucide-calculator', task: 'Total belanja', old: 'Ketik satu-satu', ok: 'Tap barang' },
  { icon: 'i-lucide-tag', task: 'Harga belum ada', old: 'Cari di buku', ok: 'Ketik harga, jalan' },
  { icon: 'i-lucide-banknote', task: 'Kembalian', old: 'Hitung di kepala', ok: 'Otomatis' },
  { icon: 'i-lucide-package', task: 'Stok', old: 'Hitung rak', ok: 'Berkurang sendiri' },
  { icon: 'i-lucide-notebook-pen', task: 'Hutang', old: 'Buku bon', ok: 'Per pelanggan' },
  { icon: 'i-lucide-moon', task: 'Tutup toko', old: 'Rekap malam', ok: 'Laporan jadi' }
]

const businesses = [
  { icon: 'i-lucide-store', name: 'Warung sembako', flap: 'sembako', sells: ['Telur', 'Beras', 'Mie'], tint: '#fef3c7', ink: '#92400e' },
  { icon: 'i-lucide-smartphone', name: 'Konter HP', flap: 'charger', sells: ['Charger', 'Kabel', 'Casing'], tint: '#dbeafe', ink: '#1e40af' },
  { icon: 'i-lucide-washing-machine', name: 'Laundry', flap: 'laundry', sells: ['Kiloan', 'Setrika'], tint: '#e0f2fe', ink: '#075985' },
  { icon: 'i-lucide-coffee', name: 'Kedai & cafe', flap: 'kopi', sells: ['Kopi', 'Es teh'], tint: '#fde68a', ink: '#78350f' },
  { icon: 'i-lucide-scissors', name: 'Barber', flap: 'jasa', sells: ['Potong', 'Cukur'], tint: '#dcfce7', ink: '#166534' },
  { icon: 'i-lucide-shopping-basket', name: 'Kelontong', flap: 'snack', sells: ['Snack', 'Minuman'], tint: '#fee2e2', ink: '#991b1b' }
]

// Split-flap word in the business heading.
const flapIndex = ref(0)
let flapTimer: ReturnType<typeof setInterval> | undefined

// Scroll reveal: only elements still below the fold get hidden, so nothing
// already on screen flashes and no-JS / reduced-motion visitors see it all.
let revealIO: IntersectionObserver | undefined
onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  flapTimer = setInterval(() => (flapIndex.value = (flapIndex.value + 1) % businesses.length), 1800)
  revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      e.target.classList.add('is-in')
      revealIO?.unobserve(e.target)
    }
  }, { rootMargin: '0px 0px -12% 0px' })
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight * 0.88) return
    el.classList.add('will-reveal')
    revealIO!.observe(el)
  })
})
onBeforeUnmount(() => {
  clearInterval(flapTimer)
  revealIO?.disconnect()
})

const groups = [
  {
    when: 'Saat melayani pembeli',
    items: ['Scan barcode pakai kamera HP', 'Input harga cepat untuk barang yang belum didata', 'Jual per pcs atau per berat', 'Struk lewat printer Bluetooth, print biasa, atau teks', 'Tetap bisa jualan saat sinyal hilang']
  },
  {
    when: 'Saat ngatur toko',
    items: ['Barang, harga modal, dan stok', 'Kategori barang', 'Data pelanggan dan hutang', 'Catat pengeluaran', 'Shift kasir dan PIN pemilik']
  },
  {
    when: 'Saat tutup toko',
    items: ['Laporan penjualan harian', 'Barang paling laris', 'Riwayat semua transaksi', 'Backup data sendiri ke file']
  }
]

const rp = (n: number) => formatCurrency(n)
</script>

<template>
  <div class="landing-page">
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <h1>Taruh kalkulatornya. Total, kembalian, dan stok dihitung&nbsp;KasirOK.</h1>
          <p class="lead">
            Kasir dari HP untuk warung, konter, laundry, dan toko kecil. Tap barang, struk keluar,
            laporan harian jadi sendiri.
          </p>
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
            >Daftar akun</NuxtLink>
          </div>
          <p class="facts">
            Rp29.000/bulan <span aria-hidden="true">·</span> Tanpa install <span aria-hidden="true">·</span> Bisa jualan offline
          </p>
        </div>

        <div class="stage">
          <div class="stage-3d">
            <LandingGoodsPile
              ref="goods"
              :kinds="kinds"
              @land="onLand"
            />
          </div>

          <div
            class="device"
            role="img"
            :aria-label="`Contoh transaksi KasirOK, total ${rp(total)}`"
          >
            <div class="phone">
              <div class="phone-bar">
                <span>Keranjang</span>
                <span class="phone-count">{{ shown.length }} item</span>
              </div>
              <TransitionGroup
                tag="ul"
                name="line"
                class="phone-lines"
              >
                <li
                  v-for="c in shown"
                  :key="c.name"
                >
                  <span class="ln-name">{{ c.name }}<small>{{ c.qty }}</small></span>
                  <span class="ln-price">{{ rp(c.price) }}</span>
                </li>
              </TransitionGroup>
              <div class="phone-total">
                <span>Total</span>
                <strong>{{ rp(runningTotal) }}</strong>
              </div>
              <div
                class="phone-pay"
                :class="{ done: printed }"
              >
                {{ printed ? 'Lunas · struk dicetak' : 'Bayar' }}
              </div>
            </div>

            <div class="receipt-slot">
              <div
                class="receipt"
                :class="{ out: printed }"
                aria-hidden="true"
              >
                <p class="r-head">
                  WARUNG CONTOH
                </p>
                <p
                  v-for="c in cart"
                  :key="c.name"
                  class="r-row"
                >
                  <span>{{ c.name }} {{ c.qty }}</span><span>{{ c.price.toLocaleString('id-ID') }}</span>
                </p>
                <p class="r-row r-strong">
                  <span>TOTAL</span><span>{{ total.toLocaleString('id-ID') }}</span>
                </p>
                <p class="r-row">
                  <span>Tunai</span><span>{{ PAID.toLocaleString('id-ID') }}</span>
                </p>
                <p class="r-row">
                  <span>Kembali</span><span>{{ (PAID - total).toLocaleString('id-ID') }}</span>
                </p>
                <p class="r-foot">
                  Terima kasih
                </p>
              </div>
            </div>
          </div>

          <button
            v-if="printed"
            type="button"
            class="replay"
            @click="replay"
          >
            <UIcon
              name="i-lucide-rotate-ccw"
              class="replay-icon"
            />
            Ulangi
          </button>
        </div>
      </div>
    </section>

    <section
      id="features"
      class="compare"
    >
      <div class="wrap">
        <h2
          data-reveal
          class="rv-up"
        >
          Satu belanjaan, dua cara ngitung.
        </h2>
        <div
          class="vs-legend"
          data-reveal
        >
          <span class="legend-old">Kalkulator + buku</span>
          <span class="legend-vs">vs</span>
          <span class="legend-ok">KasirOK</span>
        </div>
        <ul class="vs">
          <li
            v-for="(r, i) in compare"
            :key="r.task"
            class="vs-row"
            data-reveal
            :style="{ '--i': i % 2 }"
          >
            <span class="vs-icon"><UIcon :name="r.icon" /></span>
            <span class="vs-task">{{ r.task }}</span>
            <span class="vs-old"><s class="strike">{{ r.old }}</s></span>
            <UIcon
              name="i-lucide-arrow-right"
              class="vs-arrow"
              aria-hidden="true"
            />
            <span class="vs-ok"><UIcon
              name="i-lucide-check"
              class="vs-check"
            />{{ r.ok }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section class="biz">
      <div class="wrap">
        <h2 class="flap-title">
          <span class="sr-only">Jualan apa saja, catatnya tetap sama.</span>
          <span aria-hidden="true">
            Jualan
            <span class="flap">
              <span
                v-for="(b, i) in businesses"
                :key="b.flap"
                :class="{ on: i === flapIndex }"
              >{{ b.flap }}</span>
            </span>
            <br>catatnya tetap sama.
          </span>
        </h2>
        <ul class="tiles">
          <li
            v-for="(b, i) in businesses"
            :key="b.name"
            class="tile"
            data-reveal
            :class="{ lit: i === flapIndex }"
            :style="{ '--tint': b.tint, '--ink': b.ink, '--i': i % 3, '--r': `${(i % 2 ? 1 : -1) * (2 + i % 3)}deg` }"
          >
            <UIcon
              :name="b.icon"
              class="tile-icon"
            />
            <strong>{{ b.name }}</strong>
            <span class="chips">
              <span
                v-for="s in b.sells"
                :key="s"
              >{{ s }}</span>
            </span>
          </li>
        </ul>
      </div>
    </section>

    <section class="inside">
      <div class="wrap">
        <h2>Isi aplikasinya.</h2>
        <p class="sub">
          Tidak perlu isi semua dari awal. Barang yang belum didata tetap bisa dijual, rapikan belakangan.
        </p>
        <div class="groups">
          <div
            v-for="(g, i) in groups"
            :key="g.when"
            class="group rv-up"
            data-reveal
            :style="{ '--i': i }"
          >
            <h3>{{ g.when }}</h3>
            <ul>
              <li
                v-for="item in g.items"
                :key="item"
              >
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
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
  --paper: #fffdf8;
  --mono: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;

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

.btn:focus-visible,
.replay:focus-visible {
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

/* Hero */
.hero {
  padding: 36px 0 8px;
  background: #fff;
  border-bottom: 1px solid var(--line);
  overflow: hidden;
}

.hero-grid {
  display: grid;
  gap: 8px;
}

.hero-copy {
  display: grid;
  gap: 18px;
  align-content: center;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.actions .btn {
  flex: 1 1 160px;
}

.facts {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}

/* Phone: pile on top, cart below it. Desktop: pile left, phone right. */
.stage {
  position: relative;
  padding-bottom: 72px;
}

.stage-3d {
  display: grid;
  align-items: end;
  padding: 0 8px;
}

.device {
  position: relative;
  width: min(270px, 80%);
  margin: -36px auto 0;
}

.phone {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 7px solid var(--ink);
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 24px 40px -18px rgba(15, 23, 42, 0.45);
}

.phone-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--blue);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
}

.phone-count {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

.phone-lines {
  display: grid;
  gap: 4px;
  min-height: 214px;
  align-content: start;
  padding: 0;
  list-style: none;
}

.phone-lines li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 10px;
  background: var(--ground);
  font-size: 0.74rem;
}

.ln-name {
  display: grid;
  color: var(--ink);
  font-weight: 700;
  line-height: 1.2;
}

.ln-name small {
  color: var(--muted);
  font-size: 0.66rem;
  font-weight: 600;
}

.ln-price {
  color: var(--ink);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.phone-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 4px 4px 0;
  border-top: 1px dashed var(--line);
  font-size: 0.78rem;
  font-weight: 700;
}

.phone-total strong {
  color: var(--blue);
  font-size: 1.15rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.phone-pay {
  padding: 10px;
  border-radius: 12px;
  background: var(--blue);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
  text-align: center;
  transition: background-color 0.3s;
}

.phone-pay.done {
  background: #059669;
}

.line-enter-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.line-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

/* Receipt prints out of the bottom edge of the phone */
.receipt-slot {
  position: relative;
  z-index: 1;
  margin: -6px 14px 0;
  overflow: hidden;
}

.receipt {
  padding: 16px 12px 18px;
  background: var(--paper);
  color: #1e293b;
  font-family: var(--mono);
  font-size: 0.66rem;
  line-height: 1.55;
  box-shadow: 0 10px 16px -10px rgba(15, 23, 42, 0.35);
  transform: translateY(-101%);
  transition: transform 1.3s cubic-bezier(0.16, 1, 0.3, 1);
  mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 10px 51% repeat-x,
    linear-gradient(#000 0 0) top / 100% calc(100% - 5px) no-repeat;
}

.receipt.out {
  transform: translateY(0);
}

.r-head,
.r-foot {
  font-weight: 700;
  text-align: center;
}

.r-head {
  padding-bottom: 6px;
  border-bottom: 1px dashed #94a3b8;
  margin-bottom: 4px;
}

.r-foot {
  padding-top: 6px;
  border-top: 1px dashed #94a3b8;
  margin-top: 4px;
}

.r-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.r-strong {
  font-weight: 800;
  margin-top: 4px;
}

.replay {
  position: absolute;
  bottom: 16px;
  left: 50%;
  translate: -50% 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.replay-icon {
  width: 16px;
  height: 16px;
}

/* Sections */
.compare,
.biz,
.inside,
.pricing,
.close {
  padding: 64px 0 56px;
}

.compare h2,
.biz h2 {
  margin-bottom: 24px;
}

.inside .sub,
.pricing .sub {
  margin: 12px 0 28px;
}

/* Versus board: old way gets struck through, KasirOK chip springs in */
.vs-legend {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-weight: 900;
}

.legend-old {
  justify-self: start;
  padding: 8px 12px;
  background: var(--paper);
  border: 1px solid #e7dcc4;
  color: #78716c;
  font-size: 0.9rem;
  rotate: -2deg;
  box-shadow: 0 6px 12px -8px rgba(120, 113, 108, 0.6);
}

.legend-vs {
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.legend-ok {
  justify-self: end;
  padding: 8px 14px;
  border-radius: 12px;
  background: var(--blue);
  color: #fff;
  font-size: 0.95rem;
  rotate: 1.5deg;
}

.vs {
  display: grid;
  gap: 10px;
  padding: 0;
  list-style: none;
}

.vs-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  grid-template-areas:
    "icon task task task"
    "old old arrow ok";
  align-items: center;
  gap: 10px 10px;
  padding: 14px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid var(--line);
}

.vs-icon {
  grid-area: icon;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--blue-50);
  color: var(--blue);
  font-size: 22px;
}

.vs-task {
  grid-area: task;
  color: var(--ink);
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.vs-old {
  grid-area: old;
  color: #a8a29e;
  font-size: 0.95rem;
  font-weight: 700;
}

.strike {
  position: relative;
  text-decoration: none;
}

/* Hand-drawn strike in red marker */
.strike::after {
  content: '';
  position: absolute;
  left: -3px;
  right: -3px;
  top: 52%;
  height: 3px;
  border-radius: 3px;
  background: #ef4444;
  rotate: -3deg;
  transform-origin: left;
  transition: transform 0.45s cubic-bezier(0.65, 0, 0.35, 1) calc(var(--i, 0) * 90ms + 200ms);
}

.vs-arrow {
  grid-area: arrow;
  width: 18px;
  height: 18px;
  color: var(--muted);
}

.vs-ok {
  grid-area: ok;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--blue);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.2;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i, 0) * 90ms + 550ms),
    opacity 0.3s calc(var(--i, 0) * 90ms + 550ms);
}

.vs-check {
  width: 16px;
  height: 16px;
  flex: none;
}

.vs-row.will-reveal .strike::after {
  transform: scaleX(0);
}

.vs-row.will-reveal .vs-ok {
  opacity: 0;
  transform: scale(0.5) rotate(-8deg);
}

.vs-row.will-reveal.is-in .strike::after {
  transform: scaleX(1);
}

.vs-row.will-reveal.is-in .vs-ok {
  opacity: 1;
  transform: none;
}

/* Fade-up for headings and groups */
.rv-up {
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) calc(var(--i, 0) * 110ms),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) calc(var(--i, 0) * 110ms);
}

.rv-up.will-reveal:not(.is-in),
.vs-legend.will-reveal:not(.is-in) {
  opacity: 0;
  transform: translateY(18px);
}

.vs-legend {
  transition: opacity 0.5s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Businesses: split-flap word + tiles that drop in */
.biz {
  background: #fff;
  border-block: 1px solid var(--line);
}

.flap-title {
  margin-bottom: 26px;
}

.flap {
  display: inline-grid;
  vertical-align: bottom;
  perspective: 400px;
  color: var(--blue);
}

.flap > span {
  grid-area: 1 / 1;
  padding: 0 8px;
  border-radius: 10px;
  background: var(--blue-50);
  backface-visibility: hidden;
  transform: rotateX(90deg);
  transform-origin: 50% 100%;
  opacity: 0;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s;
}

.flap > span.on {
  transform: none;
  opacity: 1;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0;
  list-style: none;
}

.tile {
  display: grid;
  gap: 8px;
  align-content: start;
  padding: 16px;
  border-radius: 20px;
  background: var(--tint);
  color: var(--ink);
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i, 0) * 100ms),
    opacity 0.3s calc(var(--i, 0) * 100ms), box-shadow 0.3s;
}

.tile.lit {
  box-shadow: 0 0 0 3px var(--ink);
}

.tile.will-reveal:not(.is-in) {
  opacity: 0;
  transform: translateY(-40px) rotate(var(--r));
}

.tile-icon {
  width: 30px;
  height: 30px;
}

.tile strong {
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.2;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.chips span {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  font-size: 0.78rem;
  font-weight: 700;
}

/* Inside the app */
.groups {
  display: grid;
  gap: 28px;
}

.group h3 {
  padding-bottom: 10px;
  margin-bottom: 4px;
  border-bottom: 2px solid var(--blue);
}

.group ul {
  padding: 0;
  list-style: none;
}

.group li {
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
  color: var(--text);
  font-size: 0.95rem;
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
  .vs-row {
    grid-template-columns: auto 0.8fr 1fr auto 1fr;
    grid-template-areas: "icon task old arrow ok";
    padding: 14px 20px;
  }

  .tiles {
    grid-template-columns: repeat(3, 1fr);
  }

  .groups {
    grid-template-columns: repeat(3, 1fr);
  }

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
    padding: 56px 0 24px;
  }

  .hero-grid {
    grid-template-columns: 5fr 7fr;
    gap: 24px;
    align-items: center;
  }

  /* Tall enough for phone + fully printed receipt */
  .stage {
    height: 740px;
    padding-bottom: 0;
  }

  .stage-3d {
    position: absolute;
    inset: 4% 42% 34% -2%;
    height: auto;
    margin: 0;
    align-items: center;
  }

  .device {
    position: absolute;
    top: 20px;
    right: 2%;
    width: 268px;
    margin: 0;
  }

  .phone-lines li {
    font-size: 0.8rem;
  }

  .compare,
  .biz,
  .inside,
  .pricing,
  .close {
    padding: 96px 0 80px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .receipt,
  .line-enter-active,
  .phone-pay {
    transition: none;
  }
}
</style>
