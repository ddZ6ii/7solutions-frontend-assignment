import { cached } from '../lib/cached'
import { fetchUsers } from '../dummyjson/fetch-users'
import { groupByDepartment } from './group-by-department'
import type { DepartmentMap } from './types'

/**
 * In-memory cache: the inner layer, behind the CDN cache (../create-app.ts).
 * It lives in one warm function instance; a new instance starts empty.
 * Avoids refetching users from dummyjson on every request.
 * Department data changes rarely, so one minute of staleness is acceptable.
 */
const DEPARTMENTS_TTL_MS = 60_000

const loadDepartments = async (): Promise<DepartmentMap> => {
  const users = await fetchUsers()
  return groupByDepartment(users)
}

// Created once at module level, so every request shares the same cache.
export const getDepartments = cached(loadDepartments, {
  ttlMs: DEPARTMENTS_TTL_MS,
})
