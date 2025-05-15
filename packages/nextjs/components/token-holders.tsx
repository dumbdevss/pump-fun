"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Token } from "~~/types/token-types"
import { useQuery, gql } from "@apollo/client"

interface TokenHoldersProps {
  token?: Token | any
}

const GET_TOKEN_HOLDERS = gql`
  query GetTokenHolders($assetType: String!) {
    current_fungible_asset_balances(
      where: {asset_type: {_eq: $assetType}, amount: {_gt: 0}}
    ) {
      owner_address
      amount
      last_transaction_timestamp
      metadata {
        creator_address
      }
    }
  }
`

export default function TokenHolders({ token }: TokenHoldersProps) {
  // Extract the token address from the token object, or use a fallback empty string
  const tokenAddress = token?.token_addr || ""
  
  // Use Apollo's useQuery hook to fetch data
  const { loading, error, data } = useQuery(GET_TOKEN_HOLDERS, {
    variables: { assetType: tokenAddress },
    skip: !tokenAddress, // Skip the query if no token address is provided
  })

  // Process the data into the format we need
  const holders = data?.current_fungible_asset_balances?.map((holder: any, index: number) => ({
    id: index,
    address: holder.owner_address,
    amount: parseInt(holder.amount),
    timestamp: holder.last_transaction_timestamp,
  })) || []

  // Calculate total supply for percentage calculation
  const totalSupply = holders.reduce((sum: number, holder: any) => sum + holder.amount, 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        Error loading token holders: {error.message}
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

          {holders.map((holder: any, index: number) => (
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
              <div className="col-span-3 text-right font-medium">
                {totalSupply > 0 ? ((holder.amount / totalSupply) * 100).toFixed(2) : "0.00"}%
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}