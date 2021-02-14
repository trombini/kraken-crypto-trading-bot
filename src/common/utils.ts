



export const round = (factor: number, number: number) => {
  return Math.round((number + Number.EPSILON) * 1000) / 1000
}
