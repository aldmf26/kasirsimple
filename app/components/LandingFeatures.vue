<script setup lang="ts">
// Feature tiles: one icon, one tiny loop that shows what the feature does,
// two-word label. Loops only run while the grid is on screen.
const features = [
  { fx: 'scan', icon: 'i-lucide-scan-barcode', label: 'Scan barcode' },
  { fx: 'type', icon: 'i-lucide-calculator', label: 'Harga cepat' },
  { fx: 'tilt', icon: 'i-lucide-scale', label: 'Jual per berat' },
  { fx: 'print', icon: 'i-lucide-printer', label: 'Struk Bluetooth' },
  { fx: 'offline', icon: 'i-lucide-wifi-off', label: 'Jalan offline' },
  { fx: 'bob', icon: 'i-lucide-package', label: 'Stok & modal' },
  { fx: 'write', icon: 'i-lucide-notebook-pen', label: 'Hutang pelanggan' },
  { fx: 'bars', icon: '', label: 'Laporan harian' }
]

const root = ref<HTMLElement>()
const live = ref(false)
let io: IntersectionObserver | undefined
onMounted(() => {
  io = new IntersectionObserver(([e]) => (live.value = !!e?.isIntersecting))
  io.observe(root.value!)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <ul
    ref="root"
    class="grid"
    :class="{ live }"
  >
    <li
      v-for="(f, i) in features"
      :key="f.label"
      class="tile"
      :style="{ '--i': i }"
    >
      <span
        :class="['art', `fx-${f.fx}`]"
        aria-hidden="true"
      >
        <span
          v-if="f.fx === 'bars'"
          class="bars"
        ><i /><i /><i /></span>
        <UIcon
          v-else
          :name="f.icon"
          class="ico"
        />
        <span
          v-if="f.fx === 'scan'"
          class="beam"
        />
        <span
          v-if="f.fx === 'print'"
          class="paper"
        />
        <span
          v-if="f.fx === 'offline'"
          class="dot"
        />
        <span
          v-if="f.fx === 'type'"
          class="rp"
        >Rp</span>
      </span>
      <span class="label">{{ f.label }}</span>
    </li>
  </ul>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.tile {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 20px 10px 18px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 10px 24px -18px rgba(15, 23, 42, 0.45);
  text-align: center;
}

.label {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.2;
}

.art {
  position: relative;
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 22px;
  background: #eff6ff;
  color: #2563eb;
  overflow: hidden;
}

.ico {
  width: 36px;
  height: 36px;
}

/* Every loop is paused until the grid scrolls into view */
.art,
.art * {
  animation-play-state: paused !important;
}

.live .art,
.live .art * {
  animation-play-state: running !important;
}

.beam {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 20px;
  height: 2px;
  border-radius: 2px;
  background: #ef4444;
  box-shadow: 0 0 8px 1px rgba(239, 68, 68, 0.7);
  animation: scan 1.6s ease-in-out infinite alternate;
}

.paper {
  position: absolute;
  left: 50%;
  top: 46px;
  width: 18px;
  height: 14px;
  margin-left: -9px;
  border: 1.5px solid #2563eb;
  border-top: 0;
  background: #fff;
  transform-origin: top;
  animation: paper 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.dot {
  position: absolute;
  right: 14px;
  bottom: 14px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #10b981;
  animation: ping 1.8s ease-out infinite;
}

.rp {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 1px 5px;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 900;
  animation: pop 2s ease-in-out infinite;
}

.fx-type .ico { animation: press 2s ease-in-out infinite; }
.fx-tilt .ico { animation: tilt 2.4s ease-in-out infinite; }
.fx-bob .ico { animation: bob 2s ease-in-out infinite; }
.fx-write .ico { animation: write 1.4s ease-in-out infinite; }
.fx-offline .ico { animation: blink 1.8s ease-in-out infinite; }

.bars {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 36px;
}

.bars i {
  width: 9px;
  border-radius: 3px;
  background: #2563eb;
  animation: grow 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.bars i:nth-child(1) { height: 40%; }
.bars i:nth-child(2) { height: 70%; animation-delay: 0.15s; }
.bars i:nth-child(3) { height: 100%; animation-delay: 0.3s; }

@keyframes scan { to { top: 50px; } }
@keyframes paper { 0%, 15% { transform: scaleY(0); } 60%, 100% { transform: scaleY(1); } }
@keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); } 100% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } }
@keyframes pop { 0%, 40% { transform: scale(0); } 55%, 100% { transform: scale(1); } }
@keyframes press { 0%, 100% { transform: none; } 45% { transform: scale(0.88); } }
@keyframes tilt { 0%, 100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }
@keyframes bob { 0%, 100% { transform: none; } 50% { transform: translateY(-5px); } }
@keyframes write { 0%, 100% { transform: none; } 50% { transform: translate(2px, -2px) rotate(-6deg); } }
@keyframes blink { 50% { opacity: 0.45; } }
@keyframes grow { 0% { transform: scaleY(0.2); } 50%, 100% { transform: none; } }

.bars i {
  transform-origin: bottom;
}

@media (min-width: 720px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .art *,
  .art .ico {
    animation: none !important;
  }
}
</style>
