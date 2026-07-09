export default defineNuxtPlugin(() => {
  let lastTouchEnd = 0

  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now()

      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }

      lastTouchEnd = now
    },
    { passive: false }
  )

  document.addEventListener(
    'dblclick',
    (event) => {
      event.preventDefault()
    },
    { passive: false }
  )

  document.addEventListener(
    'gesturestart',
    (event) => {
      event.preventDefault()
    },
    { passive: false }
  )
})
