<script setup lang="ts">
const mobileMenuOpen = ref(false)

function toggleMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMenu() {
  mobileMenuOpen.value = false
}

const instagramDmUrl = 'https://ig.me/m/kasir.ok'
</script>

<template>
  <div class="landing-root">
    <!-- Navbar -->
    <header class="landing-nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <img src="/images/logo-kasirok.png" alt="Logo" class="nav-logo">
          <span class="nav-brand-text">KasirOK</span>
        </div>

        <!-- Desktop nav -->
        <nav class="nav-links">
          <a href="#features" class="nav-link">Fitur</a>
          <a href="#pricing" class="nav-link">Harga</a>
        </nav>

        <div class="nav-actions">
          <NuxtLink to="/auth/login" class="nav-login">Masuk</NuxtLink>
          <a :href="instagramDmUrl" target="_blank" rel="noopener" class="nav-register">
            DM Instagram
          </a>
        </div>

        <!-- Mobile hamburger -->
        <button class="nav-hamburger" @click="toggleMenu" aria-label="Menu">
          <span :class="['hamburger-line', { open: mobileMenuOpen }]" />
          <span :class="['hamburger-line', { open: mobileMenuOpen }]" />
          <span :class="['hamburger-line', { open: mobileMenuOpen }]" />
        </button>
      </div>

      <!-- Mobile menu -->
      <Transition name="slide-menu">
        <div v-if="mobileMenuOpen" class="mobile-menu">
          <a href="#features" class="mobile-link" @click="closeMenu">Fitur</a>
          <a href="#pricing" class="mobile-link" @click="closeMenu">Harga</a>
          <div class="mobile-actions">
            <NuxtLink to="/auth/login" class="mobile-login" @click="closeMenu">Masuk</NuxtLink>
            <a
              :href="instagramDmUrl"
              target="_blank"
              rel="noopener"
              class="mobile-register"
              @click="closeMenu"
            >
              DM Instagram
            </a>
          </div>
        </div>
      </Transition>
    </header>

    <main class="landing-main">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img src="/images/logo-kasirok.png" alt="Logo" class="footer-logo">
          <span class="footer-brand-text">KasirOK</span>
        </div>

        <div class="footer-social">
          <a
            href="https://instagram.com/kasir.ok"
            target="_blank"
            class="social-link"
          >
            <div class="social-icon-wrap">
              <UIcon name="i-simple-icons-instagram" class="w-5 h-5" />
            </div>
            <span>@kasir.ok</span>
          </a>
        </div>

        <p class="footer-copy">
          &copy; {{ new Date().getFullYear() }} KasirOK. All rights reserved.
        </p>
      </div>
    </footer>

    <UNotifications />
  </div>
</template>

<style scoped>
/* ========================================
   LANDING LAYOUT — Clean & Centered
   ======================================== */
.landing-root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1f2937;
  background: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---------- Navbar ---------- */
.landing-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid #f3f4f6;
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.nav-logo {
  width: 36px;
  height: 36px;
}

.nav-brand-text {
  font-size: 1.15rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.01em;
}

.nav-links {
  display: none;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: #6d28d9;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.nav-link:hover {
  color: #6d28d9;
}

.nav-link:hover::after {
  width: 100%;
}

.nav-actions {
  display: none;
  align-items: center;
  gap: 1rem;
}

.nav-login {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-login:hover {
  color: #6d28d9;
}

.nav-register {
  background: #6d28d9;
  color: #fff;
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(109, 40, 217, 0.22);
  transition: all 0.3s;
}

.nav-register:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(109, 40, 217, 0.3);
}

/* Hamburger */
.nav-hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.hamburger-line {
  display: block;
  width: 22px;
  height: 2px;
  background: #374151;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger-line.open:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger-line.open:nth-child(2) {
  opacity: 0;
}

.hamburger-line.open:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* Mobile menu */
.mobile-menu {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mobile-link {
  display: block;
  padding: 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  text-decoration: none;
  border-bottom: 1px solid #f9fafb;
  transition: color 0.2s;
}

.mobile-link:hover {
  color: #6d28d9;
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.mobile-login {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  background: #f9fafb;
  border-radius: 0.75rem;
  text-decoration: none;
  border: 1px solid #e5e7eb;
}

.mobile-register {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  background: #6d28d9;
  border-radius: 0.75rem;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(109, 40, 217, 0.22);
}

/* Menu animation */
.slide-menu-enter-active,
.slide-menu-leave-active {
  transition: all 0.3s ease;
}

.slide-menu-enter-from,
.slide-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ---------- Main ---------- */
.landing-main {
  flex: 1;
}

/* ---------- Footer ---------- */
.landing-footer {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 2.5rem 0;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-logo {
  width: 36px;
  height: 36px;
}

.footer-brand-text {
  font-weight: 800;
  font-size: 1rem;
  color: #111827;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.2s;
}

.social-link:hover {
  color: #e1306c;
}

.social-icon-wrap {
  width: 32px;
  height: 32px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.social-link:hover .social-icon-wrap {
  border-color: #fbcfe8;
  background: #fdf2f8;
}

.footer-copy {
  font-size: 0.8rem;
  color: #9ca3af;
}

/* ========================================
   Responsive
   ======================================== */
@media (min-width: 768px) {
  .nav-inner {
    height: 72px;
  }

  .nav-links {
    display: flex;
  }

  .nav-actions {
    display: flex;
  }

  .nav-hamburger {
    display: none;
  }

  .footer-inner {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}
</style>
