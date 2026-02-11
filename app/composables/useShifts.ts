export const useShifts = () => {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();
    const { store, fetchStore } = useStore();
    const { isDummyMode } = useDummyMode();

    const activeShift = useState<any>('active_shift', () => null);
    const shiftsHistory = useState<any[]>('shifts_history', () => []);
    const loading = useState<boolean>('shift_loading', () => false);
    const error = useState<string | null>('shift_error', () => null);

    // --- SECURITY: Sinkronisasi Otomatis Sesuai Sesi User ---
    if (process.client) {
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                activeShift.value = null;
                shiftsHistory.value = [];
                console.log('DEBUG - useShifts: Sesi berakhir, membersihkan data shift.');
            } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                // Jangan paksa null di sini agar tidak flicker, tapi fetch ulang nanti
            }
        });
    }

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

        // Ensure user is ready (High Persistence for Refresh)
        let currentUser = user.value as any;
        let authRetries = 0;

        // Jika user null, coba getSession, jika masih null, tunggu sebentar (untuk refresh)
        while (!currentUser?.id && authRetries < 10) {
            const { data: { session } } = await supabase.auth.getSession();
            currentUser = session?.user;

            if (!currentUser?.id) {
                console.log(`DEBUG - fetchActiveShift: Waiting for Auth... (${authRetries + 1}/10)`);
                await new Promise(resolve => setTimeout(resolve, 300));
                authRetries++;
            }
        }

        if (!currentUser?.id) {
            console.error('DEBUG - fetchActiveShift: AUTH GAGAL - Sesi tidak ditemukan setelah 3 detik.');
            return null;
        }

        // Tunggu Store Ready
        let currentStoreId = store.value?.id;
        let storeRetries = 0;
        while (!currentStoreId && storeRetries < 5) {
            const s = await fetchStore(currentUser.id);
            currentStoreId = s?.id;
            if (!currentStoreId) {
                console.log(`DEBUG - fetchActiveShift: Waiting for Store... (${storeRetries + 1}/5)`);
                await new Promise(resolve => setTimeout(resolve, 500));
                storeRetries++;
            }
        }

        if (!currentStoreId) {
            console.error('DEBUG - fetchActiveShift: STORE GAGAL - ID Toko tidak ditemukan.');
            return null;
        }

        loading.value = true;
        try {
            // --- DIAGNOSTIK: Cek apakah RLS memblokir kita ---
            const { data: allData, error: diagError } = await (supabase as any).from('shifts').select('id, status');
            console.log('DIAGNOSTIC - fetchActiveShift: Bisa melihat total baris:', allData?.length || 0, 'Error:', diagError?.message);

            console.log('DEBUG - fetchActiveShift: Strict Isolation Check', {
                store_id: currentStoreId,
                user_id: currentUser.id
            });

            // WAJIB: Filter berdasarkan store_id DAN user_id DAN status open
            let { data, error: fetchError } = await (supabase as any)
                .from('shifts')
                .select('*')
                .eq('store_id', currentStoreId)
                .eq('user_id', currentUser.id)
                .eq('status', 'open')
                .order('start_time', { ascending: false })
                .limit(1);

            if (fetchError) {
                console.error('DEBUG - fetchActiveShift: Select Error:', fetchError);
                return null;
            }

            // Bukannya maybeSingle, kita ambil array index 0 agar lebih robust
            let activeData = data && data.length > 0 ? data[0] : null;

            // Jika gagal tapi kita tahu ada data (lewat diagnostik), lapor
            if (!activeData && allData && allData.some((s: any) => s.status === 'open')) {
                console.error('⚠️ KRITIS: Database punya shift OPEN, tapi pencarian filter gagal. Ini kemungkinan besar masalah RLS di Supabase!');
            }

            console.log('DEBUG - fetchActiveShift: Final Match ->', activeData ? `FOUND (${activeData.id})` : 'NOT FOUND');
            activeShift.value = activeData;
            return activeData;
        } catch (err: any) {
            console.error('DEBUG - fetchActiveShift: Exception:', err.message);
            return null;
        } finally {
            loading.value = false;
        }
    };

    const openShift = async (openingBalance: number, initialNotes: string = '') => {
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
                status: 'open',
                notes: initialNotes
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
            const payload = {
                store_id: currentStoreId,
                user_id: currentUser.id,
                start_time: new Date().toISOString(),
                opening_balance: openingBalance,
                status: 'open',
                notes: initialNotes
            };

            const { data, error: insertError } = await (supabase as any)
                .from('shifts')
                .insert(payload)
                .select()
                .maybeSingle();

            if (insertError) {
                // If shift already exists (duplicate key), try to recover it
                if (insertError.code === '23505') {
                    console.log('DEBUG - openShift: Shift already exists, recovering state...');
                    const existing = await fetchActiveShift();
                    if (existing) return existing;
                    throw new Error('Shift sudah terbuka di sistem namun gagal disinkronkan. Silakan refresh (F5).');
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

    const updateShift = async (shiftId: string, data: { opening_balance?: number, notes?: string }) => {
        if (isDummyMode.value) {
            if (activeShift.value) {
                activeShift.value = { ...activeShift.value, ...data };
            }
            return activeShift.value;
        }

        loading.value = true;
        try {
            const { data: updatedData, error: updateError } = await (supabase as any)
                .from('shifts')
                .update(data)
                .eq('id', shiftId)
                .select()
                .single();

            if (updateError) throw updateError;
            activeShift.value = updatedData;
            return updatedData;
        } catch (err: any) {
            error.value = err.message || 'Gagal update shift';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const fetchAllShifts = async (filters?: { startDate?: string, endDate?: string }) => {
        if (process.server) return [];

        // Ensure user is ready (Persistent for Refresh/Direct URL)
        let currentUser = user.value as any;
        let authRetries = 0;
        while (!currentUser?.id && authRetries < 5) {
            const { data: { session } } = await supabase.auth.getSession();
            currentUser = session?.user;
            if (!currentUser?.id) {
                await new Promise(resolve => setTimeout(resolve, 300));
                authRetries++;
            }
        }

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

        if (!currentUser?.id) return [];

        let currentStoreId = store.value?.id;
        let storeRetries = 0;
        while (!currentStoreId && storeRetries < 5) {
            const s = await fetchStore(currentUser.id);
            currentStoreId = s?.id;
            if (!currentStoreId) {
                await new Promise(resolve => setTimeout(resolve, 500));
                storeRetries++;
            }
        }

        if (!currentStoreId) return [];

        loading.value = true;
        try {
            console.log('DEBUG - fetchAllShifts: Starting fetch for store:', currentStoreId);
            let query = (supabase as any)
                .from('shifts')
                .select('*')
                .eq('store_id', currentStoreId)
                .order('start_time', { ascending: false });

            if (filters?.startDate) {
                query = query.gte('start_time', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('start_time', filters.endDate + ' 23:59:59');
            }

            const { data, error: fetchError } = await query;
            if (fetchError) {
                console.error('DEBUG - fetchAllShifts: DB Error:', fetchError);
                throw fetchError;
            }

            console.log('DEBUG - fetchAllShifts: Successfully found', data?.length, 'shifts');
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
        updateShift,
        closeShift,
        calculateExpectedBalance
    };
};
