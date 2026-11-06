<script setup lang="ts">
// Same four jobs, two ways. A pill toggle (same language as the hero tabs)
// flips every answer; it auto-flips while on screen until someone taps it.
const rows = [
  { img: 'abacus', task: 'Total belanja', old: 'Ketik satu-satu', ok: 'Tap barang' },
  { img: 'coin', task: 'Kembalian', old: 'Hitung di kepala', ok: 'Otomatis' },
  { img: 'box', task: 'Stok', old: 'Hitung rak', ok: 'Berkurang sendiri' },
  { img: 'chart', task: 'Tutup toko', old: 'Rekap malam', ok: 'Laporan jadi' }
]

const kasir = ref(false)
const root = ref<HTMLElement>()
let timer: ReturnType<typeof setInterval> | undefined
let io: IntersectionObserver | undefined

function pick(v: boolean) {
  clearInterval(timer)
  io?.disconnect()
  kasir.value = v
}

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  io = new IntersectionObserver(([e]) => {
    clearInterval(timer)
    if (e?.isIntersecting) timer = setInterval(() => (kasir.value = !kasir.value), 2600)
  }, { threshold: 0.4 })
  io.observe(root.value!)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  io?.disconnect()
})
</script>

<template>
  <div
    ref="root"
    class="cmp"
  >
    <h2>Dua cara ngitung.</h2>

    <div
      class="switch"
      role="group"
      aria-label="Bandingkan cara"
    >
      <button
        type="button"
        :aria-pressed="!kasir"
        :class="{ on: !kasir }"
        @click="pick(false)"
      >
        Kalkulator + buku
      </button>
      <button
        type="button"
        :aria-pressed="kasir"
        :class="{ on: kasir }"
        @click="pick(true)"
      >
        KasirOK
      </button>
    </div>

    <ul
      class="board"
      :class="kasir ? 'is-ok' : 'is-old'"
    >
      <li
        v-for="(r, i) in rows"
        :key="r.task"
        class="row"
      >
        <img
          :src="`/images/goods/${r.img}.webp`"
          alt=""
          width="48"
          height="48"
        >
        <span class="task">{{ r.task }}</span>
        <span
          :key="String(kasir)"
          class="val"
          :style="{ animationDelay: `${i * 70}ms` }"
        >
          <UIcon
            v-if="kasir"
            name="i-lucide-check"
            class="tick"
          />
          <s
            v-else
            class="strike"
          >{{ r.old }}</s>
          <template v-if="kasir">{{ r.ok }}</template>
        </span>
      </li>
    </ul>

    <p
      class="verdict"
      :class="{ ok: kasir }"
    >
      {{ kasir ? 'Beres sendiri.' : 'Capek, gampang salah.' }}
    </p>
  </div>
</template>

<style scoped>
.cmp {
  display: grid;
  justify-items: center;
  gap: 18px;
  text-align: center;
}

h2 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(1.7rem, 4.6vw, 2.75rem);
  font-weight: 900;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.switch {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 6px 18px -10px rgba(15, 23, 42, 0.35);
}

.switch button {
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #64748b;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.switch button.on {
  background: #2563eb;
  color: #fff;
}

.switch button:first-child.on {
  background: #78716c;
}

.switch button:focus-visible {
  outline: 3px solid #f0c624;
  outline-offset: 2px;
}

.board {
  display: grid;
  width: min(100%, 520px);
  padding: 8px 18px;
  margin: 0;
  list-style: none;
  border-radius: 24px;
  text-align: left;
  transition: background-color 0.4s, box-shadow 0.4s;
}

/* Old way reads like a lined notebook page; KasirOK like the app's white card */
.is-old {
  background: #fffdf5 repeating-linear-gradient(transparent 0 63px, #ece3cf 63px 64px);
  box-shadow: 0 12px 28px -18px rgba(120, 113, 108, 0.6);
  rotate: -0.6deg;
}

.is-ok {
  background: #fff;
  box-shadow: 0 16px 34px -18px rgba(37, 99, 235, 0.45);
}

.row {
  display: grid;
  grid-template-columns: 48px 1fr;
  grid-template-areas: "img task" "img val";
  align-items: center;
  column-gap: 14px;
  min-height: 64px;
  padding: 6px 0;
}

.row img {
  grid-area: img;
  width: 44px;
  height: 44px;
}

.task {
  grid-area: task;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
}

.val {
  grid-area: val;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: -0.01em;
  transform-origin: 50% 0;
  animation: flip 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.is-old .val {
  color: #a8a29e;
}

.is-ok .val {
  color: #0f172a;
}

.tick {
  width: 20px;
  height: 20px;
  padding: 2px;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
}

.strike {
  position: relative;
  text-decoration: none;
}

.strike::after {
  content: '';
  position: absolute;
  left: -3px;
  right: -3px;
  top: 52%;
  height: 3px;
  border-radius: 3px;
  background: #ef4444;
  rotate: -2deg;
  transform-origin: left;
  animation: draw 0.4s 0.25s cubic-bezier(0.65, 0, 0.35, 1) backwards;
}

.verdict {
  margin: 0;
  color: #a8a29e;
  font-size: 1rem;
  font-weight: 800;
}

.verdict.ok {
  color: #2563eb;
}

@keyframes flip {
  from { opacity: 0; transform: rotateX(80deg); }
}

@keyframes draw {
  from { transform: scaleX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .val,
  .strike::after {
    animation: none;
  }
}
</style>
