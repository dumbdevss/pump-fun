// Mock data for the application

// Mock tokens
export const mockTokens = [
  {
    id: "1",
    name: "Pepe Coin",
    symbol: "PEPE",
    image: "/placeholder.svg?height=100&width=100",
    price: 0.000012,
    marketCap: 2500000,
    change24h: 15.4,
    createdAt: "2023-05-15T10:30:00Z",
    description:
      "The original meme coin inspired by the famous Pepe the Frog meme. A community-driven token with strong meme culture.",
    totalSupply: 420000000000,
  },
  {
    id: "2",
    name: "Moon Rocket",
    symbol: "MOON",
    image: "/placeholder.svg?height=100&width=100",
    price: 0.00345,
    marketCap: 1200000,
    change24h: -5.2,
    createdAt: "2023-06-22T14:15:00Z",
    description:
      "To the moon! A token designed to skyrocket in value. Community-focused with regular burns to increase scarcity.",
    totalSupply: 1000000000,
  },
  {
    id: "3",
    name: "Doge Inu",
    symbol: "DOGEINU",
    image: "/placeholder.svg?height=100&width=100",
    price: 0.0000078,
    marketCap: 3800000,
    change24h: 8.7,
    createdAt: "2023-04-01T09:45:00Z",
    description: "The perfect combination of two popular meme coins. Bringing together the best of both communities.",
    totalSupply: 1000000000000,
  },
  {
    id: "4",
    name: "Shib Army",
    symbol: "SHIBARMY",
    image: "/placeholder.svg?height=100&width=100",
    price: 0.00000567,
    marketCap: 4500000,
    change24h: 22.3,
    createdAt: "2023-07-10T16:20:00Z",
    description: "A token for the loyal Shiba Inu community. Strong tokenomics with built-in burn mechanisms.",
    totalSupply: 589000000000,
  },
  {
    id: "5",
    name: "Floki Mars",
    symbol: "FLOKIMARS",
    image: "/placeholder.svg?height=100&width=100",
    price: 0.000089,
    marketCap: 950000,
    change24h: -12.5,
    createdAt: "2023-08-05T11:10:00Z",
    description: "Floki is going to Mars! A fun community token with regular giveaways and events.",
    totalSupply: 10000000000,
  },
  {
    id: "6",
    name: "Meme Lord",
    symbol: "MLORD",
    image: "/placeholder.svg?height=100&width=100",
    price: 0.00123,
    marketCap: 1800000,
    change24h: 5.8,
    createdAt: "2023-09-18T13:40:00Z",
    description:
      "The ultimate meme token created by meme lords for meme lords. Regular community contests for the best memes.",
    totalSupply: 1500000000,
  },
]

// Mock transactions
export const mockTransactions = [
  {
    id: "tx1",
    tokenId: "1",
    tokenSymbol: "PEPE",
    type: "buy",
    amount: 1500000,
    valueUsd: 18.75,
    timestamp: "2023-10-15T14:30:00Z",
  },
  {
    id: "tx2",
    tokenId: "1",
    tokenSymbol: "PEPE",
    type: "sell",
    amount: 500000,
    valueUsd: 6.25,
    timestamp: "2023-10-15T16:45:00Z",
  },
  {
    id: "tx3",
    tokenId: "2",
    tokenSymbol: "MOON",
    type: "buy",
    amount: 50000,
    valueUsd: 172.5,
    timestamp: "2023-10-16T09:20:00Z",
  },
  {
    id: "tx4",
    tokenId: "3",
    tokenSymbol: "DOGEINU",
    type: "buy",
    amount: 10000000,
    valueUsd: 78.0,
    timestamp: "2023-10-16T11:10:00Z",
  },
  {
    id: "tx5",
    tokenId: "1",
    tokenSymbol: "PEPE",
    type: "buy",
    amount: 2000000,
    valueUsd: 24.0,
    timestamp: "2023-10-17T08:15:00Z",
  },
]

// Mock token holders
export const mockHolders = [
  {
    id: "h1",
    tokenId: "1",
    address: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
    amount: 50000000,
    percentage: 11.9,
  },
  {
    id: "h2",
    tokenId: "1",
    address: "0x9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a0",
    amount: 35000000,
    percentage: 8.33,
  },
  {
    id: "h3",
    tokenId: "1",
    address: "0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t",
    amount: 28000000,
    percentage: 6.67,
  },
  {
    id: "h4",
    tokenId: "2",
    address: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
    amount: 150000,
    percentage: 15.0,
  },
  {
    id: "h5",
    tokenId: "2",
    address: "0x9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a0",
    amount: 100000,
    percentage: 10.0,
  },
]

