"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useQuery, gql } from "@apollo/client"
import { Button } from "~~/components/ui/button"
import { Input } from "~~/components/ui/input"
import { Label } from "~~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select"
import { ArrowDown, RefreshCw, AlertCircle } from "lucide-react"
import { useGetAccountNativeBalance } from "~~/hooks/scaffold-move"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import type { Token } from "~~/types/token-types"
import { conditionalFixed } from "~~/utils/helper"


interface TokenSwapProps {
  tokens: Token[];
  swapMoveToToken: (token_addr: string, move_amount: number) => Promise<void>;
  swapTokensToMove: (token_addr: string, token_amount: number) => Promise<void>;
}

const GET_USER_TOKEN_BALANCE = gql`
  query GetUserTokenBalance($owner_address: String!, $asset_type: String!) {
    current_fungible_asset_balances(
      where: {
        owner_address: {_eq: $owner_address},
        asset_type: {_eq: $asset_type}
      }
    ) {
      asset_type
      amount
      last_transaction_timestamp
    }
  }
`;

export default function TokenSwapAll({ tokens, swapMoveToToken, swapTokensToMove }: TokenSwapProps) {
  const { account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [fromToken, setFromToken] = useState("MOVE");
  const [toToken, setToToken] = useState("");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState("");
  const [conversionRate, setConversionRate] = useState(0);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const { balance } = useGetAccountNativeBalance(account?.address);

  // Get current token address based on selection
  const currentTokenAddress = selectedToken?.token_addr || "";

  // Fetch selected token balance
  const { data: tokenBalanceData, loading: tokenBalanceLoading, refetch: refetchTokenBalance } = useQuery(GET_USER_TOKEN_BALANCE, {
    variables: {
      owner_address: account?.address || "",
      asset_type: currentTokenAddress
    },
    skip: !account?.address || !currentTokenAddress,
    fetchPolicy: "network-only"
  });

  // Parse balances
  const moveBalance = (balance as number) / 1e8;
  const tokenBalance = parseFloat(tokenBalanceData?.current_fungible_asset_balances[0]?.amount || "0") / 1e8;
  const hasTokenBalance = tokenBalance > 0;
  const hasMoveBalance = moveBalance > 0;

  // Set initial token when tokens are available
  useEffect(() => {
    if (tokens && tokens.length > 0 && !selectedToken) {
      setSelectedToken(tokens[0]);
      setToToken(tokens[0].symbol);
    }
  }, [tokens, selectedToken]);

  // Update conversion rate when token changes
  useEffect(() => {
    if (selectedToken) {
      setConversionRate(parseFloat(selectedToken.current_price) / (1e8) || 1.0);
    }
  }, [selectedToken, toToken, fromToken]);

  // Update selected token when toToken changes
  useEffect(() => {
    if (toToken && toToken !== "MOVE") {
      const token = tokens.find(t => t.symbol === toToken);
      if (token) {
        setSelectedToken(token);
      }
    }
  }, [toToken, tokens]);

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromAmount(value);

    // Convert based on direction
    if (value) {
      let converted = 0;
      if (fromToken === "MOVE") {
        // MOVE to token
        converted = parseFloat(value) / (conversionRate / 1e8);
      } else {
        // Token to MOVE
        converted = parseFloat(value) * (conversionRate / 1e8);
      }
      setToAmount(conditionalFixed(converted, 9));
    } else {
      setToAmount("");
    }
  };

  const handleSwitchTokens = () => {
    const tempFrom = fromToken;
    setFromToken(toToken);
    setToToken(tempFrom);
    setFromAmount("");
    setToAmount("");
  };

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;

    setIsLoading(true);
    try {
      const amount = parseFloat(fromAmount);

      if (fromToken === "MOVE") {
        // Swapping MOVE to token
        await swapMoveToToken(currentTokenAddress, (amount * 1e8));
      } else {
        // Swapping token to MOVE
        await swapTokensToMove(currentTokenAddress, (amount * 1e8));
      }

      // Clear form and refetch balances
      setFromAmount("");
      setToAmount("");
      refetchTokenBalance();
    } catch (error) {
      console.error("Swap failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxBalance = () => {
    if (fromToken === "MOVE") {
      return moveBalance;
    } else {
      return tokenBalance;
    }
  };

  const handleSetMaxAmount = () => {
    const maxBalance = getMaxBalance();
    if (maxBalance > 0) {
      setFromAmount(maxBalance.toString());

      // Calculate to amount
      let converted = 0;
      if (fromToken === "MOVE") {
        converted = maxBalance / (conversionRate / 1e8);
      } else {
        converted = maxBalance * (conversionRate / 1e8);
      }
      setToAmount(conditionalFixed(converted, 9));
    }
  };


  const handleTokenChange = (value: string) => {
    if (value === "MOVE") {
      // If selecting MOVE
      setToToken(value);
    } else {
      // If selecting another token
      setToToken(value);
      const token = tokens.find(t => t.symbol === value);
      if (token) {
        setSelectedToken(token);
      }
    }
  };

  // Loading state
  if (tokenBalanceLoading) {
    return (
      <div className="p-6 bg-white/5 rounded-xl border border-white/10 flex justify-center items-center">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // No tokens available
  const noTokensAvailable = !hasMoveBalance && !hasTokenBalance;
  if (noTokensAvailable) {
    return (
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tokens Available</h3>
          <p className="text-gray-400">
            You don't have any MOVE or {selectedToken?.symbol || "token"} balance to swap.
          </p>
          <Button
            className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={() => {
              refetchTokenBalance();
            }}
          >
            Refresh Balances
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="fromAmount">From</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-400">
                  Balance: {fromToken === "MOVE" ? conditionalFixed(moveBalance, 4) : conditionalFixed(tokenBalance, 4)}
                </span>
                <button
                  onClick={handleSetMaxAmount}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={fromToken}
                onValueChange={setFromToken}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[120px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOVE">MOVE</SelectItem>
                  {toToken == "MOVE" && tokens.map((token) => (
                    <SelectItem key={token.token_addr} value={token.symbol}>
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
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-white/10 p-2 rounded-full"
              onClick={handleSwitchTokens}
              disabled={isLoading}
            >
              <ArrowDown className="h-4 w-4" />
            </motion.button>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="toAmount">To</Label>
              <span className="text-sm text-gray-400">
                Balance: {toToken === "MOVE" ? conditionalFixed(moveBalance, 4) : conditionalFixed(tokenBalance, 4)}
              </span>
            </div>
            <div className="flex gap-2">
              <Select
                value={toToken}
                onValueChange={handleTokenChange}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[120px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOVE">MOVE</SelectItem>
                  {fromToken == "MOVE" && tokens.map((token) => (
                    <SelectItem key={token.token_addr} value={token.symbol}>
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
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSwap}
            disabled={!fromAmount || isLoading || parseFloat(fromAmount) <= 0}
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
              {fromToken === "MOVE" ? (
                <>1 MOVE = {conditionalFixed((1 / (conversionRate / 1e8)), 9)} {toToken}</>
              ) : (
                <>1 {fromToken} = {conditionalFixed((conversionRate / 1e8), 9)} MOVE</>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Fee</span>
            <span>0.04 MOVE</span>
          </div>
        </div>
      </div>
    </div>
  )
}