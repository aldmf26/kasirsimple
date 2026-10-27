<template>
  <div v-if="storeSettings?.customer_enabled !== false" class="mb-4">
    <label class="block text-sm font-bold text-gray-700 mb-2">Pelanggan</label>
    <div class="flex gap-2">
      <USelectMenu
        v-model="selectedCustomer"
        :options="customerOptions"
        :searchable="true"
        placeholder="Pilih atau cari pelanggan (opsional)"
        value-attribute="value"
        option-attribute="label"
        class="flex-1"
        @update:model-value="onCustomerChange"
      />
      <UButton
        v-if="selectedCustomer"
        @click="clearCustomer"
        color="gray"
        variant="ghost"
        icon="i-heroicons-x-mark"
        size="sm"
      />
    </div>
    <p v-if="selectedCustomer && customerInfo" class="text-xs text-gray-500 mt-1">
      {{ customerInfo.phone }} {{ customerInfo.address ? '• ' + customerInfo.address : '' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCustomers } from '~/composables/useCustomers'
import { useStore } from '~/composables/useStore'

const props = defineProps<{
  modelValue?: { id?: string, name?: string, phone?: string } | null
}>()

const emit = defineEmits(['update:modelValue'])

const { customers, fetchCustomers } = useCustomers()
const { store } = useStore()

const storeSettings = computed(() => store.value as any)

const selectedCustomer = ref<string>('')

const customerOptions = computed(() => {
  const options = [
    { label: 'Umum (Tanpa Pelanggan)', value: '' }
  ]
  customers.value.forEach(c => {
    options.push({
      label: c.name + (c.phone ? ` - ${c.phone}` : ''),
      value: c.id
    })
  })
  return options
})

const customerInfo = computed(() => {
  if (!selectedCustomer.value) return null
  return customers.value.find(c => c.id === selectedCustomer.value)
})

const onCustomerChange = (val: string) => {
  if (!val) {
    emit('update:modelValue', null)
  } else {
    const c = customers.value.find(x => x.id === val)
    emit('update:modelValue', c ? { id: c.id, name: c.name, phone: c.phone || undefined } : null)
  }
}

const clearCustomer = () => {
  selectedCustomer.value = ''
  emit('update:modelValue', null)
}

watch(() => props.modelValue, (val) => {
  if (!val?.id) {
    selectedCustomer.value = ''
  } else {
    selectedCustomer.value = val.id
  }
}, { immediate: true })

onMounted(async () => {
  if (storeSettings.value?.customer_enabled !== false) {
    await fetchCustomers(true)
  }
})
</script>
