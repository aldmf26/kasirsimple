export default defineNuxtRouteMiddleware((to) => {
    const user = useSupabaseUser()
    const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/forgot-password']

    // If user is NOT logged in and tries to access private routes
    if (!user.value && !publicRoutes.includes(to.path)) {
        // Only redirect if it's an app route (dashboard, pos, etc)
        const appRoutes = ['/dashboard', '/pos', '/products', '/reports', '/settings']
        if (appRoutes.some(route => to.path.startsWith(route))) {
            return navigateTo('/auth/login')
        }
    }

    // If user IS logged in and tries to access login/register
    if (user.value && (to.path === '/auth/login' || to.path === '/auth/register')) {
        return navigateTo('/dashboard')
    }

    // Ensure store is loaded if authenticated
    if (user.value) {
        const { store, fetchStore } = useStore()
        if (!store.value) {
            fetchStore()
        }
    }
})
