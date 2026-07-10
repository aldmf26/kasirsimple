const BACKUP_VERSION = 1;
const BACKUP_KEY_PREFIX = "kasir_simple_last_backup_";
const ACTIVITY_STORAGE_KEY = "activity_logs";

const BACKUP_TABLES = [
  "categories",
  "products",
  "transactions",
  "transaction_items",
  "stock_movements",
  "expenses",
  "shifts",
  "printer_settings",
] as const;

type BackupTable = (typeof BACKUP_TABLES)[number];

export interface StoreBackupFile {
  app: "kasir-simple";
  version: number;
  exported_at: string;
  store_id: string;
  store: Record<string, any>;
  data: Partial<Record<BackupTable, any[]>>;
  local_activity_logs: any[];
}

export const useDataBackup = () => {
  const supabase = useSupabaseClient();
  const { store, updateStore, fetchStore } = useStore();
  const loading = ref(false);
  const importPreview = ref<StoreBackupFile | null>(null);

  const lastBackupKey = computed(() =>
    store.value?.id ? `${BACKUP_KEY_PREFIX}${store.value.id}` : "",
  );

  const lastBackupAt = ref<string | null>(null);

  const loadLastBackupAt = () => {
    if (!process.client || !lastBackupKey.value) return;
    lastBackupAt.value = localStorage.getItem(lastBackupKey.value);
  };

  const markBackedUp = () => {
    if (!process.client || !lastBackupKey.value) return;
    const now = new Date().toISOString();
    localStorage.setItem(lastBackupKey.value, now);
    lastBackupAt.value = now;
  };

  const needsBackup = computed(() => {
    if (!lastBackupAt.value) return true;
    const last = new Date(lastBackupAt.value).getTime();
    return Number.isNaN(last) || Date.now() - last > 7 * 24 * 60 * 60 * 1000;
  });

  const backupAgeText = computed(() => {
    if (!lastBackupAt.value) return "Belum pernah backup di perangkat ini";
    const diffDays = Math.floor(
      (Date.now() - new Date(lastBackupAt.value).getTime()) /
        (24 * 60 * 60 * 1000),
    );
    if (diffDays <= 0) return "Backup terakhir hari ini";
    return `Backup terakhir ${diffDays} hari lalu`;
  });

  const fetchTable = async (table: BackupTable) => {
    if (!store.value?.id) return [];

    let query = (supabase.from(table) as any).select("*");

    if (table === "transaction_items") {
      const transactionIds = await getTransactionIds();
      if (!transactionIds.length) return [];
      const { data, error } = await query.in("transaction_id", transactionIds);
      if (error) throw error;
      return data || [];
    }

    if (table === "stock_movements") {
      const productIds = await getProductIds();
      if (!productIds.length) return [];
      const { data, error } = await query.in("product_id", productIds);
      if (error) throw error;
      return data || [];
    }

    const { data, error } = await query.eq("store_id", store.value.id);
    if (error) throw error;
    return data || [];
  };

  const getTransactionIds = async () => {
    if (!store.value?.id) return [];
    const { data, error } = await (supabase.from("transactions") as any)
      .select("id")
      .eq("store_id", store.value.id);
    if (error) throw error;
    return (data || []).map((row: any) => row.id);
  };

  const getProductIds = async () => {
    if (!store.value?.id) return [];
    const { data, error } = await (supabase.from("products") as any)
      .select("id")
      .eq("store_id", store.value.id);
    if (error) throw error;
    return (data || []).map((row: any) => row.id);
  };

  const getLocalActivityLogs = () => {
    if (!process.client || !store.value?.id) return [];
    try {
      const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      const logs = raw ? JSON.parse(raw) : [];
      return Array.isArray(logs)
        ? logs.filter((log) => log.store_id === store.value?.id)
        : [];
    } catch {
      return [];
    }
  };

  const downloadBackup = async () => {
    if (!store.value?.id) throw new Error("Toko belum siap");
    loading.value = true;
    try {
      const data: StoreBackupFile["data"] = {};
      for (const table of BACKUP_TABLES) {
        data[table] = await fetchTable(table);
      }

      const backup: StoreBackupFile = {
        app: "kasir-simple",
        version: BACKUP_VERSION,
        exported_at: new Date().toISOString(),
        store_id: store.value.id,
        store: store.value as any,
        data,
        local_activity_logs: getLocalActivityLogs(),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = (store.value.name || "toko")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      link.href = url;
      link.download = `backup-${safeName}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      markBackedUp();
      return backup;
    } finally {
      loading.value = false;
    }
  };

  const readBackupFile = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as StoreBackupFile;
    if (parsed.app !== "kasir-simple" || !parsed.data || !parsed.store) {
      throw new Error("File backup tidak valid");
    }
    importPreview.value = parsed;
    return parsed;
  };

  const rowsForCurrentStore = (rows: any[] = []) => {
    if (!store.value?.id) return [];
    return rows.map((row) => ({ ...row, store_id: store.value!.id }));
  };

  const importBackup = async () => {
    if (!store.value?.id) throw new Error("Toko belum siap");
    if (!importPreview.value) throw new Error("Pilih file backup dulu");
    loading.value = true;

    try {
      const backup = importPreview.value;
      const storeUpdate = {
        name: backup.store.name,
        business_type: backup.store.business_type,
        address: backup.store.address,
        phone: backup.store.phone,
        currency: backup.store.currency || "Rp",
        logo_url: backup.store.logo_url,
        enabled_payment_methods: backup.store.enabled_payment_methods,
        bank_accounts: backup.store.bank_accounts,
        show_product_images: backup.store.show_product_images !== false,
        discount_tax_settings: backup.store.discount_tax_settings,
      };
      await updateStore(store.value.id, storeUpdate as any);

      const categories = rowsForCurrentStore(backup.data.categories);
      if (categories.length) {
        const { error } = await (supabase.from("categories") as any).upsert(
          categories,
        );
        if (error) throw error;
      }

      const products = rowsForCurrentStore(backup.data.products);
      if (products.length) {
        const { error } = await (supabase.from("products") as any).upsert(
          products,
        );
        if (error) throw error;
      }

      const transactions = rowsForCurrentStore(backup.data.transactions);
      if (transactions.length) {
        const { error } = await (supabase.from("transactions") as any).upsert(
          transactions,
        );
        if (error) throw error;
      }

      const transactionItems = backup.data.transaction_items || [];
      if (transactionItems.length) {
        const { error } = await (supabase.from("transaction_items") as any).upsert(
          transactionItems,
        );
        if (error) throw error;
      }

      const stockMovements = backup.data.stock_movements || [];
      if (stockMovements.length) {
        const { error } = await (supabase.from("stock_movements") as any).upsert(
          stockMovements,
        );
        if (error) throw error;
      }

      const expenses = rowsForCurrentStore(backup.data.expenses);
      if (expenses.length) {
        const { error } = await (supabase.from("expenses") as any).upsert(
          expenses,
        );
        if (error) throw error;
      }

      const shifts = rowsForCurrentStore(backup.data.shifts);
      if (shifts.length) {
        const { error } = await (supabase.from("shifts") as any).upsert(shifts);
        if (error) throw error;
      }

      const printerSettings = rowsForCurrentStore(backup.data.printer_settings);
      if (printerSettings.length) {
        const { error } = await (
          supabase.from("printer_settings") as any
        ).upsert(printerSettings, { onConflict: "store_id" });
        if (error) throw error;
      }

      if (process.client && backup.local_activity_logs?.length) {
        const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        const otherStores = Array.isArray(existing)
          ? existing.filter((log) => log.store_id !== store.value?.id)
          : [];
        localStorage.setItem(
          ACTIVITY_STORAGE_KEY,
          JSON.stringify([...backup.local_activity_logs, ...otherStores]),
        );
      }

      markBackedUp();
      await fetchStore();
      importPreview.value = null;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    importPreview,
    lastBackupAt,
    needsBackup,
    backupAgeText,
    loadLastBackupAt,
    downloadBackup,
    readBackupFile,
    importBackup,
  };
};
