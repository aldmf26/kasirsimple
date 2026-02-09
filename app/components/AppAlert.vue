<template>
  <div v-if="show" class="fixed top-24 right-4 z-[90] max-w-sm w-full animate-[slide-in_0.3s_ease-out]">
    <div
      class="p-4 rounded-xl border flex items-center gap-3 shadow-lg transition-all"
      :class="type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'"
    >
      <UIcon
        :name="type === 'success' ? 'i-heroicons-check-circle-20-solid' : 'i-heroicons-exclamation-circle-20-solid'"
        class="w-6 h-6 flex-shrink-0"
      />
      <div>
        <p class="font-bold text-sm">{{ message }}</p>
      </div>
      <button @click="$emit('close')" class="ml-auto text-current opacity-70 hover:opacity-100">
        <UIcon name="i-heroicons-x-mark" class="w-5 h-5"/>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  type: 'success' | 'error'
  message: string
}>()
defineEmits(['close'])
</script>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
