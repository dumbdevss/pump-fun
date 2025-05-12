"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "~~/components/ui/button"
import { Input } from "~~/components/ui/input"
import { Label } from "~~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select"
import { ArrowDown, RefreshCw } from "lucide-react"
import { mockTokens } from "~~/lib/mock-data"

interface TokenSwapProps {
  selectedToken?: any
}

export default function TokenSwap({ selectedToken }: TokenSwapProps) {
  const [fromToken, setFromToken] = useState(selectedToken?.symbol || "SOL")
  const [toToken, setToToken] = useState(selectedToken ? "SOL" : "PEPE")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFromAmount(value)

    // Simulate conversion
    if (value) {
      const converted = Number.parseFloat(value) * 0.0023
      setToAmount(converted.toFixed(6))
    } else {
      setToAmount("")
    }
  }

  const handleSwap = () => {
    setIsLoading(true)

    // Simulate swap
    setTimeout(() => {
      setIsLoading(false)
      setFromAmount("")
      setToAmount("")
    }, 2000)
  }

  const handleSwitchTokens = () => {
    const tempFrom = fromToken
    setFromToken(toToken)
    setToToken(tempFrom)
    setFromAmount("")
    setToAmount("")
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="fromAmount">From</Label>
              <span className="text-sm text-gray-400">Balance: 1.245</span>
            </div>
            <div className="flex gap-2">
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="w-[120px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  {mockTokens.map((token) => (
                    <SelectItem key={token.id} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="fromAmount"
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={handleFromAmountChange}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-white/10 p-2 rounded-full"
              onClick={handleSwitchTokens}
            >
              <ArrowDown className="h-4 w-4" />
            </motion.button>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="toAmount">To</Label>
              <span className="text-sm text-gray-400">Balance: 0.00</span>
            </div>
            <div className="flex gap-2">
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="w-[120px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOL">SOL</SelectItem>
                  {mockTokens.map((token) => (
                    <SelectItem key={token.id} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="toAmount"
                type="number"
                placeholder="0.00"
                value={toAmount}
                readOnly
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSwap}
            disabled={!fromAmount || isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Swapping...
              </>
            ) : (
              "Swap Tokens"
            )}
          </Button>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Rate</span>
            <span>
              1 {fromToken} = 0.0023 {toToken}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Fee</span>
            <span>0.5%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

