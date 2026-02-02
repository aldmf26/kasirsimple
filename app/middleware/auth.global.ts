export default defineNuxtRouteMiddleware(async (to) => {
    const user = useSupabaseUser()
    const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/forgot-password']

    console.log('🔐 Auth middleware:', { path: to.path, user: user.value?.id });

    // If user is NOT logged in and tries to access private routes
    if (!user.value && !publicRoutes.includes(to.path)) {
        // Only redirect if it's an app route (dashboard, pos, etc)
        const appRoutes = ['/dashboard', '/pos', '/products', '/reports', '/settings']
        if (appRoutes.some(route => to.path.startsWith(route))) {
            console.log('🔐 No user, redirecting to login');
            return navigateTo('/auth/login')
        }
    }

    // If user IS logged in and tries to access login/register
    if (user.value && (to.path === '/auth/login' || to.path === '/auth/register')) {
        console.log('🔐 User logged in, redirecting to dashboard');
        return navigateTo('/dashboard')
    }
})
