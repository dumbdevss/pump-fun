import { HistoryType } from './history-types';

export type Token = {
  id: number;          // Unique identifier for the token
  name: string;
  symbol: string;
  description: string;
  telegram: string;
  twitter: string;
  discord: string;
  icon_uri: string;
  project_url: string;
  current_price: string;  // Current price of the token
  history: HistoryType[];
  timestamp: number;
  supply: string;  // Total supply of the token
  token_addr: string;  // Address of the token object
  pool_addr: string;
}