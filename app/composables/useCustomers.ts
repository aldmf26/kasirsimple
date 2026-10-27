import { ref } from 'vue'
import { useStore } from './useStore'
import type { Database } from '~/types/database'

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export const useCustomers = () => {
  const supabase = useSupabaseClient<Database>()
  const { store: currentStore } = useStore()
  
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  
  const fetchCustomers = async (activeOnly = true) => {
    if (!currentStore.value?.id) return
    
    loading.value = true
    try {
      let query = (supabase
        .from('customers') as any)
        .select('*')
        .eq('store_id', currentStore.value.id)
        .order('name')
      
      if (activeOnly) {
        query = query.eq('is_active', true)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      customers.value = (data as Customer[]) || []
    } catch (error) {
      console.error('Error fetching customers:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const createCustomer = async (customer: Omit<CustomerInsert, 'store_id'>) => {
    if (!currentStore.value?.id) throw new Error('No store selected')
    
    loading.value = true
    try {
      const { data, error } = await (supabase
        .from('customers') as any)
        .insert({
          ...customer,
          store_id: currentStore.value.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      await fetchCustomers()
      return data as Customer
    } catch (error) {
      console.error('Error creating customer:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const updateCustomer = async (id: string, updates: CustomerUpdate) => {
    loading.value = true
    try {
      const { data, error } = await (supabase
        .from('customers') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      await fetchCustomers()
      return data as Customer
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const deleteCustomer = async (id: string) => {
    loading.value = true
    try {
      const { error } = await (supabase
        .from('customers') as any)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      await fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const searchCustomers = (query: string) => {
    if (!query) return customers.value
    const q = query.toLowerCase()
    return customers.value.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.toLowerCase().includes(q))
    )
  }
  
  return {
    customers,
    loading,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers
  }
}
