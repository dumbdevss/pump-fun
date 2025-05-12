"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Rocket, History, ArrowRightLeft, Sparkles, TrendingUp } from "lucide-react"
import { Button } from "~~/components/ui/button"
import { Input } from "~~/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~~/components/ui/tabs"
import { Avatar } from "~~/components/ui/avatar"
import { Badge } from "~~/components/ui/badge"
import TokenCreator from "~~/components/token-creator"
import TokenSwap from "~~/components/token-swap"
import TokenHistory from "~~/components/token-history"
import TokenHolders from "~~/components/token-holders"
import TokenCard from "~~/components/token-card"
import { mockTokens } from "~~/lib/mock-data"
import { CustomConnectButton } from "~~/components/scaffold-move"
import { useView } from "~~/hooks/scaffold-move/useView"
import useSubmitTransaction from "~~/hooks/scaffold-move/useSubmitTransaction"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { useToast } from "~~/hooks/use-toast"

export default function Home() {
  const [activeTab, setActiveTab] = useState("trending")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { submitTransaction, transactionInProcess } = useSubmitTransaction("pump_for_fun");
  const { account } = useWallet();
  const { toast } = useToast();

  const {
    data: tokensData,
    refetch: refreshTokensData,
  } = useView({
    moduleName: "pump_for_fun",
    functionName: "get_all_tokens",
  })

  const {
    data: tokenDataHistory,
    refetch: refreshTokenData,
  } = useView({
    moduleName: "pump_for_fun",
    functionName: "get_token_history",
  })

  const createToken = async (tokenName: string, tokenSymbol: string, tokenSupply: number) => {
    if (!account) {
      toast({
        title: "Please connect your wallet",
        description: "You need to connect your wallet to create a token",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await submitTransaction({
        functionName: "create_token",
        args: [tokenName, tokenSymbol, tokenSupply],
      })
      if (response) {
        toast({
          title: "Token created successfully",
          description: `You have successfully created the token ${tokenName} (${tokenSymbol})`,
          variant: "default",
        })
        refreshTokensData()
      } else {
        toast({
          title: "Token creation failed",
          description: `There was an error creating the token ${tokenName} (${tokenSymbol})`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Token creation failed",
        description: `There was an error creating the token ${tokenName} (${tokenSymbol}): ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const swapTokensToMove = async (token_addr: string, token_amount: number) => {
    if (!account) {
      toast({
        title: "Please connect your wallet",
        description: "You need to connect your wallet to swap tokens",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await submitTransaction({
        functionName: "swap_move_to_token",
        args: [token_addr, token_amount],
      })
      if (response) {
        toast({
          title: "Swap successful",
          description: `You have successfully swapped tokens`,
          variant: "default",
        })
        refreshTokenData()
      } else {
        toast({
          title: "Swap failed",
          description: `There was an error swapping tokens`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Swap failed",
        description: `There was an error swapping tokens: ${error.message}`,
        variant: "destructive",
      })
    }
  }


  const swapMoveToToken = async (token_addr: any, move_amount) => {
    if (!account) {
      toast({
        title: "Please connect your wallet",
        description: "You need to connect your wallet to swap tokens",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await submitTransaction({
        functionName: "swap_move_to_token",
        args: [token_addr, move_amount],
      })
      if (response) {
        toast({
          title: "Swap successful",
          description: `You have successfully swapped tokens`,
          variant: "default",
        })
        refreshTokenData()
      } else {
        toast({
          title: "Swap failed",
          description: `There was an error swapping tokens`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Swap failed",
        description: `There was an error swapping tokens: ${error.message}`,
        variant: "destructive",
      })
    }
  }


  const handleTokenClick = (token) => {
    setSelectedToken(token)
    swapTokens(token.id)
  }

  const filteredTokens = mockTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Rocket className="h-6 w-6 text-purple-400" />
              </motion.div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                pump.fun
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Token
              </Button>
              <CustomConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 -z-1 container mx-auto px-4 py-6 flex flex-col">
        {/* Search */}
        <div className="flex justify-center mb-8">
          <div className="relative max-w-md w-full">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="text-gray-400" />
            </div>
            <Input
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-purple-500 w-full"
              placeholder="Search for tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col mb-8">
          <Tabs defaultValue="trending" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10 flex">
              <TabsTrigger value="trending" className="flex-1 data-[state=active]:bg-purple-500">
                <div className="flex items-center justify-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Trending
                </div>
              </TabsTrigger>
              <TabsTrigger value="new" className="flex-1 data-[state=active]:bg-purple-500">
                <div className="flex items-center justify-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  New
                </div>
              </TabsTrigger>
              <TabsTrigger value="swap" className="flex-1 data-[state=active]:bg-purple-500">
                <div className="flex items-center justify-center">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Swap
                </div>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-purple-500">
                <div className="flex items-center justify-center">
                  <History className="mr-2 h-4 w-4" />
                  History
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTokens.map((token, index) => (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedToken(token)}
                  >
                    <TokenCard token={token} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="new">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTokens
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 6)
                  .map((token, index) => (
                    <motion.div
                      key={token.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedToken(token)}
                    >
                      <TokenCard token={token} />
                    </motion.div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="swap">
              <TokenSwap />
            </TabsContent>

            <TabsContent value="history">
              <TokenHistory />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Selected token details modal */}
      <AnimatePresence>
        {selectedToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedToken(null)}>
            <motion.div
              className="bg-gray-900 border border-purple-500/30 rounded-xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              layoutId={`token-card-${selectedToken.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Tabs defaultValue="info">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16 rounded-xl border-2 border-purple-500/50">
                      <img src={selectedToken.image || "/placeholder.svg"} alt={selectedToken.name} />
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        {selectedToken.name}
                        <Badge className="bg-purple-500">{selectedToken.symbol}</Badge>
                      </h2>
                      <p className="text-gray-400">
                        Created {new Date(selectedToken.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <TabsList className="flex bg-white/5 border border-white/10">
                    <TabsTrigger value="info" className="flex-1 data-[state=active]:bg-purple-500">Info</TabsTrigger>
                    <TabsTrigger value="swap" className="flex-1 data-[state=active]:bg-purple-500">Swap</TabsTrigger>
                    <TabsTrigger value="holders" className="flex-1 data-[state=active]:bg-purple-500">Holders</TabsTrigger>
                    <TabsTrigger value="transactions" className="flex-1 data-[state=active]:bg-purple-500">Transactions</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="info">
                    <div className="flex flex-col space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400">Description</h3>
                        <p className="mt-1">{selectedToken.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Market Cap</h3>
                          <p className="mt-1 text-xl font-bold">${selectedToken.marketCap.toLocaleString()}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Price</h3>
                          <p className="mt-1 text-xl font-bold">${selectedToken.price.toFixed(6)}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Total Supply</h3>
                          <p className="mt-1 text-xl font-bold">{selectedToken.totalSupply.toLocaleString()}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">24h Change</h3>
                          <p
                            className={`mt-1 text-xl font-bold ${selectedToken.change24h > 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {selectedToken.change24h > 0 ? "+" : ""}
                            {selectedToken.change24h}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="swap">
                    <TokenSwap selectedToken={selectedToken} />
                  </TabsContent>

                  <TabsContent value="holders">
                    <TokenHolders tokenId={selectedToken.id} />
                  </TabsContent>

                  <TabsContent value="transactions">
                    <TokenHistory tokenId={selectedToken.id} />
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create token modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowCreateModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-purple-500/30 rounded-xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold">Create New Token</h2>
                  <p className="text-gray-400">Launch your own meme token</p>
                </div>

                <div className="p-6">
                  <TokenCreator onClose={() => setShowCreateModal(false)} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}