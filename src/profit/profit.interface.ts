import { Position } from '../positions/position.interface'
import { Bet } from '../bets/bet.interface'

export interface Profit {
  date: string,
  volume: number
  soldFor: number
  profit: number
  position?: Position
  bet: Bet
}
