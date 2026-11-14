import { describe, expect, test } from 'vite-plus/test'

import { groupByDepartment } from './group-by-department'
import type { User } from '../dummyjson/schema'

const makeUser = (overrides: Partial<User> = {}): User => ({
  firstName: 'Emily',
  lastName: 'Johnson',
  age: 29,
  gender: 'female',
  hair: { color: 'Brown' },
  address: { postalCode: '29112' },
  company: { department: 'Engineering' },
  ...overrides,
})

const emily = makeUser()
const emma = makeUser({
  firstName: 'Emma',
  lastName: 'Miller',
  age: 31,
  hair: { color: 'White' },
  address: { postalCode: '26593' },
})
const michael = makeUser({
  firstName: 'Michael',
  lastName: 'Williams',
  age: 36,
  gender: 'male',
  hair: { color: 'Green' },
  address: { postalCode: '38807' },
  company: { department: 'Support' },
})
const jane = makeUser({
  firstName: 'Jane',
  lastName: 'Doe',
  age: 85,
  gender: 'unspecified',
  hair: { color: 'Chestnut' },
  address: { postalCode: '16572' },
})

/** Freezes users and their nested objects, so any mutation throws. */
const deepFreeze = (users: User[]): readonly User[] => {
  for (const user of users) {
    Object.freeze(user.hair)
    Object.freeze(user.address)
    Object.freeze(user.company)
    Object.freeze(user)
  }
  return Object.freeze(users)
}

describe('groupByDepartment', () => {
  test('returns an empty object for an empty list of users', () => {
    expect(groupByDepartment([])).toEqual({})
  })

  test('returns the full summary for a single user', () => {
    expect(groupByDepartment([emily])).toEqual({
      Engineering: {
        male: 0,
        female: 1,
        ageRange: '29-29',
        hair: { Brown: 1 },
        addressUser: { EmilyJohnson: '29112' },
      },
    })
  })

  test('adds up counts for users in the same department', () => {
    expect(groupByDepartment([emily, emma])).toEqual({
      Engineering: {
        male: 0,
        female: 2,
        ageRange: '29-31',
        hair: { Brown: 1, White: 1 },
        addressUser: { EmilyJohnson: '29112', EmmaMiller: '26593' },
      },
    })
  })

  test('always includes both gender keys, even when a count is 0', () => {
    const summary = groupByDepartment([emily, michael])

    expect(summary['Engineering']).toMatchObject({ male: 0, female: 1 })
    expect(summary['Support']).toMatchObject({ male: 1, female: 0 })
  })

  test('does not count other genders, but keeps the user in the rest of the summary', () => {
    expect(groupByDepartment([emily, jane])).toEqual({
      Engineering: {
        male: 0,
        female: 1,
        ageRange: '29-85',
        hair: { Brown: 1, Chestnut: 1 },
        addressUser: { EmilyJohnson: '29112', JaneDoe: '16572' },
      },
    })
  })

  test('computes the age range whatever the order of users', () => {
    const users = [
      makeUser({ firstName: 'A', age: 36 }),
      makeUser({ firstName: 'B', age: 25 }),
      makeUser({ firstName: 'C', age: 31 }),
    ]

    const engineeringDptSummary = groupByDepartment(users)['Engineering']

    expect(engineeringDptSummary?.ageRange).toBe('25-36')
  })

  test('does not pad single-digit ages', () => {
    const users = [
      makeUser({ firstName: 'A', age: 5 }),
      makeUser({ firstName: 'B', age: 46 }),
    ]

    const engineeringDptSummary = groupByDepartment(users)['Engineering']

    expect(engineeringDptSummary?.ageRange).toBe('5-46')
  })

  test('counts users per hair color', () => {
    const users = [
      makeUser({ firstName: 'A', hair: { color: 'Brown' } }),
      makeUser({ firstName: 'B', hair: { color: 'Brown' } }),
      makeUser({ firstName: 'C', hair: { color: 'White' } }),
    ]

    const engineeringDptSummary = groupByDepartment(users)['Engineering']

    expect(engineeringDptSummary?.hair).toEqual({
      Brown: 2,
      White: 1,
    })
  })

  test('keys addresses by firstName + lastName with no space', () => {
    const engineeringDptSummary = groupByDepartment([emily])['Engineering']

    expect(engineeringDptSummary?.addressUser).toEqual({
      EmilyJohnson: '29112',
    })
  })

  test('keeps the last postal code when two users share a full name', () => {
    const users = [
      makeUser({ address: { postalCode: '11111' } }),
      makeUser({ address: { postalCode: '22222' } }),
    ]

    const engineeringDptSummary = groupByDepartment(users)['Engineering']

    expect(engineeringDptSummary?.addressUser).toEqual({
      EmilyJohnson: '22222',
    })
  })

  test('keeps a separate summary for each department', () => {
    expect(groupByDepartment([emily, michael])).toEqual({
      Engineering: {
        male: 0,
        female: 1,
        ageRange: '29-29',
        hair: { Brown: 1 },
        addressUser: { EmilyJohnson: '29112' },
      },
      Support: {
        male: 1,
        female: 0,
        ageRange: '36-36',
        hair: { Green: 1 },
        addressUser: { MichaelWilliams: '38807' },
      },
    })
  })

  test('matches the expected output for a mixed set of users', () => {
    const users = [
      makeUser({
        firstName: 'Emily',
        lastName: 'Johnson',
        age: 29,
        gender: 'female',
        hair: { color: 'Brown' },
        address: { postalCode: '29112' },
        company: { department: 'Engineering' },
      }),
      makeUser({
        firstName: 'Terry',
        lastName: 'Medhurst',
        age: 50,
        gender: 'male',
        hair: { color: 'Black' },
        address: { postalCode: '45454' },
        company: { department: 'Support' },
      }),
      makeUser({
        firstName: 'Michael',
        lastName: 'Williams',
        age: 36,
        gender: 'male',
        hair: { color: 'Brown' },
        address: { postalCode: '38807' },
        company: { department: 'Engineering' },
      }),
      makeUser({
        firstName: 'Jane',
        lastName: 'Doe',
        age: 25,
        gender: 'unspecified',
        hair: { color: 'Chestnut' },
        address: { postalCode: '16572' },
        company: { department: 'Engineering' },
      }),
      makeUser({
        firstName: 'Sophia',
        lastName: 'Brown',
        age: 42,
        gender: 'female',
        hair: { color: 'Black' },
        address: { postalCode: '12345' },
        company: { department: 'Support' },
      }),
    ]

    expect(groupByDepartment(users)).toEqual({
      Engineering: {
        male: 1,
        female: 1,
        ageRange: '25-36',
        hair: { Brown: 2, Chestnut: 1 },
        addressUser: {
          EmilyJohnson: '29112',
          MichaelWilliams: '38807',
          JaneDoe: '16572',
        },
      },
      Support: {
        male: 1,
        female: 1,
        ageRange: '42-50',
        hair: { Black: 2 },
        addressUser: { TerryMedhurst: '45454', SophiaBrown: '12345' },
      },
    })
  })

  test('does not modify the input (pure function)', () => {
    const users = deepFreeze([emily, emma, michael])

    expect(() => groupByDepartment(users)).not.toThrow()
  })

  test.each(['__proto__', 'constructor', 'toString'])(
    'stores a department named %s as a regular key',
    (department) => {
      const summary = groupByDepartment([makeUser({ company: { department } })])

      expect(Object.keys(summary)).toEqual([department])
      expect(summary[department]).toEqual({
        male: 0,
        female: 1,
        ageRange: '29-29',
        hair: { Brown: 1 },
        addressUser: { EmilyJohnson: '29112' },
      })
    },
  )

  test('stores hair colors and names like __proto__ as regular keys', () => {
    const user = makeUser({
      firstName: '__pro',
      lastName: 'to__',
      hair: { color: '__proto__' },
    })

    const summary = groupByDepartment([user])['Engineering']

    expect(Object.keys(summary?.hair ?? {})).toEqual(['__proto__'])
    expect(Object.keys(summary?.addressUser ?? {})).toEqual(['__proto__'])
  })
})
