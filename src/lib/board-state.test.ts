import { describe, expect, test } from 'vite-plus/test'

import { ITEMS } from '@/data/items'
import {
  initState,
  moveToColumn,
  moveToMain,
  type State,
} from '@/lib/board-state'
import { ITEM_TYPES, type Item } from '@/types/item'

const apple = { type: 'fruit', name: 'Apple' } satisfies Item
const banana = { type: 'fruit', name: 'Banana' } satisfies Item
const carrot = { type: 'vegetable', name: 'Carrot' } satisfies Item

const makeState = (partial: Partial<State>): State => ({
  main: [],
  fruit: [],
  vegetable: [],
  ...partial,
})

/** Freezes the state and its list items, so any mutation throws. */
const deepFreeze = (state: State): State => {
  Object.values(state).forEach((items) => Object.freeze(items))
  return Object.freeze(state)
}

describe('initState', () => {
  test('puts all items in main', () => {
    expect(initState().main).toEqual(ITEMS)
  })

  test('creates an empty column for each item type', () => {
    const state = initState()
    for (const type of ITEM_TYPES) {
      expect(state[type]).toEqual([])
    }
  })

  test('returns a new state on each call', () => {
    expect(initState()).not.toBe(initState())
  })
})

describe('moveToColumn', () => {
  test('removes the item from main', () => {
    const prev = makeState({ main: [apple, carrot] })
    const next = moveToColumn(apple)(prev)
    expect(next.main).toEqual([carrot])
  })

  test("adds the item to its type's column", () => {
    const prev = makeState({ main: [apple] })
    const next = moveToColumn(apple)(prev)
    expect(next.fruit).toEqual([apple])
  })

  test('appends after items already in the column', () => {
    const prev = makeState({ main: [apple], fruit: [banana] })
    const next = moveToColumn(apple)(prev)
    expect(next.fruit).toEqual([banana, apple])
  })

  test('leaves the other column untouched', () => {
    const prev = makeState({ main: [apple], vegetable: [carrot] })
    const next = moveToColumn(apple)(prev)
    expect(next.vegetable).toBe(prev.vegetable)
  })

  test('does not mutate the previous state', () => {
    const prev = deepFreeze(makeState({ main: [apple], fruit: [banana] }))
    expect(() => moveToColumn(apple)(prev)).not.toThrow()
    expect(prev).toEqual(makeState({ main: [apple], fruit: [banana] }))
  })
})

describe('moveToMain', () => {
  test('removes the item from its column', () => {
    const prev = makeState({ fruit: [apple, banana] })
    const next = moveToMain(apple)(prev)
    expect(next.fruit).toEqual([banana])
  })

  test('appends the item to the bottom of main', () => {
    const prev = makeState({ main: [carrot, banana], fruit: [apple] })
    const next = moveToMain(apple)(prev)
    expect(next.main).toEqual([carrot, banana, apple])
  })

  test('leaves the other column untouched', () => {
    const prev = makeState({ fruit: [apple], vegetable: [carrot] })
    const next = moveToMain(apple)(prev)
    expect(next.vegetable).toBe(prev.vegetable)
  })

  test('does not mutate the previous state', () => {
    const prev = deepFreeze(makeState({ main: [carrot], fruit: [apple] }))
    expect(() => moveToMain(apple)(prev)).not.toThrow()
    expect(prev).toEqual(makeState({ main: [carrot], fruit: [apple] }))
  })
})

describe('round trip', () => {
  test('moving to column then back puts the item at the bottom of main', () => {
    const start = makeState({ main: [apple, carrot] })
    const next = moveToColumn(apple)(start)
    const end = moveToMain(apple)(next)
    expect(end).toEqual(makeState({ main: [carrot, apple] }))
  })
})

describe('item matching', () => {
  test('matches items by name, so a copy is treated as the same item', () => {
    const lookalike = { ...apple }
    const prev = makeState({ main: [apple] })
    const next = moveToColumn(lookalike)(prev)
    expect(next.main).toEqual([])
    expect(next.fruit).toEqual([lookalike])
  })
})
