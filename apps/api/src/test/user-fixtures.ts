import {
  DEFAULT_SEARCH_RESULT_LIMIT,
  type User,
  type UserQueryParams,
  type UsersPaginatedResponse,
} from '../users/schema'

const userFixture: User = {
  firstName: 'Emily',
  lastName: 'Johnson',
  age: 29,
  gender: 'female',
  hair: {
    color: 'Brown',
  },
  address: {
    postalCode: '29112',
  },
  company: {
    department: 'Engineering',
  },
}

const usersPaginatedFixture: UsersPaginatedResponse = {
  users: [userFixture],
  limit: 0,
  total: 1,
  skip: 0,
}

const queryParamsFixture: UserQueryParams = {
  limit: DEFAULT_SEARCH_RESULT_LIMIT,
}

const makeQueryParams = (
  overrides: Partial<UserQueryParams> = {},
): UserQueryParams => ({
  ...queryParamsFixture,
  ...overrides,
})

const makeUsersPaginatedResponse = (
  users: User[],
  overrides: Partial<Omit<UsersPaginatedResponse, 'users' | 'total'>> = {},
): UsersPaginatedResponse => ({
  users,
  limit: 0,
  total: users.length,
  skip: 0,
  ...overrides,
})

export {
  userFixture,
  usersPaginatedFixture,
  queryParamsFixture,
  makeQueryParams,
  makeUsersPaginatedResponse,
}
