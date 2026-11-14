import { describe, expect, test } from 'vite-plus/test'

import { formatAgeRange, formatName } from './format'

describe('formatAgeRange', () => {
  test('joins min and max with a dash', () => {
    expect(formatAgeRange(25, 36)).toBe('25-36')
  })

  test('repeats the age when min equals max', () => {
    expect(formatAgeRange(29, 29)).toBe('29-29')
  })
})

describe('formatName', () => {
  test('concatenates first and last name with no separator', () => {
    expect(formatName('Emily', 'Johnson')).toBe('EmilyJohnson')
  })
})
