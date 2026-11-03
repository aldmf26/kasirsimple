export const FPS = 30
export const WIDTH = 1920
export const HEIGHT = 1080
export const TOTAL_FRAMES = 600 // tepat 20 detik

// Batas babak (frame global). Babak sengaja beririsan: transisi dibawa benda, bukan cut.
export const HOOK = { from: 0, to: 110 }
export const REVEAL = { from: 84, to: 216 }
export const EXPERIENCE = { from: 188, to: 446 }
export const VALUE = { from: 398, to: 540 }
export const ENDING = { from: 508, to: 600 }

// Momen kunci
export const T = {
  walletRise: 84, // dompet logo naik dari bawah
  walletCover: 104, // frame tertutup biru, latar berganti di baliknya
  walletLand: 112,
  revealText: 138,
  badgePush: 176, // kamera menembus badge kuning
  maskStart: 190,
  maskEnd: 214,
  tilesIn: 210,
  click1: 260,
  click2: 276,
  click3: 304,
  clickBayar: 342,
  modalOpen: 344,
  clickQris: 378,
  clickSelesai: 394,
  success: 398,
  receiptStart: 404,
  word1: 420,
  word2: 452,
  word3: 484,
  endSuck: 512,
  endGulp: 532,
  wordmark: 536,
  cta: 562
}
