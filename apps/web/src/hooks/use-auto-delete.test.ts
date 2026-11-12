import { act, renderHook } from '@testing-library/react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vite-plus/test'

import { ITEMS } from '@/data/items'
import { AUTO_DELETE_DELAY_MS, useAutoDelete } from '@/hooks/use-auto-delete'
import { initState } from '@/lib/board-state'
import type { Item } from '@/types/item'

/** Looks up a fixture from ITEMS by name. */
const item = (name: string): Item => {
  const found = ITEMS.find((i) => i.name === name)
  if (!found) throw new Error(`No item named ${name}`)
  return found
}

const apple = item('Apple')
const banana = item('Banana')
const carrot = item('Carrot')

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

const setup = () => {
  const onMove = vi.fn()
  const hook = renderHook(() => useAutoDelete({ onMove }))
  const move = (item: Item) => act(() => hook.result.current.moveItem(item))
  const state = () => hook.result.current.state
  return { ...hook, onMove, move, state }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAutoDelete', () => {
  test('starts with the initial state', () => {
    const { state } = setup()
    expect(state()).toEqual(initState())
  })

  test('moves a main list item to its column and reports the move', () => {
    const { move, state, onMove } = setup()
    move(apple)

    expect(state().main).not.toContain(apple)
    expect(state().fruit).toEqual([apple])
    expect(onMove).toHaveBeenCalledExactlyOnceWith(apple, 'fruit')
  })

  test('keeps the item in its column just before the delay', () => {
    const { move, state } = setup()
    move(apple)
    advance(AUTO_DELETE_DELAY_MS - 1)

    expect(state().fruit).toEqual([apple])
  })

  test('returns the item to the bottom of main after the delay', () => {
    const { move, state, onMove } = setup()
    move(apple)
    advance(AUTO_DELETE_DELAY_MS)

    expect(state().fruit).toEqual([])
    expect(state().main.at(-1)).toBe(apple)
    expect(onMove).toHaveBeenLastCalledWith(apple, 'main')
  })

  test('cancels the timer when the item is moved back manually', () => {
    const { move, state, onMove } = setup()
    move(apple)
    move(apple)
    advance(AUTO_DELETE_DELAY_MS)

    expect(onMove).toHaveBeenCalledTimes(2)
    expect(state().main.filter((i) => i === apple)).toHaveLength(1)
    expect(state().fruit).toEqual([])
  })

  test('runs an independent timer per item', () => {
    const { move, state } = setup()
    move(apple)
    advance(2000)
    move(banana)

    advance(AUTO_DELETE_DELAY_MS - 2000) // t = 5s
    expect(state().fruit).toEqual([banana])

    advance(2000) // t = 7s
    expect(state().fruit).toEqual([])
    expect(state().main.slice(-2)).toEqual([apple, banana])
  })

  test('starts a fresh timer when the item is moved out again', () => {
    const { move, state } = setup()
    move(apple) // out at t = 0
    advance(1000)
    move(apple) // back at t = 1s
    advance(1000)
    move(apple) // out again at t = 2s

    advance(AUTO_DELETE_DELAY_MS - 2000) // t = 5s, first timer would fire here
    expect(state().fruit).toEqual([apple])

    advance(2000) // t = 7s
    expect(state().fruit).toEqual([])
  })

  test('clears pending timers on unmount', () => {
    const { move, unmount } = setup()
    move(apple)
    move(carrot)
    expect(vi.getTimerCount()).toBe(2)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('calls the latest onMove when the timer fires', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ onMove }) => useAutoDelete({ onMove }),
      { initialProps: { onMove: first } },
    )

    act(() => result.current.moveItem(apple))
    rerender({ onMove: second })
    advance(AUTO_DELETE_DELAY_MS)

    expect(first).toHaveBeenCalledExactlyOnceWith(apple, 'fruit')
    expect(second).toHaveBeenCalledExactlyOnceWith(apple, 'main')
  })

  test('keeps moveItem identity stable across renders', () => {
    const { result, rerender } = renderHook(
      ({ onMove }) => useAutoDelete({ onMove }),
      { initialProps: { onMove: vi.fn() } },
    )
    const initial = result.current.moveItem

    rerender({ onMove: vi.fn() })
    act(() => result.current.moveItem(apple))

    expect(result.current.moveItem).toBe(initial)
  })

  test('works without an onMove callback', () => {
    const { result } = renderHook(() => useAutoDelete())
    const move = () => act(() => result.current.moveItem(apple))

    move() // to column
    expect(result.current.state.fruit).toEqual([apple])

    move() // manual return
    expect(result.current.state.fruit).toEqual([])

    move() // to column again
    advance(AUTO_DELETE_DELAY_MS) // timer return
    expect(result.current.state.fruit).toEqual([])
    expect(result.current.state.main.at(-1)).toBe(apple)
  })
})
