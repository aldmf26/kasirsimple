<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~/utils/helpers";
import { Line, Bar, Pie, Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

definePageMeta({
  layout: "default",
});

const { store } = useStore();
const { transactions, loading, fetchTransactions, deleteTransaction } =
  useTransactions();
const { products, fetchProducts } = useProducts();
const {
  getSalesByDate,
  getSalesByPaymentMethod,
  getTopSellingProducts,
  getTransactionCountByMethod,
  getAllItemsSold,
} = useCharts();
// Initialize expenses composable
const { 
  expenses, 
  fetchExpenses, 
  addExpense, 
  deleteExpense, 
  loading: expenseLoading 
} = useExpenses();
const toast = useToast();

// Modal states
const selectedTransaction = ref(null);
const showReceiptModal = ref(false);
const showDeleteModal = ref(false);
const deleteLoading = ref(false);
const showAddExpenseModal = ref(false);
const submitExpenseLoading = ref(false);

const expenseForm = reactive({
  category: "Lainnya",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  note: "",
});

const expenseCategories = ["Gaji", "Sewa", "Listrik & Air", "Bahan Baku", "Peralatan", "Maintenance", "Pemasaran", "Lainnya"];

// Search state
const searchQuery = ref("");

// Chart visibility toggle (single, persisted to localStorage)
const showCharts = ref(true);

const initChartsVisibility = () => {
  if (import.meta.client) {
    const saved = localStorage.getItem('kasirsimple_show_charts');
    if (saved !== null) {
      showCharts.value = saved === 'true';
    }
  }
};
initChartsVisibility();

const toggleCharts = () => {
  showCharts.value = !showCharts.value;
  if (import.meta.client) {
    localStorage.setItem('kasirsimple_show_charts', String(showCharts.value));
  }
};

// Filtered transactions for search
const filteredTransactions = computed(() => {
  if (!searchQuery.value.trim()) return transactions.value;
  const q = searchQuery.value.toLowerCase().trim();
  return transactions.value.filter((t: any) => {
    const txNumber = (t.transaction_number || "").toLowerCase();
    const method = t.payment_method === "cash" ? "tunai" : "transfer";
    const total = formatCurrency(t.total).toLowerCase();
    const date = formatDateTime(t.created_at).toLowerCase();
    return (
      txNumber.includes(q) ||
      method.includes(q) ||
      total.includes(q) ||
      date.includes(q)
    );
  });
});

// Stats Calculation
const totalSales = computed(() => {
  return transactions.value.reduce((sum, t) => sum + (t.total || 0), 0);
});

const totalTransactions = computed(() => transactions.value.length);
const averageTransaction = computed(() => {
  if (totalTransactions.value === 0) return 0;
  return totalSales.value / totalTransactions.value;
});

// Chart Data
const salesByDateData = computed(() => {
  const { dates, sales } = getSalesByDate(transactions.value);
  return {
    labels: dates,
    datasets: [
      {
        label: "Penjualan Harian",
        data: sales,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

const paymentMethodData = computed(() => {
  const { methods, amounts } = getSalesByPaymentMethod(transactions.value);
  return {
    labels: methods,
    datasets: [
      {
        data: amounts,
        backgroundColor: ["#10b981", "#f59e0b"],
        borderColor: ["#059669", "#d97706"],
        borderWidth: 2,
      },
    ],
  };
});

const topProductsData = computed(() => {
  const { products: names, quantities } = getTopSellingProducts(
    transactions.value,
    5,
  );
  return {
    labels: names,
    datasets: [
      {
        label: "Jumlah Terjual",
        data: quantities,
        backgroundColor: [
          "#3b82f6",
          "#8b5cf6",
          "#ec4899",
          "#f59e0b",
          "#10b981",
        ],
        borderColor: ["#1e40af", "#6d28d9", "#be185d", "#b45309", "#047857"],
        borderWidth: 2,
      },
    ],
  };
});

const paymentMethodCountData = computed(() => {
  const { methods, counts } = getTransactionCountByMethod(transactions.value);
  return {
    labels: methods,
    datasets: [
      {
        data: counts,
        backgroundColor: ["#06b6d4", "#f43f5e"],
        borderColor: ["#0891b2", "#be185d"],
        borderWidth: 2,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
    },
  },
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function (value: any) {
          return "Rp " + value.toLocaleString("id-ID");
        },
      },
    },
  },
};

// Top Selling Items Computed
const allItemsSold = computed(() => getAllItemsSold(transactions.value));

// ============ TAB STATE ============
const activeTab = ref('sales');

// ============ PROFIT/LOSS CALCULATIONS ============
const buyPriceMap = computed(() => {
  const map = new Map<string, number>();
  for (const p of (products.value || [])) {
    map.set(p.id, Number((p as any).buy_price) || 0);
  }
  return map;
});

const profitByProduct = computed(() => {
  const productMap = new Map();
  for (const t of transactions.value) {
    for (const item of ((t as any).items || [])) {
      const key = item.product_id || item.product_name;
      const existing = productMap.get(key) || { name: item.product_name, qty: 0, revenue: 0, cost: 0 };
      existing.qty += item.quantity;
      existing.revenue += Number(item.subtotal) || 0;
      existing.cost += (buyPriceMap.value.get(item.product_id) || 0) * item.quantity;
      productMap.set(key, existing);
    }
  }
  return Array.from(productMap.values())
    .map((p: any) => ({
      ...p,
      profit: p.revenue - p.cost,
      margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue * 100) : 0,
    }))
    .sort((a: any, b: any) => b.profit - a.profit);
});

const totalRevenue = computed(() => profitByProduct.value.reduce((s: number, p: any) => s + p.revenue, 0));
const totalCost = computed(() => profitByProduct.value.reduce((s: number, p: any) => s + p.cost, 0));
const grossProfit = computed(() => totalRevenue.value - totalCost.value);
const totalExpenses = computed(() => expenses.value.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
const netProfit = computed(() => grossProfit.value - totalExpenses.value);
const profitMargin = computed(() => totalRevenue.value > 0 ? (grossProfit.value / totalRevenue.value * 100) : 0);
const netProfitMargin = computed(() => totalRevenue.value > 0 ? (netProfit.value / totalRevenue.value * 100) : 0);

// Check if any product has buy_price set
const hasBuyPriceData = computed(() => {
  return Array.from(buyPriceMap.value.values()).some(v => v > 0);
});

// ============ DAILY REPORT ============
const dailyReport = computed(() => {
  const dayMap = new Map();
  for (const t of transactions.value) {
    const dateKey = new Date(t.created_at).toISOString().split('T')[0];
    const dateLabel = new Date(t.created_at).toLocaleDateString('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    const existing = dayMap.get(dateKey) || {
      dateLabel, dateKey,
      totalTransactions: 0, totalSales: 0,
      cashSales: 0, nonCashSales: 0,
      totalItems: 0, totalCost: 0,
    };
    existing.totalTransactions += 1;
    existing.totalSales += Number(t.total) || 0;
    if (t.payment_method === 'cash') {
      existing.cashSales += Number(t.total) || 0;
    } else {
      existing.nonCashSales += Number(t.total) || 0;
    }
    for (const item of ((t as any).items || [])) {
      existing.totalItems += item.quantity;
      existing.totalCost += (buyPriceMap.value.get(item.product_id) || 0) * item.quantity;
    }
    dayMap.set(dateKey, existing);
  }
  return Array.from(dayMap.values())
    .map((d: any) => ({ ...d, totalProfit: d.totalSales - d.totalCost }))
    .sort((a: any, b: any) => b.dateKey.localeCompare(a.dateKey));
});

// View Receipt
const viewReceipt = (transaction: any) => {
  selectedTransaction.value = transaction;
  showReceiptModal.value = true;
};

// Delete Transaction
const confirmDelete = (transaction: any) => {
  selectedTransaction.value = transaction;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!selectedTransaction.value) return;

  deleteLoading.value = true;
  try {
    await deleteTransaction((selectedTransaction.value as any).id);
    toast.add({
      title: "Berhasil",
      description: `Transaksi ${(selectedTransaction.value as any).transaction_number} berhasil dihapus dan stok dikembalikan`,
      color: "success",
      icon: "i-heroicons-check-circle",
    });
    showDeleteModal.value = false;
    selectedTransaction.value = null;
    // Refresh data (transactions + products for updated stock)
    await loadData();
  } catch (error) {
    toast.add({
      title: "Gagal",
      description: "Gagal menghapus transaksi",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    deleteLoading.value = false;
  }
};

// Print Receipt
const printReceipt = () => {
  const content = document.getElementById("receipt-content")?.innerHTML;
  const printWindow = window.open("", "", "height=600,width=400");
  if (printWindow && content) {
    printWindow.document.write("<html><head><title>Struk Belanja</title>");
    printWindow.document.write(
      "<style>body{font-family:monospace; font-size: 12px; text-align: center;} .flex{display:flex; justify-content:space-between;} .bold{font-weight:bold;} hr{border-top: 1px dashed #000; border-bottom: none;} img{max-width: 80px; margin: 0 auto; display: block;}</style>",
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(content);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  }
};

// Filters
const filters = reactive({
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
  paymentMethod: "all",
});
const activeFilter = ref("today");

const setFilter = (type: string) => {
  activeFilter.value = type;
  const end = new Date();
  const start = new Date();

  if (type === "today") {
    // start stays today
  } else if (type === "week") {
    start.setDate(end.getDate() - 7);
  } else if (type === "month") {
    start.setDate(end.getDate() - 30);
  } else if (type === "year") {
    start.setMonth(0, 1); // Jan 1st
  }

  filters.startDate = start.toISOString().split("T")[0];
  filters.endDate = end.toISOString().split("T")[0];
  loadData();
};

const loadData = async () => {
  if (store.value) {
    await Promise.all([
      fetchTransactions({
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod,
      }),
      fetchProducts(),
      fetchExpenses({
        startDate: filters.startDate,
        endDate: filters.endDate
      }),
    ]);
  }
};

// Expenses Actions
const submitExpense = async () => {
  if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
    toast.add({ title: "Gagal", description: "Jumlah pengeluaran harus diisi", color: "error" });
    return;
  }
  
  submitExpenseLoading.value = true;
  try {
    await addExpense({
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      date: expenseForm.date,
      note: expenseForm.note
    });
    
    toast.add({ title: "Berhasil", description: "Pengeluaran berhasil dicatat", color: "success" });
    showAddExpenseModal.value = false;
    // Reset form
    expenseForm.amount = "";
    expenseForm.note = "";
    expenseForm.category = "Lainnya";
  } catch (e: any) {
    toast.add({ title: "Gagal", description: e.message || "Gagal menambah pengeluaran", color: "error" });
  } finally {
    submitExpenseLoading.value = false;
  }
};

const removeExpense = async (id: string) => {
  if (!confirm('Hapus data pengeluaran ini?')) return;
  try {
    await deleteExpense(id);
    toast.add({ title: "Berhasil", description: "Pengeluaran dihapus", color: "success" });
  } catch (e: any) {
    toast.add({ title: "Gagal", description: "Gagal menghapus data", color: "error" });
  }
};

// Export to Excel

// Export to Excel
const exportToExcel = () => {
  try {
    // Format values first
    const formattedTotalSales = formatCurrency(totalSales.value);
    const formattedAverage = formatCurrency(averageTransaction.value);

    // Create HTML table for Excel
    let htmlContent = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial;">
        <tr>
          <td colspan="2" style="text-align: center; font-weight: bold; font-size: 14px; background: #f0f0f0;">LAPORAN PENJUALAN</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Toko</td>
          <td>${store.value?.name || "Kasir Simple"}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Periode</td>
          <td>${filters.startDate} hingga ${filters.endDate}</td>
        </tr>
        <tr>
          <td colspan="2"></td>
        </tr>
        <tr style="background: #f0f0f0;">
          <td colspan="2" style="font-weight: bold; font-size: 12px;">RINGKASAN</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Total Penjualan</td>
          <td>${formattedTotalSales}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Total Transaksi</td>
          <td>${totalTransactions.value}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Rata-rata Keranjang</td>
          <td>${formattedAverage}</td>
        </tr>
        <tr>
          <td colspan="2"></td>
        </tr>
        <tr style="background: #f0f0f0;">
          <td colspan="10" style="font-weight: bold; font-size: 12px;">DETAIL TRANSAKSI</td>
        </tr>
        <tr style="background: #333; color: white;">
          <td style="font-weight: bold;">No</td>
          <td style="font-weight: bold;">No. Transaksi</td>
          <td style="font-weight: bold;">Tanggal</td>
          <td style="font-weight: bold;">Metode</td>
          <td style="font-weight: bold; text-align: right;">Subtotal</td>
          <td style="font-weight: bold; text-align: right;">Diskon Manual</td>
          <td style="font-weight: bold; text-align: right;">Diskon Sistem</td>
          <td style="font-weight: bold; text-align: right;">Pajak</td>
          <td style="font-weight: bold; text-align: right;">PPN</td>
          <td style="font-weight: bold; text-align: right;">Total</td>
        </tr>
    `;

    // Add transaction rows
    transactions.value.forEach((t, idx) => {
      htmlContent += `
        <tr>
          <td>${idx + 1}</td>
          <td>${t.transaction_number}</td>
          <td>${formatDateTime(t.created_at)}</td>
          <td>${t.payment_method === "cash" ? "Tunai" : "Transfer"}</td>
          <td style="text-align: right;">${formatCurrency(t.subtotal)}</td>
          <td style="text-align: right;">${formatCurrency(t.discount || 0)}</td>
          <td style="text-align: right;">${formatCurrency(t.discount_from_settings || 0)}</td>
          <td style="text-align: right;">${formatCurrency(t.tax || 0)}</td>
          <td style="text-align: right;">${formatCurrency(t.ppn || 0)}</td>
          <td style="text-align: right;">${formatCurrency(t.total)}</td>
        </tr>
      `;
    });

    // Add item sold section
    if (allItemsSold.products && allItemsSold.products.length > 0) {
      htmlContent += `
        <tr>
          <td colspan="10"></td>
        </tr>
        <tr style="background: #f0f0f0;">
          <td colspan="4" style="font-weight: bold; font-size: 12px;">ITEM TERJUAL</td>
        </tr>
        <tr style="background: #333; color: white;">
          <td style="font-weight: bold;">No</td>
          <td style="font-weight: bold;">Nama Produk</td>
          <td style="font-weight: bold; text-align: right;">Jumlah Terjual</td>
          <td style="font-weight: bold; text-align: right;">Total Penjualan</td>
        </tr>
      `;

      allItemsSold.products.forEach((product, idx) => {
        htmlContent += `
          <tr>
            <td>${idx + 1}</td>
            <td>${product}</td>
            <td style="text-align: right;">${allItemsSold.quantities[idx]} unit</td>
            <td style="text-align: right;">${formatCurrency(allItemsSold.sales?.[idx] || 0)}</td>
          </tr>
        `;
      });
    }

    htmlContent += `</table>`;

    // Download as Excel-compatible HTML
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:application/vnd.ms-excel;charset=utf-8,${encodeURIComponent(htmlContent)}`,
    );
    element.setAttribute(
      "download",
      `Laporan_Penjualan_${filters.startDate}_${filters.endDate}.xls`,
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.add({
      title: "Berhasil",
      description: "Laporan berhasil diekspor ke Excel",
      color: "success",
      icon: "i-heroicons-check-circle",
    });
  } catch (error: any) {
    toast.add({
      title: "Gagal",
      description: error.message || "Gagal mengekspor laporan",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  }
};

// Export to PDF
const exportToPDF = () => {
  try {
    // Format values first
    const formattedTotalSales = formatCurrency(totalSales.value);
    const formattedAverage = formatCurrency(averageTransaction.value);

    // Build transaction rows HTML
    const transactionRows = transactions.value
      .map(
        (t, idx) => `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd;">${idx + 1}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${t.transaction_number}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${formatDateTime(t.created_at)}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${t.payment_method === "cash" ? "Tunai" : "Transfer"}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatCurrency(t.subtotal)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatCurrency(t.discount || 0)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatCurrency(t.discount_from_settings || 0)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatCurrency(t.tax || 0)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatCurrency(t.ppn || 0)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatCurrency(t.total)}</td>
        </tr>
      `,
      )
      .join("");

    const pdfContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; font-size: 12px; line-height: 1.6;">
        <h1 style="text-align: center; margin-bottom: 10px;">LAPORAN PENJUALAN</h1>
        <p style="text-align: center; margin-bottom: 5px;"><strong>Toko: ${store.value?.name || "Kasir Simple"}</strong></p>
        <p style="text-align: center; margin-bottom: 20px;">Periode: ${filters.startDate} hingga ${filters.endDate}</p>
        
        <h3 style="border-bottom: 2px solid #333; padding-bottom: 8px;">RINGKASAN</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: #f0f0f0;">
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Total Penjualan</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formattedTotalSales}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Total Transaksi</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${totalTransactions.value}</td>
          </tr>
          <tr style="background: #f0f0f0;">
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Rata-rata Keranjang</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formattedAverage}</td>
          </tr>
        </table>

        <h3 style="border-bottom: 2px solid #333; padding-bottom: 8px; page-break-before: always; margin-top: 20px;">DETAIL TRANSAKSI</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
          <tr style="background: #333; color: white;">
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">No</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">No. Transaksi</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">Tanggal</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">Metode</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Subtotal</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Diskon Manual</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Diskon Sistem</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Pajak</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold; text-align: right;">PPN</td>
            <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Total</td>
          </tr>
          ${transactionRows}
        </table>
      </div>
    `;

    const printWindow = window.open("", "", "height=800,width=1200");
    if (printWindow) {
      printWindow.document.write("<html><head><title>Laporan Penjualan</title>");
      printWindow.document.write(
        "<style>@media print { body { margin: 0; } table { page-break-inside: avoid; } }</style>",
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(pdfContent);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }

    toast.add({
      title: "Berhasil",
      description: "Laporan siap untuk dicetak ke PDF",
      color: "success",
      icon: "i-heroicons-check-circle",
    });
  } catch (error: any) {
    toast.add({
      title: "Gagal",
      description: error.message || "Gagal mengekspor ke PDF",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  }
};

// Backup Data
const backupData = () => {
  try {
    const backupData = {
      store: store.value,
      transactions: transactions.value,
      products: products.value,
      exportedAt: new Date().toISOString(),
      filters: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    };

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`,
    );
    element.setAttribute(
      "download",
      `Backup_Data_${new Date().toISOString().split("T")[0]}.json`,
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.add({
      title: "Berhasil",
      description: "Data berhasil dibackup",
      color: "success",
      icon: "i-heroicons-check-circle",
    });
  } catch (error: any) {
    toast.add({
      title: "Gagal",
      description: error.message || "Gagal membackup data",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  }
};

onMounted(() => {
  loadData();
});

watch(
  () => store.value,
  async (newStore) => {
    if (newStore) {
      loadData();
    }
  },
);
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50 overflow-auto">
    <!-- Header -->
    <div class="px-8 py-6 border-b border-gray-200 bg-white shadow-sm shrink-0">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p class="text-sm text-gray-500">Ringkasan performa toko anda</p>
        </div>
        <div class="flex gap-2">
          <UButton
            color="blue"
            variant="soft"
            icon="i-heroicons-arrow-down-tray"
            @click="exportToExcel"
            title="Export ke Excel/CSV"
          >
            Export Excel
          </UButton>
          <UButton
            color="red"
            variant="soft"
            icon="i-heroicons-document-text"
            @click="exportToPDF"
            title="Export ke PDF"
          >
            Export PDF
          </UButton>
          <UButton
            color="green"
            variant="soft"
            icon="i-heroicons-cloud-arrow-down"
            @click="backupData"
            title="Backup semua data"
          >
            Backup Data
          </UButton>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="px-8 py-4 bg-white border-b border-gray-200">
      <div
        class="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between"
      >
        <!-- Shortcuts -->
        <div class="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <UButton
            size="xs"
            :color="activeFilter === 'today' ? 'primary' : 'neutral'"
            variant="soft"
            @click="setFilter('today')"
            >Hari Ini</UButton
          >
          <UButton
            size="xs"
            :color="activeFilter === 'week' ? 'primary' : 'neutral'"
            variant="soft"
            @click="setFilter('week')"
            >7 Hari</UButton
          >
          <UButton
            size="xs"
            :color="activeFilter === 'month' ? 'primary' : 'neutral'"
            variant="soft"
            @click="setFilter('month')"
            >30 Hari</UButton
          >
          <UButton
            size="xs"
            :color="activeFilter === 'year' ? 'primary' : 'neutral'"
            variant="soft"
            @click="setFilter('year')"
            >Tahun Ini</UButton
          >
        </div>

        <!-- Manual Filter -->
        <div
          class="flex flex-wrap items-end gap-3 w-full md:w-auto p-2 bg-gray-50 rounded-xl border border-gray-200"
        >
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-500 ml-1"
              >Dari Tanggal</span
            >
            <input
              type="date"
              v-model="filters.startDate"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm"
            />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-500 ml-1"
              >Sampai Tanggal</span
            >
            <input
              type="date"
              v-model="filters.endDate"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm"
            />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-500 ml-1"
              >Metode Bayar</span
            >
            <select
              v-model="filters.paymentMethod"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm min-w-[120px]"
            >
              <option value="all">Semua</option>
              <option value="cash">Tunai</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <UButton
            icon="i-heroicons-funnel"
            size="sm"
            color="primary"
            @click="loadData"
            :loading="loading"
            class="mb-0.5 shadow-sm"
          >
            Terapkan
          </UButton>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="px-8 py-3 bg-white border-b border-gray-200">
      <div class="flex gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto md:inline-flex">
        <button
          @click="activeTab = 'sales'"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 md:flex-none justify-center"
          :class="activeTab === 'sales' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        >
          <UIcon name="i-heroicons-chart-bar-square" class="w-4 h-4" />
          Penjualan
        </button>
        <button
          @click="activeTab = 'profit'"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 md:flex-none justify-center"
          :class="activeTab === 'profit' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        >
          <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
          Laba / Rugi
        </button>
        <button
          @click="activeTab = 'daily'"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 md:flex-none justify-center"
          :class="activeTab === 'daily' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        >
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
          Laporan Harian
        </button>
        <button
          @click="activeTab = 'expenses'"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex-1 md:flex-none justify-center"
          :class="activeTab === 'expenses' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        >
          <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
          Pengeluaran
        </button>
      </div>
    </div>

    <!-- ============ TAB: PENJUALAN ============ -->
    <div v-if="activeTab === 'sales'" class="p-8 space-y-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-banknotes-20-solid" class="w-8 h-8" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Penjualan</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ formatCurrency(totalSales) }}
            </p>
          </div>
        </div>

        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-full bg-success-100 text-success-600 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-shopping-bag-20-solid" class="w-8 h-8" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Transaksi</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ totalTransactions }}
            </p>
          </div>
        </div>

        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-chart-pie-20-solid" class="w-8 h-8" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Rata-rata Keranjang</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ formatCurrency(averageTransaction) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <UIcon name="i-heroicons-chart-bar-square" class="w-5 h-5 text-primary-500" />
          Grafik & Analisis
        </h2>
        <button
          @click="toggleCharts"
          class="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm"
          :class="showCharts ? 'bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'"
        >
          <UIcon :name="showCharts ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-4 h-4" />
          {{ showCharts ? 'Sembunyikan Grafik' : 'Tampilkan Grafik' }}
        </button>
      </div>

      <Transition name="chart-toggle">
        <div v-if="showCharts" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Sales Trend Chart -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Tren Penjualan</h3>
            <div class="h-80">
              <Line
                :data="salesByDateData"
                :options="lineChartOptions"
                v-if="salesByDateData.labels.length > 0"
              />
              <div
                v-else
                class="flex items-center justify-center h-full text-gray-400"
              >
                <p>Tidak ada data penjualan</p>
              </div>
            </div>
          </div>

          <!-- Top Products Chart -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">
              Produk Terlaris (Top 5)
            </h3>
            <div class="h-80">
              <Bar
                :data="topProductsData"
                :options="chartOptions"
                v-if="topProductsData.labels.length > 0"
              />
              <div
                v-else
                class="flex items-center justify-center h-full text-gray-400"
              >
                <p>Tidak ada data produk</p>
              </div>
            </div>
          </div>

          <!-- Payment Method Pie Chart -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">
              Penjualan Berdasarkan Metode Pembayaran
            </h3>
            <div class="h-80 flex items-center justify-center">
              <div class="w-full h-full">
                <Pie
                  :data="paymentMethodData"
                  :options="chartOptions"
                  v-if="paymentMethodData.labels.length > 0"
                />
                <div
                  v-else
                  class="flex items-center justify-center h-full text-gray-400"
                >
                  <p>Tidak ada data pembayaran</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Selling Items Table -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col"
          >
            <h3 class="text-lg font-bold text-gray-900 mb-4">Item Terjual</h3>
            <div
              v-if="allItemsSold.products && allItemsSold.products.length > 0"
              class="overflow-y-auto flex-1"
            >
              <table class="w-full">
                <thead class="sticky top-0 bg-white">
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">
                      No
                    </th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">
                      Nama Produk
                    </th>
                    <th class="text-right py-3 px-4 font-semibold text-gray-700">
                      Jumlah Terjual
                    </th>
                    <th class="text-right py-3 px-4 font-semibold text-gray-700">
                      Total Penjualan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(product, idx) in allItemsSold.products"
                    :key="idx"
                    class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td class="py-3 px-4 text-gray-900 font-medium">
                      {{ idx + 1 }}
                    </td>
                    <td class="py-3 px-4 text-gray-900">{{ product }}</td>
                    <td class="py-3 px-4 text-right text-gray-900 font-semibold">
                      {{ allItemsSold.quantities[idx] }} unit
                    </td>
                    <td class="py-3 px-4 text-right text-gray-900 font-semibold">
                      {{
                        formatCurrency((allItemsSold.sales?.[idx] || 0) as number)
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              v-else
              class="flex items-center justify-center flex-1 text-gray-400 py-8"
            >
              <div class="text-center">
                <UIcon
                  name="i-heroicons-chart-bar"
                  class="w-12 h-12 mx-auto mb-2 opacity-20"
                />
                <p class="font-medium">Belum ada item terjual</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"
      >
        <!-- Header with search -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 class="text-lg font-bold text-gray-900">Transaksi Terakhir</h3>
          <div class="relative w-full sm:w-72">
            <UIcon
              name="i-heroicons-magnifying-glass"
              class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari no invoice, metode, total..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm transition-all placeholder:text-gray-400"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Search result count -->
        <p v-if="searchQuery" class="text-xs text-gray-500 mb-3">
          Menampilkan {{ filteredTransactions.length }} dari {{ transactions.length }} transaksi
        </p>

        <div v-if="filteredTransactions.length > 0" class="divide-y divide-gray-100">
          <div
            v-for="t in filteredTransactions"
            :key="t.id"
            class="py-4 flex flex-col gap-4 group hover:bg-gray-50 px-3 -mx-3 rounded-xl transition-colors"
          >
            <!-- Row Header -->
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"
                >
                  <UIcon name="i-heroicons-receipt-percent" class="w-6 h-6" />
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 truncate">
                    {{
                      t.payment_method === "cash"
                        ? "Pembayaran Tunai"
                        : "Transfer"
                    }}
                  </p>
                  <p class="text-xs font-mono text-primary-600 font-semibold">
                    {{ t.transaction_number }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ formatDateTime(t.created_at) }}
                  </p>
                </div>
              </div>
              <div
                class="flex items-center justify-between sm:justify-end gap-4"
              >
                <span class="text-lg font-bold text-gray-900">{{
                  formatCurrency(t.total)
                }}</span>
                <div class="flex items-center gap-2">
                  <UButton
                    icon="i-heroicons-eye"
                    size="md"
                    color="primary"
                    variant="soft"
                    @click="viewReceipt(t)"
                    class="rounded-xl"
                    title="Lihat Struk"
                  />
                  <UButton
                    icon="i-heroicons-trash"
                    size="md"
                    color="error"
                    variant="soft"
                    @click="confirmDelete(t)"
                    class="rounded-xl"
                    title="Hapus"
                  />
                </div>
              </div>
            </div>

            <!-- Breakdown Info -->
            <div
              class="bg-gray-50 rounded-lg p-3 text-sm space-y-1 border border-gray-200"
            >
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal</span>
                <span class="font-semibold text-gray-900">{{
                  formatCurrency(t.subtotal)
                }}</span>
              </div>

              <!-- Diskon Manual -->
              <div
                v-if="(t.discount || 0) > 0"
                class="flex justify-between text-orange-600"
              >
                <span>Diskon Manual</span>
                <span class="font-semibold"
                  >-{{ formatCurrency(t.discount) }}</span
                >
              </div>

              <!-- Diskon Sistem -->
              <div
                v-if="(t.discount_from_settings || 0) > 0"
                class="flex justify-between text-orange-600"
              >
                <span>Diskon Sistem</span>
                <span class="font-semibold"
                  >-{{ formatCurrency(t.discount_from_settings) }}</span
                >
              </div>

              <!-- Tax -->
              <div
                v-if="(t.tax || 0) > 0"
                class="flex justify-between text-blue-600"
              >
                <span>Pajak ({{ t.tax_percentage }}%)</span>
                <span class="font-semibold">+{{ formatCurrency(t.tax) }}</span>
              </div>

              <!-- PPN -->
              <div
                v-if="(t.ppn || 0) > 0"
                class="flex justify-between text-blue-600"
              >
                <span>PPN ({{ t.ppn_percentage }}%)</span>
                <span class="font-semibold">+{{ formatCurrency(t.ppn) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-400">
          <UIcon
            :name="searchQuery ? 'i-heroicons-magnifying-glass' : 'i-heroicons-document-text'"
            class="w-12 h-12 mx-auto mb-2 opacity-20"
          />
          <p class="font-medium">{{ searchQuery ? 'Tidak ditemukan transaksi yang cocok' : 'Belum ada transaksi' }}</p>
          <p v-if="searchQuery" class="text-sm mt-1">Coba kata kunci lain</p>
        </div>
      </div>
    </div>

    <!-- ============ TAB: LABA / RUGI ============ -->
    <div v-if="activeTab === 'profit'" class="p-8 space-y-8">
      <!-- Warning if no buy_price -->
      <div v-if="!hasBuyPriceData" class="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-amber-800 mb-1">Harga Modal Belum Diisi</p>
          <p class="text-sm text-amber-700">
            Untuk menghitung laba/rugi secara akurat, isi <strong>Harga Beli (Modal)</strong> di setiap produk melalui halaman
            <NuxtLink to="/products" class="underline font-semibold">Manajemen Produk</NuxtLink>.
          </p>
        </div>
      </div>

      <!-- Profit Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Omset</p>
          <p class="text-xl font-bold text-gray-900">{{ formatCurrency(totalRevenue) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Modal (HPP)</p>
          <p class="text-xl font-bold text-red-600">{{ formatCurrency(totalCost) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Laba Kotor</p>
          <p class="text-xl font-bold text-emerald-600">{{ formatCurrency(grossProfit) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pengeluaran</p>
          <p class="text-xl font-bold text-orange-600">{{ formatCurrency(totalExpenses) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border" :class="netProfit >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'">
          <p class="text-xs font-semibold uppercase tracking-wider mb-1" :class="netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'">Laba Bersih</p>
          <p class="text-xl font-bold" :class="netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'">{{ formatCurrency(netProfit) }}</p>
        </div>
      </div>

      <!-- Profit Visual Bar -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Komposisi Keuangan</h3>
        <div class="flex items-center gap-4 mb-3">
          <div class="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden flex relative">
            <!-- Omset Bar is the base 100% -->
             
            <!-- Cost Bar (Red) -->
            <div
              class="h-full bg-red-400 flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
              :style="{ width: `${totalRevenue > 0 ? Math.min((totalCost / totalRevenue) * 100, 100) : 0}%` }"
              title="Modal"
            >
            </div>

            <!-- Expenses Bar (Orange) -->
            <div
              class="h-full bg-orange-400 flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
              :style="{ width: `${totalRevenue > 0 ? Math.min((totalExpenses / totalRevenue) * 100, 100) : 0}%` }"
              title="Pengeluaran"
            >
            </div>

            <!-- Net Profit Bar (Green) -->
             <div
              class="h-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
              :style="{ width: `${totalRevenue > 0 && netProfit > 0 ? Math.min((netProfit / totalRevenue) * 100, 100) : 0}%` }"
              title="Laba Bersih"
            >
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-6 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span class="text-gray-600">Laba Bersih: {{ formatCurrency(netProfit) }} ({{ netProfitMargin.toFixed(1) }}%)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-400"></div>
            <span class="text-gray-600">Modal: {{ formatCurrency(totalCost) }}</span>
          </div>
           <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-orange-400"></div>
            <span class="text-gray-600">Pengeluaran: {{ formatCurrency(totalExpenses) }}</span>
          </div>
        </div>
      </div>
     <!-- Profit by Product Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-5 border-b border-gray-100">
          <h3 class="text-lg font-bold text-gray-900">Laba Kotor per Produk</h3>
          <p class="text-sm text-gray-500">Produk diurutkan dari yang paling menguntungkan (sebelum dikurangi pengeluaran operasional)</p>
        </div>
        <div v-if="profitByProduct.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left py-3 px-5 font-semibold text-gray-600 text-sm">No</th>
                <th class="text-left py-3 px-5 font-semibold text-gray-600 text-sm">Produk</th>
                <th class="text-right py-3 px-5 font-semibold text-gray-600 text-sm">Terjual</th>
                <th class="text-right py-3 px-5 font-semibold text-gray-600 text-sm">Omset</th>
                <th class="text-right py-3 px-5 font-semibold text-gray-600 text-sm">Modal</th>
                <th class="text-right py-3 px-5 font-semibold text-gray-600 text-sm">Laba Kotor</th>
                <th class="text-right py-3 px-5 font-semibold text-gray-600 text-sm">Margin</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, idx) in profitByProduct"
                :key="idx"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td class="py-3 px-5 text-gray-500 text-sm">{{ idx + 1 }}</td>
                <td class="py-3 px-5 font-medium text-gray-900 text-sm">{{ p.name }}</td>
                <td class="py-3 px-5 text-right text-gray-700 text-sm">{{ p.qty }}</td>
                <td class="py-3 px-5 text-right text-gray-900 font-semibold text-sm">{{ formatCurrency(p.revenue) }}</td>
                <td class="py-3 px-5 text-right text-red-600 text-sm">{{ formatCurrency(p.cost) }}</td>
                <td class="py-3 px-5 text-right font-bold text-sm" :class="p.profit >= 0 ? 'text-emerald-600' : 'text-red-600'">{{ formatCurrency(p.profit) }}</td>
                <td class="py-3 px-5 text-right text-sm">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                    :class="p.margin >= 30 ? 'bg-emerald-100 text-emerald-700' : p.margin >= 10 ? 'bg-amber-100 text-amber-700' : p.cost === 0 ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'"
                  >
                    {{ p.cost === 0 ? '-' : p.margin.toFixed(1) + '%' }}
                  </span>
                </td>
              </tr>
            </tbody>
            <!-- Totals row -->
            <tfoot>
              <tr class="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td class="py-3 px-5" colspan="2">TOTAL</td>
                <td class="py-3 px-5 text-right text-sm">{{ profitByProduct.reduce((s, p) => s + p.qty, 0) }}</td>
                <td class="py-3 px-5 text-right text-sm">{{ formatCurrency(totalRevenue) }}</td>
                <td class="py-3 px-5 text-right text-red-600 text-sm">{{ formatCurrency(totalCost) }}</td>
                <td class="py-3 px-5 text-right text-sm" :class="grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'">{{ formatCurrency(grossProfit) }}</td>
                <td class="py-3 px-5 text-right text-sm">{{ profitMargin.toFixed(1) }}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div v-else class="p-12 text-center text-gray-400">
          <UIcon name="i-heroicons-calculator" class="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p class="font-medium">Belum ada data transaksi</p>
        </div>
      </div>
    </div>

    <!-- ============ TAB: LAPORAN HARIAN ============ -->
    <div v-if="activeTab === 'daily'" class="p-8 space-y-6">
      <!-- Daily Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Jumlah Hari</p>
          <p class="text-2xl font-bold text-gray-900">{{ dailyReport.length }} hari</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rata-rata Penjualan / Hari</p>
          <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(dailyReport.length > 0 ? totalSales / dailyReport.length : 0) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rata-rata Transaksi / Hari</p>
          <p class="text-2xl font-bold text-gray-900">{{ dailyReport.length > 0 ? Math.round(totalTransactions / dailyReport.length) : 0 }} transaksi</p>
        </div>
      </div>

      <!-- Daily Cards -->
      <div v-if="dailyReport.length > 0" class="space-y-4">
        <div
          v-for="day in dailyReport"
          :key="day.dateKey"
          class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
        >
          <!-- Day Header -->
          <div class="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <UIcon name="i-heroicons-calendar-days" class="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p class="font-bold text-gray-900">{{ day.dateLabel }}</p>
                <p class="text-sm text-gray-500">{{ day.totalTransactions }} transaksi · {{ day.totalItems }} item terjual</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(day.totalSales) }}</p>
              <p v-if="day.totalCost > 0" class="text-sm font-semibold" :class="day.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'">
                Laba: {{ formatCurrency(day.totalProfit) }}
              </p>
            </div>
          </div>

          <!-- Day Details -->
          <div class="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tunai</p>
              <p class="text-sm font-bold text-gray-900">{{ formatCurrency(day.cashSales) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Non-Tunai</p>
              <p class="text-sm font-bold text-gray-900">{{ formatCurrency(day.nonCashSales) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rata-rata</p>
              <p class="text-sm font-bold text-gray-900">{{ formatCurrency(day.totalTransactions > 0 ? day.totalSales / day.totalTransactions : 0) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Margin</p>
              <p class="text-sm font-bold" :class="day.totalCost > 0 ? (day.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600') : 'text-gray-400'">
                {{ day.totalCost > 0 ? ((day.totalProfit / day.totalSales) * 100).toFixed(1) + '%' : '-' }}
              </p>
            </div>
          </div>

          <!-- Payment Progress Bar -->
          <div class="px-5 pb-4">
            <div class="flex rounded-full h-2 overflow-hidden bg-gray-100">
              <div class="bg-emerald-500 h-full transition-all duration-300" :style="{ width: day.totalSales > 0 ? `${(day.cashSales / day.totalSales) * 100}%` : '0%' }"></div>
              <div class="bg-blue-500 h-full transition-all duration-300" :style="{ width: day.totalSales > 0 ? `${(day.nonCashSales / day.totalSales) * 100}%` : '0%' }"></div>
            </div>
            <div class="flex gap-4 mt-2 text-xs text-gray-500">
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                Tunai {{ day.totalSales > 0 ? ((day.cashSales / day.totalSales) * 100).toFixed(0) : 0 }}%
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                Non-Tunai {{ day.totalSales > 0 ? ((day.nonCashSales / day.totalSales) * 100).toFixed(0) : 0 }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
        <UIcon name="i-heroicons-calendar-days" class="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p class="font-medium">Belum ada data harian</p>
        <p class="text-sm mt-1">Data akan muncul setelah ada transaksi</p>
      </div>
    </div>

    <!-- ============ TAB: PENGELUARAN ============ -->
    <div v-if="activeTab === 'expenses'" class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-gray-900">Riwayat Pengeluaran</h2>
          <p class="text-sm text-gray-500">Catat biaya operasional toko</p>
        </div>
        <UButton
          color="rose"
          icon="i-heroicons-plus"
          @click="showAddExpenseModal = true"
        >
          Catat Pengeluaran
        </UButton>
      </div>

       <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div v-if="expenses.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left py-3 px-5 font-semibold text-gray-600 text-sm">Tanggal</th>
                <th class="text-left py-3 px-5 font-semibold text-gray-600 text-sm">Kategori</th>
                <th class="text-left py-3 px-5 font-semibold text-gray-600 text-sm">Keterangan</th>
                <th class="text-right py-3 px-5 font-semibold text-gray-600 text-sm">Jumlah</th>
                <th class="text-right py-3 px-5 font-semibold text-gray-600 text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="expense in expenses"
                :key="expense.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td class="py-3 px-5 text-gray-900 text-sm">{{ formatDateTime(expense.date) }}</td>
                <td class="py-3 px-5 text-gray-900 text-sm">
                   <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ expense.category }}
                  </span>
                </td>
                <td class="py-3 px-5 text-gray-600 text-sm">{{ expense.note || '-' }}</td>
                <td class="py-3 px-5 text-right font-bold text-rose-600 text-sm">{{ formatCurrency(expense.amount) }}</td>
                <td class="py-3 px-5 text-right text-sm">
                  <UButton
                    size="xs"
                    color="red"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    @click="removeExpense(expense.id)"
                  />
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td class="py-3 px-5" colspan="3">TOTAL PENGELUARAN</td>
                <td class="py-3 px-5 text-right text-rose-600 text-sm">{{ formatCurrency(totalExpenses) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div v-else class="p-12 text-center text-gray-400">
          <UIcon name="i-heroicons-banknotes" class="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p class="font-medium">Belum ada data pengeluaran</p>
          <p class="text-sm mt-1">Klik tombol di atas untuk mencatat pengeluaran baru</p>
        </div>
      </div>
    </div>


    <!-- Modal Struk (Thermal Printer Style) -->
    <Teleport to="body">
      <div
        v-if="showReceiptModal && selectedTransaction"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showReceiptModal = false"
      >
        <div
          class="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col"
        >
          <!-- Thermal Printer Receipt Component -->
          <div class="mb-4">
            <ThermalPrinterReceipt
              :transaction="selectedTransaction"
              :store="store"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              @click="showReceiptModal = false"
              class="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
            >
              TUTUP
            </button>
            <button
              @click="printReceipt"
              class="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <UIcon name="i-heroicons-printer" class="w-5 h-5" />
              PRINT
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal && selectedTransaction"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="!deleteLoading && (showDeleteModal = false)"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center gap-3 mb-5">
            <div
              class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0"
            >
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-7 h-7 text-red-600"
              />
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Hapus Transaksi?</h3>
              <p class="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>

          <!-- Transaction Info -->
          <div class="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-500">No. Invoice</span>
              <span class="text-sm font-bold font-mono text-primary-600">{{ (selectedTransaction as any).transaction_number }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-500">Tanggal</span>
              <span class="text-sm font-medium text-gray-700">{{ formatDateTime((selectedTransaction as any).created_at) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-500">Metode Bayar</span>
              <span class="text-sm font-medium text-gray-700">{{ (selectedTransaction as any).payment_method === 'cash' ? 'Tunai' : (selectedTransaction as any).payment_method === 'qris' ? 'QRIS' : 'Kartu Bank' }}</span>
            </div>
            <div class="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span class="text-sm font-semibold text-gray-700">Total</span>
              <span class="text-lg font-bold text-gray-900">{{ formatCurrency((selectedTransaction as any).total) }}</span>
            </div>
          </div>

          <!-- Stock Restoration Notice -->
          <div class="bg-blue-50 rounded-xl p-4 mb-5 border border-blue-200">
            <div class="flex gap-3">
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-semibold text-blue-800 mb-1">Stok Akan Dikembalikan</p>
                <p class="text-xs text-blue-600 mb-2">
                  Stok produk yang terjual dalam transaksi ini akan otomatis dikembalikan ke inventori.
                </p>
                <!-- Item list -->
                <div
                  v-if="(selectedTransaction as any).items && (selectedTransaction as any).items.length > 0"
                  class="space-y-1"
                >
                  <div
                    v-for="item in (selectedTransaction as any).items"
                    :key="item.id"
                    class="flex justify-between items-center text-xs"
                  >
                    <span class="text-blue-700 truncate mr-2">{{ item.product_name }}</span>
                    <span class="text-blue-800 font-bold shrink-0">+{{ item.quantity }} {{ item.product_sku || 'pcs' }}</span>
                  </div>
                </div>
                <p v-else class="text-xs text-blue-600 italic">
                  {{ (selectedTransaction as any).items?.length || 0 }} item akan dikembalikan
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="showDeleteModal = false"
              :disabled="deleteLoading"
              class="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
            >
              BATAL
            </button>
            <button
              @click="handleDelete"
              :disabled="deleteLoading"
              class="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UIcon v-if="deleteLoading" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
              <UIcon v-else name="i-heroicons-trash" class="w-5 h-5" />
              {{ deleteLoading ? 'MENGHAPUS...' : 'HAPUS' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Add Expense (Custom HTML to match Product Modal & fix Date bug) -->
    <div
      v-if="showAddExpenseModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
      @click.self="showAddExpenseModal = false"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 transform transition-all scale-100"
      >
        <!-- Header -->
        <div
          class="p-6 border-b border-gray-100 bg-gray-50 rounded-t-2xl flex justify-between items-center"
        >
          <h2 class="text-xl font-bold text-gray-900">Catat Pengeluaran</h2>
          <button
            @click="showAddExpenseModal = false"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <form @submit.prevent="submitExpense" id="expenseForm">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Tanggal</label>
                <input
                  v-model="expenseForm.date"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                <select
                  v-model="expenseForm.category"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow bg-white"
                >
                  <option v-for="cat in expenseCategories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Jumlah (Rp)</label>
                <input
                  v-model="expenseForm.amount"
                  type="number"
                  min="0"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow"
                  placeholder="Contoh: 50000"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Keterangan</label>
                <textarea
                  v-model="expenseForm.note"
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow"
                  placeholder="Contoh: Beli kertas struk 5 roll"
                ></textarea>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            @click="showAddExpenseModal = false"
            class="flex-1 py-3 bg-gray-200 border border-gray-300 rounded-xl font-bold hover:bg-gray-300 transition-colors text-gray-700"
          >
            BATAL
          </button>
          <button
            type="submit"
            form="expenseForm"
            class="flex-1 py-3 bg-rose-600 text-white border border-rose-700 rounded-xl font-bold hover:bg-rose-700 transition-colors flex justify-center items-center gap-2"
            :disabled="submitExpenseLoading"
          >
            <UIcon v-if="submitExpenseLoading" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
            {{ submitExpenseLoading ? 'MENYIMPAN...' : 'SIMPAN PENGELUARAN' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Chart toggle transition */
.chart-toggle-enter-active,
.chart-toggle-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.chart-toggle-enter-from,
.chart-toggle-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}
.chart-toggle-enter-to,
.chart-toggle-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

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
