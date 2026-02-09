<template>
  <div
    id="receipt-content"
    class="bg-white p-4 font-mono text-xs text-gray-800 border border-gray-100 shadow-sm"
  >
    <!-- Store Info -->
    <div class="text-center mb-4">
      <img
        v-if="store?.logo_url"
        :src="store.logo_url"
        class="w-16 h-16 object-contain mx-auto mb-2 grayscale"
      />
      <h2 class="font-bold text-base uppercase">
        {{ store?.name || "Kasir Simple" }}
      </h2>
      <p v-if="store?.address">{{ store.address }}</p>
      <p v-if="store?.phone">{{ store.phone }}</p>
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
        <div class="flex justify-between">
          <span class="truncate pr-2"
            >{{ item.quantity }}x {{ item.product_name }}</span
          >
          <span class="whitespace-nowrap">{{
            formatCurrency(item.product_price * item.quantity)
          }}</span>
        </div>
        <div class="text-gray-600 ml-2">
          {{ item.quantity }} pcs × {{ formatCurrency(item.product_price) }}
        </div>
      </div>
    </div>

    <hr class="border-t border-dashed border-gray-400 my-2" />

    <!-- Summary -->
    <div class="space-y-1 font-bold">
      <div class="flex justify-between">
        <span>TOTAL</span>
        <span>{{ formatCurrency(transaction.total) }}</span>
      </div>
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
      <div class="flex justify-between">
        <span>KEMBALI</span>
        <span>{{
          formatCurrency(
            (transaction.paid_amount || transaction.total) - transaction.total,
          )
        }}</span>
      </div>
    </div>

    <div class="mt-6 text-center">
      <p>Terima Kasih</p>
      <p>Silahkan Datang Kembali</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~/utils/helpers";

defineProps<{
  transaction: any;
  store?: any;
}>();
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
