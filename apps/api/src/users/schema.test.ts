import { describe, expect, test } from 'vite-plus/test'
import {
  makeUsersPaginatedResponse,
  queryParamsFixture,
  userFixture,
  usersPaginatedFixture,
} from '../test/user-fixtures'
import {
  DEFAULT_SEARCH_RESULT_LIMIT,
  UserQueryParamsSchema,
  UserSchema,
  UsersPaginatedResponseSchema,
} from './schema'

describe('UserSchema', () => {
  test('accepts a valid user', () => {
    expect(() => UserSchema.parse(userFixture)).not.toThrow()
    expect(UserSchema.parse(userFixture)).toEqual(userFixture)
  })

  test('drops extra fields', () => {
    const rawUser = { ...userFixture, id: 1, email: 'emily@x.com' }

    expect(() => UserSchema.parse(rawUser)).not.toThrow()
    expect(UserSchema.parse(rawUser)).toEqual(userFixture)
  })

  test('accepts empty gender', () => {
    expect(() => UserSchema.parse({ ...userFixture, gender: '' })).not.toThrow()
  })

  test('accepts any gender string value', () => {
    expect(() =>
      UserSchema.parse({ ...userFixture, gender: 'unspecified' }),
    ).not.toThrow()
  })

  test('accepts any hair.color string value', () => {
    expect(() =>
      UserSchema.parse({
        ...userFixture,
        hair: {
          color: 'purple',
        },
      }),
    ).not.toThrow()
  })

  test('rejects empty firstName', () => {
    expect(() => UserSchema.parse({ ...userFixture, firstName: '' })).toThrow()
  })

  test('rejects empty lastName', () => {
    expect(() => UserSchema.parse({ ...userFixture, lastName: '' })).toThrow()
  })

  test('rejects age with a non-number value', () => {
    expect(() => UserSchema.parse({ ...userFixture, age: '0' })).toThrow()
  })

  test('rejects age with a value of 0', () => {
    expect(() => UserSchema.parse({ ...userFixture, age: 0 })).toThrow()
  })

  test('rejects age with a negative value', () => {
    expect(() => UserSchema.parse({ ...userFixture, age: -20 })).toThrow()
  })

  test('rejects empty hair.color', () => {
    expect(() =>
      UserSchema.parse({ ...userFixture, hair: { color: '' } }),
    ).toThrow()
  })

  test('rejects empty address.postalCode', () => {
    expect(() =>
      UserSchema.parse({ ...userFixture, address: { postalCode: '' } }),
    ).toThrow()
  })

  test('rejects empty company.department', () => {
    expect(() =>
      UserSchema.parse({ ...userFixture, company: { department: '' } }),
    ).toThrow()
  })

  test('rejects missing required company.department field', () => {
    expect(() => UserSchema.parse({ ...userFixture, company: {} })).toThrow()
  })
})

describe('UsersPaginatedResponse', () => {
  test('accepts an array of valid users', () => {
    expect(() =>
      UsersPaginatedResponseSchema.parse(usersPaginatedFixture),
    ).not.toThrow()
    expect(UsersPaginatedResponseSchema.parse(usersPaginatedFixture)).toEqual(
      usersPaginatedFixture,
    )
  })

  test('accepts an empty array of users', () => {
    expect(() =>
      UsersPaginatedResponseSchema.parse(makeUsersPaginatedResponse([])),
    ).not.toThrow()
  })

  test('rejects with an invalid user', () => {
    expect(() =>
      UsersPaginatedResponseSchema.parse([{ ...userFixture, age: '34' }]),
    ).toThrow()
  })
})

describe('UserQueryParams', () => {
  test('accepts valid query parameters', () => {
    expect(() => UserQueryParamsSchema.parse(queryParamsFixture)).not.toThrow()
    expect(UserQueryParamsSchema.parse(queryParamsFixture)).toEqual({
      ...queryParamsFixture,
      limit: queryParamsFixture.limit?.toString(),
    })
  })

  test('returns default value when no query params are passed', () => {
    expect(UserQueryParamsSchema.parse({})).toEqual({
      limit: DEFAULT_SEARCH_RESULT_LIMIT.toString(),
    })
  })

  test('returns default value when invalid limit value is provided', () => {
    const invalidParams = { limit: -4 }

    expect(() => UserQueryParamsSchema.parse(invalidParams)).not.toThrow()
    expect(UserQueryParamsSchema.parse(invalidParams)).toEqual({
      limit: DEFAULT_SEARCH_RESULT_LIMIT.toString(),
    })
  })

  test('rejects when invalid param value is provided', () => {
    expect(() => UserQueryParamsSchema.parse({ skip: '3323' })).toThrow()
  })
})
