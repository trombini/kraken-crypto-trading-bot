import { IBet } from '../bets/bet.model'
import { Position } from '../positions/position.interface'

export interface Profit {
  date: string,
  volume: number
  soldFor: number
  profit: number
  position?: Position
  bet: IBet
}
