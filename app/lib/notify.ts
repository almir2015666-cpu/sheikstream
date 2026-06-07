export function notify(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sk-toast', { detail: { message, type } }))
  }
}
