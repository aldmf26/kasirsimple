<script setup lang="ts">
import {
  allocateDebtPayment,
  formatCurrency,
  formatDate,
  formatDateTime,
  type CustomerDebt,
} from "~/utils/helpers";
import type { DebtPayment } from "~/composables/useDebts";

definePageMeta({ layout: "default" });
useHead({ title: "Hutang Pelanggan - KasirOK" });

const { store } = useStore();
const { debts, totalRemaining, loading, fetchDebts, fetchPayments, payDebts } = useDebts();
const toast = useToast();

const search = ref("");
const openKey = ref<string | null>(null);
const payments = ref<Record<string, DebtPayment[]>>({});

const load = async () => {
  try {
    await fetchDebts();
  } catch (e: any) {
    toast.add({ title: "Gagal memuat hutang", description: e.message, color: "error" });
  }
};

watch(() => store.value?.id, (id) => id && load(), { immediate: true });

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return debts.value;
  return debts.value.filter(
    (d) => d.name.toLowerCase().includes(q) || (d.phone || "").includes(q),
  );
});
const totalNota = computed(() => debts.value.reduce((s, d) => s + d.transactions.length, 0));

const toggle = async (debt: CustomerDebt) => {
  openKey.value = openKey.value === debt.key ? null : debt.key;
  if (openKey.value && !payments.value[debt.key]) {
    try {
      payments.value[debt.key] = await fetchPayments(debt.transactions.map((t) => t.id));
    } catch {
      payments.value[debt.key] = [];
    }
  }
};

const notaNumber = (debt: CustomerDebt, transactionId: string) =>
  debt.transactions.find((t) => t.id === transactionId)?.transaction_number || "";

// ---- Bayar cicilan ----
const paying = ref<CustomerDebt | null>(null);
const amountText = ref("");
const method = ref<"cash" | "transfer">("cash");
const note = ref("");
const saving = ref(false);

const amount = computed(() => Number(amountText.value.replace(/\D/g, "")) || 0);
const onAmountInput = () => {
  amountText.value = amount.value ? amount.value.toLocaleString("id-ID") : "";
};
const setAmount = (value: number) => {
  amountText.value = value.toLocaleString("id-ID");
};

const preview = computed(() =>
  paying.value ? allocateDebtPayment(paying.value.transactions, amount.value) : [],
);
const amountError = computed(() => {
  if (!paying.value || !amountText.value) return "";
  if (amount.value <= 0) return "Isi jumlah bayar";
  if (amount.value > paying.value.remaining) return `Maksimal ${formatCurrency(paying.value.remaining)}`;
  return "";
});

const openPay = (debt: CustomerDebt) => {
  paying.value = debt;
  amountText.value = "";
  method.value = "cash";
  note.value = "";
};

const submitPay = async () => {
  const debt = paying.value;
  if (!debt || amount.value <= 0 || amountError.value) return;
  saving.value = true;
  try {
    await payDebts(
      debt.transactions.map((t) => t.id),
      amount.value,
      method.value,
      note.value,
    );
    const left = debt.remaining - amount.value;
    toast.add({
      title: left > 0 ? "Cicilan tersimpan" : "Hutang lunas",
      description: left > 0
        ? `${debt.name} bayar ${formatCurrency(amount.value)}, sisa ${formatCurrency(left)}`
        : `${debt.name} sudah lunas`,
      color: "success",
      icon: "i-heroicons-check-circle",
    });
    paying.value = null;
    delete payments.value[debt.key];
    await load();
    const stillOpen = debts.value.find((d) => d.key === debt.key);
    if (stillOpen && openKey.value === debt.key) {
      payments.value[debt.key] = await fetchPayments(stillOpen.transactions.map((t) => t.id));
    }
  } catch (e: any) {
    toast.add({ title: "Gagal menyimpan", description: e.message, color: "error" });
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
    <div>
      <h1 class="text-2xl font-black text-gray-900">Hutang Pelanggan</h1>
      <p class="text-sm text-gray-500">Catat cicilan dari pelanggan yang belum lunas.</p>
    </div>

    <!-- Ringkasan -->
    <div class="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 p-5">
      <p class="text-xs font-bold uppercase tracking-wide text-red-700">Total belum dibayar</p>
      <p class="mt-1 text-3xl font-black text-red-700">{{ formatCurrency(totalRemaining) }}</p>
      <p class="mt-1 text-sm text-gray-600">
        {{ debts.length }} pelanggan · {{ totalNota }} nota
      </p>
    </div>

    <div class="relative">
      <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        v-model="search"
        type="search"
        placeholder="Cari nama atau nomor WA..."
        class="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>

    <div v-if="loading && !debts.length" class="py-12 text-center text-gray-400">Memuat...</div>

    <div v-else-if="!debts.length" class="rounded-2xl bg-white border border-gray-100 py-12 text-center">
      <UIcon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto text-emerald-400" />
      <p class="mt-2 font-bold text-gray-700">Tidak ada hutang</p>
      <p class="text-sm text-gray-500">Semua pelanggan sudah lunas.</p>
    </div>

    <p v-else-if="!filtered.length" class="py-8 text-center text-sm text-gray-500">
      Tidak ada pelanggan yang cocok.
    </p>

    <!-- Daftar per pelanggan -->
    <div v-else class="space-y-3">
      <div
        v-for="debt in filtered"
        :key="debt.key"
        class="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden"
      >
        <button
          type="button"
          class="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50"
          :aria-expanded="openKey === debt.key"
          @click="toggle(debt)"
        >
          <div class="w-10 h-10 shrink-0 rounded-full bg-red-100 text-red-700 font-black flex items-center justify-center">
            {{ debt.name.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-bold text-gray-900 truncate">{{ debt.name }}</p>
            <p class="text-xs text-gray-500 truncate">
              {{ debt.transactions.length }} nota · sejak {{ formatDate(debt.oldestAt) }}
              <span v-if="debt.phone"> · {{ debt.phone }}</span>
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-black text-red-600">{{ formatCurrency(debt.remaining) }}</p>
            <UIcon
              :name="openKey === debt.key ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
              class="w-4 h-4 text-gray-400"
            />
          </div>
        </button>

        <div v-if="openKey === debt.key" class="border-t border-gray-100 p-4 space-y-4 bg-gray-50/60">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Nota belum lunas</p>
            <div class="divide-y divide-gray-100 rounded-xl bg-white border border-gray-100">
              <div v-for="t in debt.transactions" :key="t.id" class="flex items-center justify-between gap-3 px-3 py-2.5">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-800 truncate">{{ t.transaction_number }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(t.created_at) }} · total {{ formatCurrency(Number(t.total) || 0) }}</p>
                </div>
                <p class="text-sm font-bold text-red-600 shrink-0">sisa {{ formatCurrency(t.remaining) }}</p>
              </div>
            </div>
          </div>

          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Riwayat cicilan</p>
            <p v-if="!payments[debt.key]" class="text-sm text-gray-400">Memuat...</p>
            <p v-else-if="!payments[debt.key]!.length" class="text-sm text-gray-500">Belum ada cicilan.</p>
            <div v-else class="divide-y divide-gray-100 rounded-xl bg-white border border-gray-100">
              <div v-for="p in payments[debt.key]" :key="p.id" class="flex items-center justify-between gap-3 px-3 py-2.5">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-800">{{ formatDateTime(p.created_at) }}</p>
                  <p class="text-xs text-gray-500 truncate">
                    {{ p.payment_method === "cash" ? "Tunai" : "Transfer" }} · {{ notaNumber(debt, p.transaction_id) }}
                    <span v-if="p.note"> · {{ p.note }}</span>
                  </p>
                </div>
                <p class="text-sm font-bold text-emerald-600 shrink-0">+{{ formatCurrency(Number(p.amount)) }}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-[0.98] transition"
            @click="openPay(debt)"
          >
            Bayar Cicilan
          </button>
        </div>
      </div>
    </div>

    <!-- Modal bayar -->
    <Teleport to="body">
      <div
        v-if="paying"
        class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
        @click.self="paying = null"
      >
        <form
          class="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          @submit.prevent="submitPay"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-black text-gray-900">Bayar Cicilan</h2>
              <p class="text-sm text-gray-500">
                {{ paying.name }} · sisa {{ formatCurrency(paying.remaining) }}
              </p>
            </div>
            <button type="button" class="p-1 text-gray-400 hover:text-gray-600" aria-label="Tutup" @click="paying = null">
              <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
            </button>
          </div>

          <div>
            <label for="debt-amount" class="block text-sm font-bold text-gray-700 mb-1.5">Jumlah bayar</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
              <input
                id="debt-amount"
                v-model="amountText"
                inputmode="numeric"
                autocomplete="off"
                placeholder="0"
                class="w-full pl-12 pr-4 py-3 rounded-xl border-2 text-xl font-black focus:outline-none"
                :class="amountError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'"
                @input="onAmountInput"
              />
            </div>
            <p v-if="amountError" class="mt-1 text-xs font-semibold text-red-600">{{ amountError }}</p>
            <button
              type="button"
              class="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100"
              @click="setAmount(paying.remaining)"
            >
              Lunas semua {{ formatCurrency(paying.remaining) }}
            </button>
          </div>

          <div>
            <p class="text-sm font-bold text-gray-700 mb-1.5">Dibayar dengan</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="m in [{ value: 'cash', label: 'Tunai' }, { value: 'transfer', label: 'Transfer' }]"
                :key="m.value"
                type="button"
                class="py-2.5 rounded-xl border-2 font-bold"
                :class="method === m.value ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-700'"
                @click="method = m.value as 'cash' | 'transfer'"
              >
                {{ m.label }}
              </button>
            </div>
          </div>

          <div>
            <label for="debt-note" class="block text-sm font-bold text-gray-700 mb-1.5">Catatan (opsional)</label>
            <input
              id="debt-note"
              v-model="note"
              placeholder="mis. titip lewat anaknya"
              class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <p v-if="preview.length && !amountError" class="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            Dibayarkan ke {{ preview.length }} nota terlama.
            Sisa setelah ini: <b>{{ formatCurrency(paying.remaining - amount) }}</b>
          </p>

          <button
            type="submit"
            class="w-full py-3.5 rounded-xl bg-blue-600 text-white font-black disabled:bg-gray-300"
            :disabled="saving || amount <= 0 || !!amountError"
          >
            {{ saving ? "Menyimpan..." : "Simpan Pembayaran" }}
          </button>
        </form>
      </div>
    </Teleport>
  </div>
</template>
