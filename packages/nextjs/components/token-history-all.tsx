"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { HistoryType } from "~~/types/history-types"

interface TokenHistoryProps {
  histories: HistoryType[] | any[]
}

export default function AllTokenHistory({ histories }: TokenHistoryProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

   const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Europe/London",
    });
  };


  function conditionalFixed(num: number, decimalPlaces = 6) {
    // Convert to string to analyze decimal places
    const strNum = num.toString();

    // Check if it has a decimal point
    if (strNum.includes('.')) {
      const decimals = strNum.split('.')[1].length;

      // Only apply toFixed if it has more decimal places than specified
      if (decimals > decimalPlaces) {
        return num.toFixed(decimalPlaces);
      }
    }

    // Otherwise return the original number (as string to match toFixed behavior)
    return strNum;
  }
  
  return (
    <div className="space-y-4">
      {histories.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No transactions found</div>
      ) : (
        <div className="space-y-2">
          {histories.map((history: HistoryType, index) => {
            const isBuy = history.type === "buy";
            
            return (
              <motion.div
                key={history.timestamp}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${isBuy ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
                  >
                    {isBuy ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">
                      {isBuy ? "Buy" : "Sell"} Transaction
                    </p>
                    <p className="text-sm text-gray-400">{formatDate(history.timestamp)}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {isBuy ? `Buyer: ${history.buyer.substring(0, 6)}...` : `Seller: ${history.seller.substring(0, 6)}...`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {conditionalFixed((history.token_amount / 1e8), 6)}
                  </p>
                  <p className="text-sm text-gray-400">
                    ${isBuy ?  conditionalFixed((history.amount_in_usd / 1e8), 6) : conditionalFixed((history.amount_out_usd / 1e8), 6)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {conditionalFixed((history.move_amount / 1e8), 6)} MOVE
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}