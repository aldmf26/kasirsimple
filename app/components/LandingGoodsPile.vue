<script setup lang="ts">
// Goods (Fluent Emoji 3D, MIT) drop one by one onto a pile; each landing
// is reported so the phone cart can add its line. Pure CSS, no WebGL.
export type GoodsKind = 'egg' | 'box' | 'laundry' | 'drink' | 'noodle' | 'charger'

const props = defineProps<{ kinds: GoodsKind[] }>()
const emit = defineEmits<{ land: [index: number] }>()

// Resting spot per kind: left %, bottom %, width %, tilt.
const SPOT: Record<GoodsKind, [number, number, number, number]> = {
  box: [44, 6, 40, -4],
  laundry: [6, 4, 40, 3],
  egg: [16, 40, 24, -12],
  drink: [76, 10, 22, 6],
  noodle: [46, 44, 32, 4],
  charger: [74, 42, 20, 18]
}

const run = ref(0)
const reduced = ref(false)

onMounted(() => {
  reduced.value = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced.value) props.kinds.forEach((_, i) => emit('land', i))
})

defineExpose({
  replay: () => {
    run.value++
    if (reduced.value) props.kinds.forEach((_, i) => emit('land', i))
  }
})
</script>

<template>
  <div
    :key="run"
    class="pile"
    :class="{ still: reduced }"
    aria-hidden="true"
  >
    <span class="floor" />
    <span
      v-for="(k, i) in kinds"
      :key="k"
      class="drop"
      :style="{
        'left': `${SPOT[k][0]}%`,
        'bottom': `${SPOT[k][1]}%`,
        'width': `${SPOT[k][2]}%`,
        '--tilt': `${SPOT[k][3]}deg`,
        '--d': `${0.5 + i * 0.64}s`,
        '--f': `${(i % 3) * 0.7}s`
      }"
      @animationend.self="emit('land', i)"
    >
      <img
        :src="`/images/goods/${k}.webp`"
        alt=""
        width="256"
        height="256"
        decoding="async"
        class="float"
      >
    </span>
  </div>
</template>

<style scoped>
.pile {
  position: relative;
  width: min(100%, 420px);
  aspect-ratio: 1.25;
  margin: 0 auto;
}

.floor {
  position: absolute;
  left: 6%;
  right: 4%;
  bottom: 0;
  height: 16%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(15, 23, 42, 0.22), rgba(15, 23, 42, 0));
}

.drop {
  position: absolute;
  rotate: var(--tilt);
  opacity: 0;
  animation: drop 0.62s cubic-bezier(0.22, 1, 0.36, 1) var(--d) forwards;
}

.drop img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 10px 10px rgba(15, 23, 42, 0.18));
}

/* After landing each item breathes on its own phase so the pile feels alive. */
.float {
  animation: float 3.2s ease-in-out calc(var(--d) + 0.7s + var(--f)) infinite;
}

@keyframes drop {
  0% { opacity: 0; transform: translateY(-160%) rotate(-14deg); }
  12% { opacity: 1; }
  72% { transform: translateY(5%) rotate(2deg) scaleY(0.92); }
  100% { opacity: 1; transform: none; }
}

@keyframes float {
  50% { transform: translateY(-4%); }
}

.still .drop {
  opacity: 1;
  animation: none;
}

.still .float {
  animation: none;
}
</style>
