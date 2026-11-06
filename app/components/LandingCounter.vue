<script setup lang="ts">
// Interactive hero: tap a goods card, it flies into the KasirOK phone in the
// middle, the cart and total update, "Bayar" prints the receipt.
// Icons: Microsoft Fluent Emoji 3D (MIT), /images/goods/*.webp.
interface Item { id: string, name: string, qty: string, price: number }
interface Line extends Item { count: number }

const cats: { label: string, word: string, items: Item[] }[] = [
  { label: 'Sembako', word: 'WARUNG', items: [
    { id: 'egg', name: 'Telur', qty: '1 kg', price: 28000 },
    { id: 'rice', name: 'Beras', qty: '5 kg', price: 72000 },
    { id: 'box', name: 'Snack', qty: '1 dus', price: 24000 },
    { id: 'drink', name: 'Teh kotak', qty: '1 pcs', price: 4000 }
  ] },
  { label: 'Konter', word: 'KONTER', items: [
    { id: 'charger', name: 'Charger', qty: '1 pcs', price: 35000 },
    { id: 'battery', name: 'Powerbank', qty: '1 pcs', price: 120000 },
    { id: 'headphone', name: 'Headset', qty: '1 pcs', price: 45000 },
    { id: 'phone', name: 'Casing HP', qty: '1 pcs', price: 25000 }
  ] },
  { label: 'Laundry', word: 'LAUNDRY', items: [
    { id: 'tshirt', name: 'Cuci kiloan', qty: '3 kg', price: 21000 },
    { id: 'laundry', name: 'Cuci + setrika', qty: '3 kg', price: 30000 },
    { id: 'socks', name: 'Cuci sepatu', qty: '1 psg', price: 35000 },
    { id: 'soap', name: 'Pewangi', qty: '1 btl', price: 15000 }
  ] },
  { label: 'Kedai', word: 'KEDAI', items: [
    { id: 'coffee', name: 'Kopi', qty: '1 gls', price: 8000 },
    { id: 'iced', name: 'Es teh', qty: '1 gls', price: 5000 },
    { id: 'bread', name: 'Roti bakar', qty: '1 porsi', price: 15000 },
    { id: 'noodle', name: 'Mie rebus', qty: '1 porsi', price: 12000 }
  ] }
]

const active = ref(0)
const cat = computed(() => cats[active.value]!)
const lines = ref<Line[]>([])
const paid = ref(false)
const total = computed(() => lines.value.reduce((s, l) => s + l.price * l.count, 0))
const count = computed(() => lines.value.reduce((s, l) => s + l.count, 0))
const cash = computed(() => Math.ceil(total.value / 50000) * 50000)
const rp = (n: number) => formatCurrency(n)

const root = ref<HTMLElement>()
const screen = ref<HTMLElement>()
let reduced = false
let demo: ReturnType<typeof setTimeout>[] = []

function add(item: Item, card?: HTMLElement) {
  if (paid.value) reset()
  const line = lines.value.find(l => l.id === item.id)
  if (line) line.count++
  else lines.value.push({ ...item, count: 1 })
  if (card && !reduced) fly(card)
}

function tap(item: Item, e: MouseEvent) {
  demo.forEach(clearTimeout)
  add(item, e.currentTarget as HTMLElement)
}

// Clone the card's icon and arc it into the phone screen.
function fly(card: HTMLElement) {
  const img = card.querySelector('img')
  if (!img || !screen.value) return
  const a = img.getBoundingClientRect()
  const b = screen.value.getBoundingClientRect()
  const ghost = img.cloneNode() as HTMLImageElement
  Object.assign(ghost.style, {
    position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`,
    height: `${a.height}px`, zIndex: '60', pointerEvents: 'none'
  })
  document.body.appendChild(ghost)
  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height * 0.4 - (a.top + a.height / 2)
  ghost.animate([
    { transform: 'none' },
    { transform: `translate(${dx / 2}px, ${dy / 2 - 70}px) scale(0.9) rotate(-10deg)`, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 }
  ], { duration: 650, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' }).onfinish = () => ghost.remove()
}

function pay() {
  if (count.value) paid.value = true
}
function reset() {
  lines.value = []
  paid.value = false
}

onMounted(() => {
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const picks = [0, 3, 1].map(i => cats[0]!.items[i]!)
  if (reduced) return picks.forEach(i => add(i))
  // Short self-demo so the mechanism is visible before anyone taps.
  demo = picks.map((item, n) => setTimeout(() => {
    add(item, root.value?.querySelector<HTMLElement>(`[data-id="${item.id}"]`) ?? undefined)
  }, 900 + n * 750))
})
onBeforeUnmount(() => demo.forEach(clearTimeout))
</script>

<template>
  <div
    ref="root"
    class="counter"
  >
    <div
      class="tabs"
      role="tablist"
      aria-label="Jenis usaha"
    >
      <button
        v-for="(c, i) in cats"
        :key="c.label"
        type="button"
        role="tab"
        :aria-selected="i === active"
        :class="{ on: i === active }"
        @click="active = i"
      >
        {{ c.label }}
      </button>
    </div>

    <div class="arena">
      <span
        :key="cat.word"
        class="ghost"
        aria-hidden="true"
      >{{ cat.word }}</span>

      <ul
        :key="active"
        class="shelf"
      >
        <li
          v-for="(item, i) in cat.items"
          :key="item.id"
          :class="['slot', `s${i}`]"
        >
          <button
            type="button"
            class="card"
            :data-id="item.id"
            :aria-label="`Tambah ${item.name} ${rp(item.price)}`"
            @click="tap(item, $event)"
          >
            <img
              :src="`/images/goods/${item.id}.webp`"
              alt=""
              width="256"
              height="256"
            >
            <span class="c-name">{{ item.name }}</span>
            <span class="c-price">{{ rp(item.price) }}</span>
          </button>
        </li>
      </ul>

      <div class="phone">
        <div
          ref="screen"
          class="screen"
        >
          <div class="bar">
            <span>{{ paid ? 'Struk' : 'Keranjang' }}</span>
            <span class="num">{{ count }} item</span>
          </div>

          <div
            v-if="paid"
            class="receipt"
          >
            <p class="r-head">
              KASIROK
            </p>
            <p
              v-for="l in lines"
              :key="l.id"
              class="r-row"
            >
              <span>{{ l.count }}x {{ l.name }}</span><span>{{ (l.price * l.count).toLocaleString('id-ID') }}</span>
            </p>
            <p class="r-row r-strong">
              <span>TOTAL</span><span>{{ total.toLocaleString('id-ID') }}</span>
            </p>
            <p class="r-row">
              <span>Tunai</span><span>{{ cash.toLocaleString('id-ID') }}</span>
            </p>
            <p class="r-row">
              <span>Kembali</span><span>{{ (cash - total).toLocaleString('id-ID') }}</span>
            </p>
          </div>

          <TransitionGroup
            v-else
            tag="ul"
            name="line"
            class="lines"
          >
            <li
              v-if="!lines.length"
              key="empty"
              class="empty"
            >
              Tap barangnya
            </li>
            <li
              v-for="l in lines.slice(-4)"
              :key="l.id"
              class="line"
            >
              <img
                :src="`/images/goods/${l.id}.webp`"
                alt=""
                width="28"
                height="28"
              >
              <span class="l-name">{{ l.name }}<small>{{ l.count }} × {{ l.qty }}</small></span>
              <span class="num">{{ rp(l.price * l.count) }}</span>
            </li>
          </TransitionGroup>

          <div
            class="sum"
            aria-live="polite"
          >
            <span>Total</span>
            <strong class="num">{{ rp(total) }}</strong>
          </div>
          <button
            v-if="paid"
            type="button"
            class="pay done"
            @click="reset"
          >
            Transaksi baru
          </button>
          <button
            v-else
            type="button"
            class="pay"
            :disabled="!count"
            @click="pay"
          >
            Bayar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.counter {
  --blue: #2563eb;
  --ink: #0f172a;
  --muted: #64748b;

  display: grid;
  justify-items: center;
  gap: 18px;
}

/* Pill tabs */
.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 6px 18px -10px rgba(15, 23, 42, 0.35);
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs button {
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.25s, color 0.25s;
}

.tabs button.on {
  background: var(--blue);
  color: #fff;
}

.tabs button:focus-visible,
.card:focus-visible,
.pay:focus-visible {
  outline: 3px solid #f0c624;
  outline-offset: 2px;
}

/* Stage: phone in the middle, ghost word behind, cards around it */
.arena {
  position: relative;
  display: grid;
  grid-template-areas: "phone" "shelf";
  justify-items: center;
  gap: 18px;
  width: 100%;
}

.ghost {
  position: absolute;
  top: 4%;
  left: 50%;
  translate: -50% 0;
  color: #dbeafe;
  font-size: clamp(4.2rem, 21vw, 13rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}

.shelf {
  grid-area: shelf;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
}

.card {
  display: grid;
  justify-items: center;
  gap: 2px;
  width: 100%;
  padding: 10px 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 10px 24px -14px rgba(15, 23, 42, 0.45);
  color: var(--ink);
  font: inherit;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 28px -14px rgba(37, 99, 235, 0.5);
}

.card:active {
  transform: scale(0.95);
}

.card img {
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
  filter: drop-shadow(0 6px 6px rgba(15, 23, 42, 0.18));
}

.c-name {
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.15;
  text-align: center;
}

.c-price {
  color: var(--blue);
  font-size: 0.74rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* Phone */
.phone {
  grid-area: phone;
  position: relative;
  z-index: 2;
  width: min(270px, 78vw);
  padding: 8px;
  border-radius: 38px;
  background: var(--ink);
  box-shadow: 0 30px 50px -24px rgba(15, 23, 42, 0.6);
}

.screen {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 8px;
  height: 340px;
  padding: 14px 12px 12px;
  border-radius: 31px;
  background: #fff;
  text-align: left;
  overflow: hidden;
}

.bar {
  display: flex;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 14px;
  background: var(--blue);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
}

.num {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.lines {
  display: grid;
  align-content: start;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.empty {
  padding: 40px 0;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
}

.line {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 12px;
  background: #f8fafc;
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 800;
}

.line img {
  width: 28px;
  height: 28px;
}

.l-name {
  display: grid;
  line-height: 1.2;
}

.l-name small {
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 600;
}

.sum {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 4px 0;
  border-top: 1px dashed #e2e8f0;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 800;
}

.sum strong {
  color: var(--blue);
  font-size: 1.25rem;
  font-weight: 900;
}

.pay {
  min-height: 46px;
  border: 0;
  border-radius: 14px;
  background: var(--blue);
  color: #fff;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
}

.pay:disabled {
  background: #cbd5e1;
  cursor: default;
}

.pay.done {
  background: #059669;
}

/* Receipt prints down inside the phone */
.receipt {
  padding: 10px 10px 14px;
  background: #fffdf8;
  border: 1px solid #f1ead8;
  color: #1e293b;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.66rem;
  line-height: 1.6;
  overflow: hidden;
  animation: print 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.r-head {
  margin: 0 0 4px;
  padding-bottom: 4px;
  border-bottom: 1px dashed #94a3b8;
  font-weight: 700;
  text-align: center;
}

.r-row {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.r-strong {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #94a3b8;
  font-weight: 800;
}

@keyframes print {
  from { clip-path: inset(0 0 100% 0); transform: translateY(-12px); }
}

/* Transitions */
.line-enter-active {
  transition: opacity 0.35s, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.line-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.94);
}

/* Tab switch: new word and shelf rise in (keyed remount, CSS only) */
.ghost {
  animation: rise 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.slot {
  animation: rise 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.s1 { animation-delay: 50ms; }
.s2 { animation-delay: 100ms; }
.s3 { animation-delay: 150ms; }

@keyframes rise {
  from { opacity: 0; transform: translateY(18px); }
}

/* Desktop: two cards each side, outer ones set back like a curved shelf */
@media (min-width: 900px) {
  .arena {
    grid-template-areas: "phone";
    min-height: 500px;
    align-items: center;
  }

  .ghost {
    top: -6px;
  }

  .shelf {
    position: absolute;
    inset: 0;
    display: block;
    perspective: 1000px;
  }

  .slot {
    position: absolute;
    top: 50%;
    width: 170px;
  }

  .s0 { left: calc(50% - 470px); translate: 0 -40%; }
  .s1 { left: calc(50% - 300px); translate: 0 -58%; }
  .s2 { left: calc(50% + 130px); translate: 0 -58%; }
  .s3 { left: calc(50% + 300px); translate: 0 -40%; }

  .s0 .card { transform: rotateY(24deg) scale(0.86); }
  .s3 .card { transform: rotateY(-24deg) scale(0.86); }
  .s0 .card:hover,
  .s3 .card:hover { transform: rotateY(0) scale(0.92); }

  .card {
    padding: 18px 10px 16px;
    border-radius: 24px;
    backdrop-filter: blur(10px);
  }

  .card img {
    width: 96px;
    height: 96px;
    margin-bottom: 8px;
  }

  .c-name {
    font-size: 0.95rem;
  }

  .c-price {
    font-size: 0.9rem;
  }

  .phone {
    width: 270px;
  }

  .screen {
    height: 460px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .receipt,
  .ghost,
  .slot {
    animation: none;
  }
}
</style>
