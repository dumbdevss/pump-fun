"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "~~/components/ui/button"
import { Input } from "~~/components/ui/input"
import { Textarea } from "~~/components/ui/textarea"
import { Label } from "~~/components/ui/label"
import { Rocket, Loader2 } from "lucide-react"

interface TokenCreatorProps {
  onClose: () => void
}

export default function TokenCreator({ onClose }: TokenCreatorProps) {
  const [step, setStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    totalSupply: "",
    image: null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    // Simulate token creation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsCreating(false)
    setIsSuccess(true)

    // Close modal after success
    setTimeout(() => {
      onClose()
    }, 3000)
  }

  return (
    <div>
      {!isSuccess ? (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="name">Token Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Moon Rocket"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <Label htmlFor="symbol">Token Symbol</Label>
                  <Input
                    id="symbol"
                    name="symbol"
                    placeholder="e.g. MOON"
                    value={formData.symbol}
                    onChange={handleChange}
                    required
                    className="bg-white/5 border-white/10"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-400 mt-1">Max 10 characters</p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your token..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="bg-white/5 border-white/10"
                    rows={3}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Next
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="totalSupply">Total Supply</Label>
                  <Input
                    id="totalSupply"
                    name="totalSupply"
                    type="number"
                    placeholder="e.g. 1000000"
                    value={formData.totalSupply}
                    onChange={handleChange}
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <Label htmlFor="image">Token Image</Label>
                  <div className="mt-1 flex items-center">
                    <label className="block w-full">
                      <span className="sr-only">Choose token image</span>
                      <Input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-purple-500 file:text-white
                          hover:file:bg-purple-600
                          cursor-pointer bg-white/5 border-white/10"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="border-white/10 hover:bg-white/5"
                  >
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4" />
                        Create Token
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          </div>
          <h3 className="text-xl font-bold mb-2">Token Created Successfully!</h3>
          <p className="text-gray-400 mb-6">Your token is now live on the blockchain</p>
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            View My Token
          </Button>
        </motion.div>
      )}
    </div>
  )
}

