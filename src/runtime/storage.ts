import { ref } from 'vue'

export function createStorage(access: () => Storage) {
  const memory = new Map<string, string>()
  const persistent = ref(true)

  return {
    persistent,
    getItem(key: string): string | null {
      if (persistent.value) {
        try {
          const value = access().getItem(key)
          if (value === null) memory.delete(key)
          else memory.set(key, value)
          return value
        } catch {
          persistent.value = false
        }
      }
      return memory.get(key) ?? null
    },
    setItem(key: string, value: string): void {
      memory.set(key, value)
      if (persistent.value) {
        try {
          access().setItem(key, value)
        } catch {
          persistent.value = false
        }
      }
    },
    removeItem(key: string): void {
      memory.delete(key)
      try {
        access().removeItem(key)
      } catch {
        persistent.value = false
      }
    },
  }
}
