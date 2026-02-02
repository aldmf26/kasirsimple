export default defineNuxtRouteMiddleware(async (to) => {
    // Skip middleware on server-side to avoid hydration mismatch
    if (process.server) {
        return
    }

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
})
