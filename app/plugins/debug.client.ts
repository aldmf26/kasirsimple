export default defineNuxtPlugin(async (nuxtApp) => {
  // Plugin untuk debug dan monitoring app state
  
  if (process.client) {
    // Store debug info di window object untuk mudah diakses dari console
    const debugInfo = {
      async checkStatus() {
        const { store } = useStore()
        const { products } = useProducts()
        const { categories } = useCategories()
        const user = useSupabaseUser()
        
        console.group('📊 APP STATUS CHECK')
        console.log('👤 User:', user.value?.email, '|', user.value?.id)
        console.log('🏪 Store:', store.value?.name, '|', store.value?.id)
        console.log('📦 Products:', products.value?.length ?? 0)
        console.log('📂 Categories:', categories.value?.length ?? 0)
        console.groupEnd()
      },
      
      async reloadData() {
        console.log('🔄 Reloading all data...')
        const { fetchStore } = useStore()
        const { fetchProducts } = useProducts()
        const { fetchCategories } = useCategories()
        
        try {
          await Promise.all([
            fetchStore(),
            fetchCategories(),
            fetchProducts()
          ])
          console.log('✅ Data reloaded successfully')
          this.checkStatus()
        } catch (e: any) {
          console.error('❌ Error reloading:', e.message)
        }
      },

      async verifyAuth() {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase.auth.getSession()
        
        console.group('🔐 AUTH VERIFICATION')
        if (error) {
          console.error('❌ Error:', error.message)
        } else {
          console.log('✅ Session valid')
          console.log('User ID:', data.session?.user.id)
          console.log('Email:', data.session?.user.email)
        }
        console.groupEnd()
      },

      async verifySupabaseConnection() {
        const supabase = useSupabaseClient()
        try {
          const { data, error } = await supabase.from('stores').select('count', { count: 'exact' })
          console.group('🔌 SUPABASE CONNECTION')
          if (error) {
            console.error('❌ Error:', error.message)
          } else {
            console.log('✅ Connection OK')
            console.log('Stores in database:', data?.length ?? 0)
          }
          console.groupEnd()
        } catch (e: any) {
          console.error('❌ Connection failed:', e.message)
        }
      }
    }
    
    // Expose to window.debugInfo
    window.debugInfo = debugInfo
    
    console.log('🔧 Debug tools available! Use window.debugInfo.checkStatus(), window.debugInfo.reloadData(), etc')
  }
})
