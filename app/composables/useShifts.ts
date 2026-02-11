export const useShifts = () => {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();
    const { store, fetchStore } = useStore();
    const { isDummyMode } = useDummyMode();

    const activeShift = useState<any>('active_shift', () => null);
    const shiftsHistory = useState<any[]>('shifts_history', () => []);
    const loading = useState<boolean>('shift_loading', () => false);
    const error = useState<string | null>('shift_error', () => null);

    const fetchActiveShift = async () => {
        if (process.server) return null;

        // --- DUMMY MODE SUPPORT ---
        if (isDummyMode.value) {
            if (!activeShift.value) {
                activeShift.value = {
                    id: 'dummy-shift',
                    store_id: 'dummy-store',
                    user_id: 'dummy-user',
                    start_time: new Date().toISOString(),
                    opening_balance: 100000,
                    status: 'open'
                };
            }
            return activeShift.value;
        }

        // Ensure user is ready or fetch it
        let currentUser = user.value as any;
        if (!currentUser) {
            const { data: { session } } = await supabase.auth.getSession();
            currentUser = session?.user;
        }

        if (!currentUser?.id) {
            console.log('DEBUG - fetchActiveShift: No user session found.');
            return null;
        }

        let currentStoreId = store.value?.id;
        if (!currentStoreId) {
            const s = await fetchStore(currentUser.id);
            currentStoreId = s?.id;
        }

        if (!currentStoreId) return null;

        loading.value = true;
        try {
            const { data, error: fetchError } = await (supabase as any)
                .from('shifts')
                .select('*')
                .eq('store_id', currentStoreId)
                .eq('user_id', currentUser.id)
                .eq('status', 'open')
                .maybeSingle();

            if (fetchError) {
                console.warn('Shift check failed:', fetchError.message);
                return null;
            }
            activeShift.value = data;
            return data;
        } catch (err: any) {
            console.error('Error fetching active shift:', err.message);
            return null;
        } finally {
            loading.value = false;
        }
    };

    const openShift = async (openingBalance: number) => {
        if (process.server) return;
        error.value = null;

        // --- DUMMY MODE SUPPORT ---
        if (isDummyMode.value) {
            activeShift.value = {
                id: 'dummy-shift-' + Date.now(),
                store_id: 'dummy-store',
                user_id: 'dummy-user',
                start_time: new Date().toISOString(),
                opening_balance: openingBalance,
                status: 'open'
            };
            return activeShift.value;
        }

        // Check for user session with maximum reliability
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        let currentUser = session?.user || user.value as any;

        console.log('DEBUG - useShifts: Starting openShift.', {
            sessionId: session?.user?.id,
            reactiveUserId: user.value?.id,
            sessionError: sessionError?.message,
            storeId: store.value?.id
        });

        if (!currentUser) {
            throw new Error(`Sesi login tidak terdeteksi. (Debug: S:${session?.user?.id || 'null'}, R:${user.value?.id || 'null'}, E:${sessionError?.message || 'none'}). Silakan coba refresh halaman (F5).`);
        }

        let currentStoreId = store.value?.id;
        if (!currentStoreId) {
            const s = await fetchStore();
            currentStoreId = s?.id;
        }

        if (!currentStoreId) {
            throw new Error('Data toko belum ditemukan. Pastikan Anda sudah mengatur toko di Dashboard.');
        }

        loading.value = true;
        try {
            const { data, error: insertError } = await (supabase as any)
                .from('shifts')
                .insert({
                    store_id: currentStoreId,
                    user_id: currentUser.id,
                    start_time: new Date().toISOString(),
                    opening_balance: openingBalance,
                    status: 'open'
                })
                .select()
                .single();

            if (insertError) {
                if (insertError.code === '42P01') {
                    throw new Error('Tabel "shifts" belum ditemukan. Harap pastikan tabel sudah dibuat di database.');
                }
                throw insertError;
            }
            activeShift.value = data;
            return data;
        } catch (err: any) {
            const msg = err.message || err.details || 'Gagal membuka kasir';
            error.value = msg;
            console.error('Open shift error:', err);
            throw new Error(msg);
        } finally {
            loading.value = false;
        }
    };

    const calculateExpectedBalance = async (shift: any) => {
        if (!shift || !store.value || !user.value) return 0;

        const startTime = shift.start_time;
        const endTime = new Date().toISOString();

        // Fetch transactions cash total during shift
        const { data: txs } = await (supabase as any)
            .from('transactions')
            .select('total')
            .eq('store_id', store.value.id)
            .eq('payment_method', 'cash')
            .gte('created_at', startTime)
            .lte('created_at', endTime);

        // Fetch expenses total during shift
        const { data: exps } = await (supabase as any)
            .from('expenses')
            .select('amount')
            .eq('store_id', store.value.id)
            .gte('created_at', startTime)
            .lte('created_at', endTime);

        const totalCashSales = (txs || []).reduce((sum: number, t: any) => sum + (t.total || 0), 0);
        const totalExpenses = (exps || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

        return (shift.opening_balance || 0) + totalCashSales - totalExpenses;
    };

    const closeShift = async (actualBalance: number, notes: string = '') => {
        if (!activeShift.value) throw new Error('Tidak ada shift aktif');

        loading.value = true;
        try {
            if (isDummyMode.value) {
                activeShift.value = null;
                return { success: true };
            }

            const expectedBalance = await calculateExpectedBalance(activeShift.value);

            const { data, error: updateError } = await (supabase as any)
                .from('shifts')
                .update({
                    end_time: new Date().toISOString(),
                    closing_balance_actual: actualBalance,
                    closing_balance_expected: expectedBalance,
                    status: 'closed',
                    notes: notes
                })
                .eq('id', activeShift.value.id)
                .select()
                .single();

            if (updateError) throw updateError;
            activeShift.value = null;
            return data;
        } catch (err: any) {
            error.value = err.message || 'Gagal menutup kasir';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const fetchAllShifts = async (filters?: { startDate?: string, endDate?: string }) => {
        if (process.server) return [];

        if (isDummyMode.value) {
            shiftsHistory.value = [
                {
                    id: 'dummy-1',
                    start_time: new Date(Date.now() - 86400000).toISOString(),
                    end_time: new Date(Date.now() - 82800000).toISOString(),
                    opening_balance: 100000,
                    closing_balance_actual: 250000,
                    closing_balance_expected: 250000,
                    status: 'closed',
                    notes: 'Semua lancar'
                }
            ];
            return shiftsHistory.value;
        }

        let currentStoreId = store.value?.id;
        if (!currentStoreId) {
            const s = await fetchStore();
            currentStoreId = s?.id;
        }
        if (!currentStoreId) return [];

        loading.value = true;
        try {
            let query = (supabase as any)
                .from('shifts')
                .select('*, user:user_id(email)')
                .eq('store_id', currentStoreId)
                .order('start_time', { ascending: false });

            if (filters?.startDate) {
                query = query.gte('start_time', filters.startDate + 'T00:00:00');
            }
            if (filters?.endDate) {
                query = query.lte('start_time', filters.endDate + 'T23:59:59');
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            shiftsHistory.value = data || [];
            return shiftsHistory.value;
        } catch (err: any) {
            console.error('Error fetching shift history:', err);
            return [];
        } finally {
            loading.value = false;
        }
    };

    return {
        activeShift,
        shiftsHistory,
        loading,
        error,
        fetchActiveShift,
        fetchAllShifts,
        openShift,
        closeShift,
        calculateExpectedBalance
    };
};
