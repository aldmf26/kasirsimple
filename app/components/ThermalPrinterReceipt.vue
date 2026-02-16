<template>
  <div
    id="receipt-content"
    class="bg-white p-4 font-mono text-xs text-gray-800 border border-gray-100 shadow-sm"
  >
    <!-- Store Info -->
    <div class="text-center mb-4">
      <img
        v-if="showLogo && store?.logo_url"
        :src="store.logo_url"
        class="w-20 h-20 object-contain mx-auto mb-2"
      />
      <h2 class="font-bold text-base uppercase">
        {{ store?.name || "Kasir Simple" }}
      </h2>
      <template v-if="showStoreInfo">
        <p v-if="store?.address">{{ store.address }}</p>
        <p v-if="store?.phone">{{ store.phone }}</p>
      </template>
      <p class="mt-2">
        {{ formatDateTime(transaction.created_at) }}
      </p>
      <p>
        No:
        {{ transaction.transaction_number || transaction.id }}
      </p>
      <p v-if="transaction.customer_name">
        Customer: {{ transaction.customer_name }}
      </p>
    </div>

    <hr class="border-t border-dashed border-gray-400 my-2" />

    <!-- Items with Unit Price -->
    <div class="space-y-2">
      <div
        v-for="(item, idx) in transaction.items"
        :key="idx"
        class="space-y-1"
      >
        <div class="flex justify-between text-[11px]">
          <span class="truncate pr-2"
            >{{ item.quantity }}x {{ item.product_name }}</span
          >
          <span class="whitespace-nowrap">{{
            formatCurrency(item.product_price * item.quantity)
          }}</span>
        </div>
        <div class="text-gray-600 text-[10px] ml-2">
          {{ item.quantity }} pcs × {{ formatCurrency(item.product_price) }}
        </div>
      </div>
    </div>

    <hr class="border-t border-dashed border-gray-400 my-2" />

    <!-- Summary -->
    <div class="space-y-1 font-bold">
      <!-- Subtotal -->
      <div class="flex justify-between">
        <span>SUBTOTAL</span>
        <span>{{ formatCurrency(transaction.subtotal) }}</span>
      </div>

      <!-- Diskon Manual (hanya tampil kalau ada) -->
      <div
        v-if="transaction.discount > 0"
        class="flex justify-between text-orange-700"
      >
        <span>DISKON MANUAL</span>
        <span>-{{ formatCurrency(transaction.discount) }}</span>
      </div>

      <!-- Diskon Sistem (hanya tampil kalau ada) -->
      <div
        v-if="(transaction.discount_from_settings || 0) > 0"
        class="flex justify-between text-orange-700"
      >
        <span>DISKON SISTEM</span>
        <span
          >-{{ formatCurrency(transaction.discount_from_settings || 0) }}</span
        >
      </div>

      <!-- Tax (hanya tampil kalau ada) -->
      <div
        v-if="(transaction.tax || 0) > 0"
        class="flex justify-between text-blue-700"
      >
        <span>PAJAK ({{ transaction.tax_percentage }}%)</span>
        <span>+{{ formatCurrency(transaction.tax) }}</span>
      </div>

      <!-- PPN (hanya tampil kalau ada) -->
      <div
        v-if="(transaction.ppn || 0) > 0"
        class="flex justify-between text-blue-700"
      >
        <span>PPN ({{ transaction.ppn_percentage }}%)</span>
        <span>+{{ formatCurrency(transaction.ppn) }}</span>
      </div>

      <!-- Total -->
      <div class="flex justify-between text-sm pt-1 mt-1 border-t border-gray-200">
        <span>TOTAL</span>
        <span>{{ formatCurrency(transaction.total) }}</span>
      </div>

      <!-- Bayar -->
      <div class="flex justify-between">
        <span
          >BAYAR ({{
            transaction.payment_method === "cash"
              ? "Tunai"
              : transaction.payment_method === "qris"
                ? "QRIS"
                : transaction.payment_method === "card"
                  ? "Kartu"
                  : "Transfer"
          }})</span
        >
        <span>{{
          formatCurrency(transaction.paid_amount || transaction.total)
        }}</span>
      </div>

      <!-- Kembali/Change -->
      <div class="flex justify-between">
        <span>KEMBALI</span>
        <span>{{
          formatCurrency(
            (transaction.paid_amount || transaction.total) - transaction.total,
          )
        }}</span>
      </div>
    </div>

    <div class="mt-6 text-center text-[11px]">
      <div v-if="footerText" class="whitespace-pre-line text-gray-600">
        {{ footerText }}
      </div>
      <template v-else>
        <p>Terima Kasih</p>
        <p>Silahkan Datang Kembali</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatCurrency, formatDateTime } from "~/utils/helpers";

const props = defineProps<{
  transaction: any;
  store?: any;
  settings?: {
    include_logo?: boolean;
    include_store_info?: boolean;
    footer_text?: string;
    paper_width?: number;
    includeLogo?: boolean;
    includeStoreInfo?: boolean;
    footerText?: string;
    paperWidth?: number;
  };
}>();

const showLogo = computed(() => {
  if (props.settings?.include_logo !== undefined) return props.settings.include_logo;
  if (props.settings?.includeLogo !== undefined) return props.settings.includeLogo;
  return true;
});

const showStoreInfo = computed(() => {
  if (props.settings?.include_store_info !== undefined) return props.settings.include_store_info;
  if (props.settings?.includeStoreInfo !== undefined) return props.settings.includeStoreInfo;
  return true;
});

const footerText = computed(() => {
  return props.settings?.footer_text || props.settings?.footerText || "";
});
</script>

<style scoped>
/* Print style untuk cetak struk */
@media print {
  body * {
    visibility: hidden;
  }
  #receipt-content,
  #receipt-content * {
    visibility: visible;
  }
  #receipt-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white !important;
  }
}
</style>
