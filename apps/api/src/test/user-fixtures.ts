import type { User, UsersResponse } from '../dummyjson/schema'

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

const makeUsersResponse = (users: User[]): UsersResponse => ({ users })

export { userFixture, makeUsersResponse }
