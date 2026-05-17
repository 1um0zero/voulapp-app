import { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'

export function useLocalStorage(key, defaultValue = '') {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    SecureStore.getItemAsync(key).then(v => { if (v !== null) setValue(v) })
  }, [key])

  const set = async (newValue) => {
    setValue(newValue)
    if (newValue) await SecureStore.setItemAsync(key, newValue)
    else await SecureStore.deleteItemAsync(key)
  }

  return [value, set]
}
