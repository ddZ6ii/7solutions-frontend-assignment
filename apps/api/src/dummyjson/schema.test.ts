import { describe, expect, test } from 'vite-plus/test'

import { makeUsersResponse, userFixture } from '../test/user-fixtures'
import { UserSchema, UsersResponseSchema } from './schema'

describe('UserSchema', () => {
  test('accepts a valid user', () => {
    expect(UserSchema.parse(userFixture)).toEqual(userFixture)
  })

  test('drops extra fields', () => {
    const rawUser = { ...userFixture, id: 1, email: 'emily@x.com' }

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
      UserSchema.parse({ ...userFixture, hair: { color: 'Purple' } }),
    ).not.toThrow()
  })

  test('rejects empty firstName', () => {
    expect(() => UserSchema.parse({ ...userFixture, firstName: '' })).toThrow()
  })

  test('rejects empty lastName', () => {
    expect(() => UserSchema.parse({ ...userFixture, lastName: '' })).toThrow()
  })

  test('rejects age with a non-number value', () => {
    expect(() => UserSchema.parse({ ...userFixture, age: '29' })).toThrow()
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

describe('UsersResponseSchema', () => {
  test('accepts a list of valid users', () => {
    const response = makeUsersResponse([userFixture])

    expect(UsersResponseSchema.parse(response)).toEqual(response)
  })

  test('accepts an empty list of users', () => {
    expect(() => UsersResponseSchema.parse(makeUsersResponse([]))).not.toThrow()
  })

  test('accepts the real dummyjson envelope and drops pagination fields', () => {
    const response = { users: [userFixture], total: 1, skip: 0, limit: 0 }

    expect(UsersResponseSchema.parse(response)).toEqual({
      users: [userFixture],
    })
  })

  test('rejects a response without a users key', () => {
    expect(() => UsersResponseSchema.parse({ total: 0 })).toThrow()
  })

  test('rejects users set to null', () => {
    expect(() => UsersResponseSchema.parse({ users: null })).toThrow()
  })
})
