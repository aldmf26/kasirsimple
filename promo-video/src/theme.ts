import { loadFont as loadJakarta } from '@remotion/google-fonts/PlusJakartaSans'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadKalam } from '@remotion/google-fonts/Kalam'

// Display = Plus Jakarta Sans, UI mockup = Inter (font produk), bon kertas = Kalam
export const fonts = {
  display: loadJakarta('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin'] }).fontFamily,
  ui: loadInter('normal', { weights: ['400', '500', '600', '700', '800', '900'], subsets: ['latin'] }).fontFamily,
  hand: loadKalam('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily
}

export const colors = {
  // sampel piksel public/images/logo-kasirok.png
  logoBlue: '#0E7EFE',
  logoDeep: '#014CCC',
  logoYellow: '#F0C624',
  // token UI app (Tailwind/Nuxt UI)
  primary600: '#2563EB',
  primary700: '#1D4ED8',
  primary50: '#EFF6FF',
  primary100: '#DBEAFE',
  primary200: '#BFDBFE',
  slate50: '#F8FAFC',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray800: '#1F2937',
  ink: '#0F172A',
  emerald500: '#10B981',
  emerald50: '#ECFDF5',
  emerald700: '#047857',
  green600: '#16A34A',
  red600: '#DC2626',
  // turunan: kertas catatan untuk babak masalah
  paper: '#F3EEE4',
  paperInk: '#3B3A36',
  whatsapp: '#25D366'
}
