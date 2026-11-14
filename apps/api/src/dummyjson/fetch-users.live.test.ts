import { describe, expect, test } from 'vite-plus/test'

import { groupByDepartment } from '../departments/group-by-department.ts'
import { fetchUsers } from './fetch-users.ts'

// Contract test against the REAL dummyjson (run with `vpr test:live`).
// Unit tests prove the code works with the data shape we assumed; this checks
// that assumption still holds. It asserts invariants, not exact values,
// because the upstream data may change.

describe('dummyjson contract', () => {
  test('returns all users, and they all pass the schema', async () => {
    // fetchUsers throws an UpstreamError if any user fails validation
    const users = await fetchUsers()

    // The default page is 30 users: more proves `limit=0` is honoured
    expect(users.length).toBeGreaterThan(30)
  })

  test('produces consistent department summaries', async () => {
    const departments = groupByDepartment(await fetchUsers())
    const summaries = Object.values(departments)

    expect(summaries.length).toBeGreaterThan(0)

    for (const summary of summaries) {
      const people = Object.keys(summary.addressUser).length
      const hairTotal = Object.values(summary.hair).reduce((a, b) => a + b, 0)
      const [min = NaN, max = NaN] = summary.ageRange.split('-').map(Number)

      expect(people).toBeGreaterThan(0)
      // Other genders aren't counted, so male + female can be lower
      expect(summary.male + summary.female).toBeLessThanOrEqual(people)
      // Every person has exactly one hair color
      expect(hairTotal).toBe(people)
      expect(summary.ageRange).toMatch(/^\d+-\d+$/)
      expect(min).toBeLessThanOrEqual(max)
    }
  })
})
