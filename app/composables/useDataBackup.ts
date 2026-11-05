const BACKUP_VERSION = 1;
const BACKUP_KEY_PREFIX = "kasir_simple_last_backup_";
const ACTIVITY_STORAGE_KEY = "activity_logs";

const BACKUP_TABLES = [
  "categories",
  "products",
  "customers",
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

    // Paged + chunked: a single request stops at 1000 rows and a long .in() list
    // overflows the URL, which used to produce silently incomplete backups.
    const byParent = async (column: string, ids: string[]) => {
      const rows: any[] = [];
      for (const part of chunkArray(ids, 150)) {
        rows.push(...(await fetchAllRows((from, to) =>
          (supabase.from(table) as any).select("*").in(column, part).order("id").range(from, to),
        )));
      }
      return rows;
    };

    if (table === "transaction_items") return byParent("transaction_id", await getTransactionIds());
    if (table === "stock_movements") return byParent("product_id", await getProductIds());

    const storeId = store.value.id;
    return fetchAllRows((from, to) =>
      (supabase.from(table) as any).select("*").eq("store_id", storeId).order("id").range(from, to),
    );
  };

  const getTransactionIds = async () => {
    if (!store.value?.id) return [];
    const storeId = store.value.id;
    const rows = await fetchAllRows((from, to) =>
      (supabase.from("transactions") as any).select("id").eq("store_id", storeId).order("id").range(from, to),
    );
    return rows.map((row: any) => row.id);
  };

  const getProductIds = async () => {
    if (!store.value?.id) return [];
    const storeId = store.value.id;
    const rows = await fetchAllRows((from, to) =>
      (supabase.from("products") as any).select("id").eq("store_id", storeId).order("id").range(from, to),
    );
    return rows.map((row: any) => row.id);
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

      const { owner_pin_hash, owner_pin_salt, is_admin, ...safeStore } = store.value as any;

      const backup: StoreBackupFile = {
        app: "kasir-simple",
        version: BACKUP_VERSION,
        exported_at: new Date().toISOString(),
        store_id: store.value.id,
        store: safeStore,
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
      link.download = `backup-${safeName}-${localDateKey()}.json`;
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

  const deleteCurrentStoreData = async () => {
    if (!store.value?.id) throw new Error("Toko belum siap");

    const transactionIds = await getTransactionIds();
    const productIds = await getProductIds();

    for (const part of chunkArray(productIds, 150)) {
      const { error } = await (supabase.from("stock_movements") as any)
        .delete()
        .in("product_id", part);
      if (error) throw error;
    }

    for (const part of chunkArray(transactionIds, 150)) {
      const { error } = await (supabase.from("transaction_items") as any)
        .delete()
        .in("transaction_id", part);
      if (error) throw error;
    }

    for (const table of ["expenses", "shifts", "printer_settings", "transactions", "customers", "products", "categories"] as const) {
      const { error } = await (supabase.from(table) as any)
        .delete()
        .eq("store_id", store.value.id);
      if (error) throw error;
    }

    if (process.client) {
      const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const otherStores = Array.isArray(existing)
        ? existing.filter((log) => log.store_id !== store.value?.id)
        : [];
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(otherStores));
    }
  };

  // Upsert in chunks so a big backup does not exceed the request size limit.
  const upsertRows = async (table: BackupTable, rows: any[], options?: { onConflict: string }) => {
    for (const part of chunkArray(rows, 500)) {
      const { error } = await (supabase.from(table) as any).upsert(part, options);
      if (error) throw error;
    }
  };

  const importBackup = async () => {
    if (!store.value?.id) throw new Error("Toko belum siap");
    if (!importPreview.value) throw new Error("Pilih file backup dulu");

    // The import deletes current data before writing the file's rows and is not
    // one DB transaction. Download the current data first so a failure halfway
    // can be recovered by importing this safety copy.
    await downloadBackup();

    loading.value = true;
    try {
      const backup = importPreview.value;
      const s = backup.store;
      const storeUpdate: Record<string, any> = {
        name: s.name,
        business_type: s.business_type,
        timezone: s.timezone,
        address: s.address,
        phone: s.phone,
        currency: s.currency || "Rp",
        logo_url: s.logo_url,
        enabled_payment_methods: s.enabled_payment_methods,
        bank_accounts: s.bank_accounts,
        show_product_images: s.show_product_images !== false,
        discount_tax_settings: s.discount_tax_settings,
        weight_mode_enabled: s.weight_mode_enabled,
        barcode_enabled: s.barcode_enabled,
        customer_enabled: s.customer_enabled,
        customer_required: s.customer_required,
      };
      // Older backups lack some settings: keep the current value instead of nulling it.
      for (const key of Object.keys(storeUpdate)) {
        if (storeUpdate[key] === undefined) delete storeUpdate[key];
      }
      await updateStore(store.value.id, storeUpdate as any);
      await deleteCurrentStoreData();

      await upsertRows("categories", rowsForCurrentStore(backup.data.categories));
      await upsertRows("products", rowsForCurrentStore(backup.data.products));
      await upsertRows("customers", rowsForCurrentStore(backup.data.customers));
      // Backups made before the status column marked returns only in notes.
      await upsertRows(
        "transactions",
        rowsForCurrentStore(backup.data.transactions).map((t) => ({
          ...t,
          status: t.status || ((t.notes || "").startsWith("[RETUR]") ? "returned" : "completed"),
        })),
      );
      await upsertRows("transaction_items", backup.data.transaction_items || []);
      await upsertRows("stock_movements", backup.data.stock_movements || []);
      await upsertRows("expenses", rowsForCurrentStore(backup.data.expenses));
      await upsertRows("shifts", rowsForCurrentStore(backup.data.shifts));
      await upsertRows("printer_settings", rowsForCurrentStore(backup.data.printer_settings), { onConflict: "store_id" });

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

  const resetStoreData = async () => {
    if (!store.value?.id) throw new Error("Toko belum siap");
    loading.value = true;
    try {
      await deleteCurrentStoreData();
      await fetchStore();
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
    resetStoreData,
  };
};
