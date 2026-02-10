
export const useExpenses = () => {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();
    const { store } = useStore();

    const loading = ref(false);
    const error = ref<string | null>(null);
    const expenses = ref<any[]>([]);

    // Fetch expenses with optional filters
    const fetchExpenses = async (params: { startDate?: string; endDate?: string } = {}) => {
        loading.value = true;
        error.value = null;

        try {
            if (!store.value?.id) return;

            let query = supabase
                .from("expenses")
                .select("*")
                .eq("store_id", store.value.id)
                .order("date", { ascending: false });

            if (params.startDate) {
                query = query.gte("date", params.startDate);
            }

            if (params.endDate) {
                query = query.lte("date", params.endDate);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            expenses.value = data || [];
        } catch (err: any) {
            error.value = err.message || "Gagal mengambil data pengeluaran";
        } finally {
            loading.value = false;
        }
    };

    // Add Expenses
    const addExpense = async (payload: {
        category: string;
        amount: number;
        date: string;
        note?: string;
    }) => {
        loading.value = true;
        error.value = null;

        try {
            if (!store.value?.id) throw new Error("Toko tidak ditemukan");

            const { data, error: insertError } = await supabase.from("expenses").insert({
                store_id: store.value.id,
                category: payload.category,
                amount: payload.amount,
                date: payload.date,
                note: payload.note,
            }).select().single();

            if (insertError) throw insertError;

            expenses.value.unshift(data);
            return data;
        } catch (err: any) {
            error.value = err.message || "Gagal menambahkan pengeluaran";
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Delete Expense
    const deleteExpense = async (id: string) => {
        loading.value = true;
        try {
            const { error: deleteError } = await supabase
                .from("expenses")
                .delete()
                .eq("id", id);

            if (deleteError) throw deleteError;

            expenses.value = expenses.value.filter((e) => e.id !== id);
        } catch (err: any) {
            error.value = err.message || "Gagal menghapus pengeluaran";
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        expenses,
        loading,
        error,
        fetchExpenses,
        addExpense,
        deleteExpense,
    };
};
