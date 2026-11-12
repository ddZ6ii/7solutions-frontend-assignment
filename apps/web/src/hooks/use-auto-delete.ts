import { useCallback, useEffect, useRef, useState } from 'react'

import {
  initState,
  moveToColumn,
  moveToMain,
  type ListKey,
} from '@/lib/board-state'
import type { Item } from '@/types/item'

type TimerKey = Item['name']
type Timers = Map<TimerKey, ReturnType<typeof setTimeout>>

type UseAutoDeleteOptions = {
  /** Called right before an item moves, while its button is still in the DOM. */
  onMove?: (item: Item, to: ListKey) => void
}

export const AUTO_DELETE_DELAY_MS = 5000 // 5 seconds

export function useAutoDelete({ onMove }: UseAutoDeleteOptions = {}) {
  // An item has a pending timer ⇔ it is in a type column.
  // moveItem relies on this to know where the item is.
  const timersRef = useRef<Timers>(new Map())
  const [state, setState] = useState(initState)

  // Keep the latest onMove without breaking moveItem's stable identity
  const onMoveRef = useRef(onMove)
  useEffect(() => {
    onMoveRef.current = onMove
  })

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
      onMoveRef.current?.(item, 'main')
      setState(moveToMain(item))
      return
    }

    // Item is in the main list → move to its column, schedule the return
    onMoveRef.current?.(item, item.type)
    setState(moveToColumn(item))
    timers.set(
      item.name,
      setTimeout(() => {
        timers.delete(item.name)
        onMoveRef.current?.(item, 'main')
        setState(moveToMain(item))
      }, AUTO_DELETE_DELAY_MS),
    )
  }, [])

  return {
    state,
    moveItem,
  }
}
