"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { mockHolders } from "~~/lib/mock-data"

interface TokenHoldersProps {
  tokenId?: string
}

export default function TokenHolders({ tokenId }: TokenHoldersProps) {
  const [holders, setHolders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading holders
    const loadHolders = async () => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Filter holders if tokenId is provided
      const filteredHolders = tokenId ? mockHolders.filter((holder) => holder.tokenId === tokenId) : mockHolders

      setHolders(filteredHolders)
      setIsLoading(false)
    }

    loadHolders()
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
      {holders.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No holders found</div>
      ) : (
        <div>
          <div className="grid grid-cols-12 gap-4 py-2 text-sm text-gray-400 border-b border-white/10">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Address</div>
            <div className="col-span-3 text-right">Amount</div>
            <div className="col-span-3 text-right">Percentage</div>
          </div>

          {holders.map((holder: any, index) => (
            <motion.div
              key={holder.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-12 gap-4 py-3 border-b border-white/5"
            >
              <div className="col-span-1 font-medium">{index + 1}</div>
              <div className="col-span-5 font-mono text-sm truncate">{holder.address}</div>
              <div className="col-span-3 text-right font-medium">{holder.amount.toLocaleString()}</div>
              <div className="col-span-3 text-right font-medium">{holder.percentage.toFixed(2)}%</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

