"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { mockTransactions } from "~~/lib/mock-data"

interface TokenHistoryProps {
  tokenId?: string
}

export default function TokenHistory({ tokenId }: TokenHistoryProps) {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading transactions
    const loadTransactions = async () => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Filter transactions if tokenId is provided
      const filteredTransactions = tokenId ? mockTransactions.filter((tx) => tx.tokenId === tokenId) : mockTransactions

      setTransactions(filteredTransactions)
      setIsLoading(false)
    }

    loadTransactions()
  }, [tokenId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No transactions found</div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx: any, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${tx.type === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                >
                  {tx.type === "buy" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium">
                    {tx.type === "buy" ? "Buy" : "Sell"} {tx.tokenSymbol}
                  </p>
                  <p className="text-sm text-gray-400">{new Date(tx.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {tx.amount} {tx.tokenSymbol}
                </p>
                <p className="text-sm text-gray-400">${tx.valueUsd.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

