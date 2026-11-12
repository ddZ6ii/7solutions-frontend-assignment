import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vite-plus/test'

import { AutoDeleteList } from '@/components/auto-delete-list'
import { ITEMS } from '@/data/items'
import { AUTO_DELETE_DELAY_MS } from '@/hooks/use-auto-delete'

const renderBoard = () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<AutoDeleteList />)
  return {
    user,
    main: screen.getByRole('region', { name: 'Items' }),
    fruit: screen.getByRole('region', { name: 'fruit' }),
    vegetable: screen.getByRole('region', { name: 'vegetable' }),
  }
}

/** Item names in DOM order (textContent would include the sr-only label). */
const namesIn = (region: HTMLElement) =>
  within(region)
    .queryAllByRole('button')
    .map((button) => button.dataset.item)

/** The item's button inside a region, matched on the name before the sr-only label. */
const button = (region: HTMLElement, name: string) =>
  within(region).getByRole('button', { name: new RegExp(`^${name},`) })

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

const announcement = () => screen.getByRole('status').textContent

beforeEach(() => {
  // Testing Library's async wrapper waits on a real setTimeout(0) and only
  // knows how to flush Jest's fake timers, so let the fake clock follow real time.
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AutoDeleteList', () => {
  test('lists all items in main and starts with empty columns', () => {
    const { main, fruit, vegetable } = renderBoard()

    expect(namesIn(main)).toEqual(ITEMS.map((i) => i.name))
    expect(namesIn(fruit)).toEqual([])
    expect(namesIn(vegetable)).toEqual([])
  })

  test('moves clicked items to the column of their type', async () => {
    const { user, main, fruit, vegetable } = renderBoard()

    await user.click(button(main, 'Apple'))
    await user.click(button(main, 'Carrot'))

    expect(namesIn(fruit)).toEqual(['Apple'])
    expect(namesIn(vegetable)).toEqual(['Carrot'])
    expect(namesIn(main)).not.toContain('Apple')
    expect(namesIn(main)).not.toContain('Carrot')
  })

  test('brings an item back to the bottom of main when clicked in its column', async () => {
    const { user, main, fruit } = renderBoard()

    await user.click(button(main, 'Apple'))
    await user.click(button(fruit, 'Apple'))

    expect(namesIn(fruit)).toEqual([])
    expect(namesIn(main).at(-1)).toBe('Apple')
  })

  test('returns an item to main automatically after the delay', async () => {
    const { user, main, fruit } = renderBoard()

    await user.click(button(main, 'Apple'))
    await advance(AUTO_DELETE_DELAY_MS)

    expect(namesIn(fruit)).toEqual([])
    expect(namesIn(main).at(-1)).toBe('Apple')
  })

  describe('accessibility', () => {
    test('describes the action in each button name', async () => {
      const { user, main, fruit } = renderBoard()

      expect(
        within(main).getByRole('button', { name: 'Apple, move to fruit' }),
      ).toBeTruthy()

      await user.click(button(main, 'Apple'))

      expect(
        within(fruit).getByRole('button', {
          name: 'Apple, move back to the list',
        }),
      ).toBeTruthy()
    })

    test('announces moves in a live region', async () => {
      const { user, main, fruit } = renderBoard()

      await user.click(button(main, 'Apple'))
      expect(announcement()).toBe('Apple moved to fruit.')

      await user.click(button(fruit, 'Apple'))
      expect(announcement()).toBe('Apple moved back to the list.')

      await user.click(button(main, 'Banana'))
      await advance(AUTO_DELETE_DELAY_MS)
      expect(announcement()).toBe('Banana moved back to the list.')
    })

    test('keeps focus on an item moved with the keyboard', async () => {
      const { user, main, fruit } = renderBoard()

      button(main, 'Apple').focus()
      await user.keyboard('{Enter}')
      expect(document.activeElement).toBe(button(fruit, 'Apple'))

      await user.keyboard('{Enter}')
      expect(document.activeElement).toBe(button(main, 'Apple'))
    })

    test('keeps focus on an item when the timer moves it back', async () => {
      const { user, main } = renderBoard()

      button(main, 'Apple').focus()
      await user.keyboard('{Enter}')
      await advance(AUTO_DELETE_DELAY_MS)

      expect(document.activeElement).toBe(button(main, 'Apple'))
    })

    test('does not steal focus when an unfocused item returns', async () => {
      const { user, main } = renderBoard()

      button(main, 'Apple').focus()
      await user.keyboard('{Enter}')
      const banana = button(main, 'Banana')
      banana.focus()
      await advance(AUTO_DELETE_DELAY_MS)

      expect(document.activeElement).toBe(banana)
    })
  })
})
