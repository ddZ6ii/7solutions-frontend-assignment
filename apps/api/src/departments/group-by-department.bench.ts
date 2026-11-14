import { expect, test } from 'vite-plus/test'

import type { User } from '../dummyjson/schema'
import { groupByDepartment } from './group-by-department'
import type { DepartmentMap } from './types'

// Run with `vp test bench` (excluded from `vp test`).
// Compares the single-pass implementation, O(n + d), with a naive multi-pass
// one, O(d · n), for n users and d departments.

const HAIR_COLORS = ['Black', 'Blond', 'Brown', 'Gray', 'Red', 'White']
const GENDERS = ['male', 'female', 'other']

/**
 * Deterministic users (no Math.random), so every run measures the same data.
 * Built once, outside the measured functions.
 */
const generateUsers = (count: number, departmentCount: number): User[] =>
  Array.from({ length: count }, (_, i) => ({
    firstName: `First${i}`,
    lastName: `Last${i}`,
    age: 20 + (i % 45),
    gender: GENDERS[i % GENDERS.length] ?? 'other',
    hair: { color: HAIR_COLORS[i % HAIR_COLORS.length] ?? 'Black' },
    address: { postalCode: String(10_000 + i) },
    company: { department: `Department ${i % departmentCount}` },
  }))

/**
 * Naive reference: same output as groupByDepartment, written the "obvious"
 * way, to benchmark against.
 *
 * For n users, d departments and k statistics per department:
 * - n      to list the departments,
 * - d · n  to filter all users once per department,
 * - k · n  for one pass per statistic (each user belongs to one department).
 * Total O(n + d·n + k·n) = O(d · n), since k is a small constant (≈ 5).
 */
const naiveGroupByDepartment = (users: readonly User[]): DepartmentMap => {
  const result: DepartmentMap = {}
  const departments = new Set(users.map((u) => u.company.department))

  for (const department of departments) {
    const members = users.filter((u) => u.company.department === department)
    const ages = members.map((u) => u.age)

    result[department] = {
      male: members.filter((u) => u.gender === 'male').length,
      female: members.filter((u) => u.gender === 'female').length,
      ageRange: `${Math.min(...ages)}-${Math.max(...ages)}`,
      hair: members.reduce<Record<string, number>>((counts, u) => {
        counts[u.hair.color] = (counts[u.hair.color] ?? 0) + 1
        return counts
      }, {}),
      addressUser: Object.fromEntries(
        members.map((u) => [
          `${u.firstName}${u.lastName}`,
          u.address.postalCode,
        ]),
      ),
    }
  }

  return result
}

// test.for (not test.each) passes the test context as 2nd argument,
// which is where the `bench` fixture lives.
test.for([
  { userCount: 10_000, departmentCount: 12 }, // ~ real data's shape, 50× bigger
  { userCount: 10_000, departmentCount: 1_000 }, // d grows with n
])(
  'single pass vs naive: $userCount users, $departmentCount departments',
  async ({ userCount, departmentCount }, { bench }) => {
    const users = generateUsers(userCount, departmentCount)

    // Both must produce the same output, otherwise the comparison is meaningless
    expect(groupByDepartment(users)).toEqual(naiveGroupByDepartment(users))

    const result = await bench.compare(
      bench('single pass', () => groupByDepartment(users)),
      bench('naive', () => naiveGroupByDepartment(users)),
    )

    expect(result.get('single pass')).toBeFasterThan(result.get('naive'))
  },
)
