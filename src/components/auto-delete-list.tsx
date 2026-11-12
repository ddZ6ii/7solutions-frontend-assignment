import { useEffect, useRef, useState } from 'react'

import { BoardLayout } from '@/components/board-layout'
import { ItemList } from '@/components/item-list'
import { TypeColumn } from '@/components/type-column'
import { ITEM_TYPES } from '@/data/item-types'
import { ITEMS } from '@/data/items'
import type { Item, ItemType } from '@/types/item'

const AUTO_DELETE_DELAY_MS = 5000 // 5 seconds

type TimerKey = Item['name']
type Timers = Map<TimerKey, ReturnType<typeof setTimeout>>
type State = Record<ItemType | 'main', Item[]>
type StateUpdater = (prev: State) => State

function initState(): State {
  return {
    main: ITEMS,
    ...ITEM_TYPES.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {} as Record<ItemType, Item[]>,
    ),
  }
}

function moveToMain(item: Item): StateUpdater {
  return (prev: State) => ({
    ...prev,
    main: [...prev.main, item],
    [item.type]: prev[item.type].filter((i) => i !== item),
  })
}

function moveToColumn(item: Item): StateUpdater {
  return (prev: State) => ({
    ...prev,
    main: prev.main.filter((i) => i !== item),
    [item.type]: [...prev[item.type], item],
  })
}

export function AutoDeleteList() {
  const [state, setState] = useState(initState)
  const timersRef = useRef<Timers>(new Map())

  // Clear pending timers when the component unmounts (if any)
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  const handleItemClick = (item: Item) => {
    // Clear any existing timer for the clicked item (if any)
    const timers = timersRef.current
    if (timers.has(item.name)) {
      clearTimeout(timers.get(item.name))
      timers.delete(item.name)
    }

    // If the item is in the main list...
    if (state.main.includes(item)) {
      // Remove the item from the main list immediately, and add it to its type column
      setState(moveToColumn(item))

      // Schedule the item to be added back to the main list after 5 seconds
      const timerId = setTimeout(() => {
        setState(moveToMain(item))
        timers.delete(item.name)
      }, AUTO_DELETE_DELAY_MS)
      timers.set(item.name, timerId)
    }
    // ... the item is in a type column
    else {
      // Remove the item from its type column and add it to the main list immediately
      setState(moveToMain(item))
    }
  }

  return (
    <BoardLayout>
      <section aria-labelledby="main-list-heading" className="min-h-0">
        <h2 id="main-list-heading" className="sr-only">
          Items
        </h2>
        <ItemList items={state.main} onItemClick={handleItemClick} />
      </section>

      {ITEM_TYPES.map((type) => (
        <TypeColumn
          key={type}
          type={type}
          items={state[type]}
          onItemClick={handleItemClick}
        />
      ))}
    </BoardLayout>
  )
}
