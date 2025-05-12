"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "~~/components/ui/card"
import { Avatar } from "~~/components/ui/avatar"
import { Badge } from "~~/components/ui/badge"
import { ArrowUp, ArrowDown } from "lucide-react"

interface TokenCardProps {
  token: {
    id: string
    name: string
    symbol: string
    image: string
    price: number
    marketCap: number
    change24h: number
    createdAt: string
    description: string
    totalSupply: number
  }
}

export default function TokenCard({ token }: TokenCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="bg-gray-900/60 border-white/5 hover:border-purple-500/50 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-xl border-2 border-purple-500/50">
              <img src={token.image || "/placeholder.svg"} alt={token.name} />
            </Avatar>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {token.name}
                <Badge className="bg-purple-500/80">{token.symbol}</Badge>
              </h3>
              <p className="text-sm text-gray-400">Market Cap: ${token.marketCap.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div>
            <p className="text-xl font-bold">${token.price.toFixed(6)}</p>
          </div>
          <div className={`flex items-center ${token.change24h > 0 ? "text-green-500" : "text-red-500"}`}>
            {token.change24h > 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
            <span className="font-medium">
              {token.change24h > 0 ? "+" : ""}
              {token.change24h}%
            </span>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

