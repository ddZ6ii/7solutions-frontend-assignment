const formatAgeRange = (min: number, max: number): string => `${min}-${max}`

const formatName = (firstName: string, lastName: string): string =>
  `${firstName}${lastName}`

export { formatAgeRange, formatName }
