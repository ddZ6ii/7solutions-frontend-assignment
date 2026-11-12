import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import type { ListKey } from '@/lib/board-state'
import type { Item } from '@/types/item'

/**
 * Accessibility feedback when an item moves between lists:
 * - focus follows the item if its button had focus (it unmounts on move)
 * - a message is exposed for a live region, for screen readers
 */
export function useMoveFeedback() {
  const pendingFocusRef = useRef<Item['name'] | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const onMove = useCallback((item: Item, to: ListKey) => {
    const focused = document.activeElement
    if (focused instanceof HTMLElement && focused.dataset.item === item.name) {
      pendingFocusRef.current = item.name
    }

    setAnnouncement(
      to === 'main'
        ? `${item.name} moved back to the list.`
        : `${item.name} moved to ${to}.`,
    )
  }, [])

  // After the moved button remounts in its new list, give it focus back
  useLayoutEffect(() => {
    const name = pendingFocusRef.current
    if (name === null) return
    pendingFocusRef.current = null
    document
      .querySelector<HTMLElement>(`[data-item="${CSS.escape(name)}"]`)
      ?.focus()
  })

  return { announcement, onMove }
}
