import { useCallback, useEffect, useRef, useState } from 'react'

import { initState, moveToColumn, moveToMain } from '@/lib/board-state'
import type { Item } from '@/types/item'

type TimerKey = Item['name']
type Timers = Map<TimerKey, ReturnType<typeof setTimeout>>

const AUTO_DELETE_DELAY_MS = 5000 // 5 seconds

export function useAutoDelete() {
  // An item has a pending timer ⇔ it is in a type column.
  // moveItem relies on this to know where the item is.
  const timersRef = useRef<Timers>(new Map())
  const [state, setState] = useState(initState)

  // Clear pending timers (if any) on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  const moveItem = useCallback((item: Item) => {
    const timers = timersRef.current
    const timerId = timers.get(item.name)

    // Item is in a type column → move back now
    if (timerId !== undefined) {
      clearTimeout(timerId)
      timers.delete(item.name)
      setState(moveToMain(item))
      return
    }

    // Item is in the main list → move to its column, schedule the return
    setState(moveToColumn(item))
    timers.set(
      item.name,
      setTimeout(() => {
        setState(moveToMain(item))
        timers.delete(item.name)
      }, AUTO_DELETE_DELAY_MS),
    )
  }, [])

  return {
    state,
    moveItem,
  }
}
