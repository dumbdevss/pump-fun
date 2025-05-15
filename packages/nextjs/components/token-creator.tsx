"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "~~/components/ui/button"
import { Input } from "~~/components/ui/input"
import { Textarea } from "~~/components/ui/textarea"
import { Label } from "~~/components/ui/label"
import { Rocket, Loader2, ChevronDown, ChevronUp } from "lucide-react"

interface TokenCreatorProps {
  onClose: () => void,
  createToken: (
    tokenName: string,
    tokenSymbol: string,
    icon_uri: string,
    project_uri: string,
    initial_liquidity: number,
    supply: string,
    description: string,
    telegram: string | null,
    twitter: string | null,
    discord: string | null
  ) => any
}

export default function TokenCreator({ createToken, onClose }: TokenCreatorProps) {
  const [step, setStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showSocials, setShowSocials] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const DECIMAL = 100000000;
  const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
  const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET
  const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/"

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    projectUrl: "",
    description: "",
    twitter: "",
    discord: "",
    telegram: "",
    supply: "",
    initialLiquidity: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files?.[0]
      if (file) {
        // In a real implementation, you would upload this to IPFS or another storage
        // and get back a URL. For now, we'll create a local object URL
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: {
            "pinata_api_key": PINATA_API_KEY || "",
            "pinata_secret_api_key": PINATA_API_SECRET || "",
          },
          body: formData,
        })

        const data = await response.json()
        const ipfsHash = data.IpfsHash;
        const fileUrl = `${PINATA_GATEWAY}/ipfs/${ipfsHash}`;
        setImageFile(file);
        setImagePreview(fileUrl);
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Call the createToken function with the required arguments
      let response = await createToken(
        formData.name,
        formData.symbol,
        imagePreview || "",  // icon_uri
        formData.projectUrl, // project_uri
        DECIMAL * parseFloat(formData.initialLiquidity), // initial_liquidity as number
        formData.supply,
        formData.description,
        formData.telegram || null,
        formData.twitter || null,
        formData.discord || null
      )

      response && setIsSuccess(true);
    } catch (error) {
      console.error("Error creating token:", error)
    } finally {
      setIsCreating(false)

    }
  }

  const closeModal = () => {
    // This function would be defined in the parent component
    // We'll just reset the form for now
    setFormData({
      name: "",
      symbol: "",
      projectUrl: "",
      description: "",
      twitter: "",
      discord: "",
      telegram: "",
      supply: "",
      initialLiquidity: "",
    })
    setImageFile(null)
    setImagePreview(null)
    setStep(1)
    setIsSuccess(false)
    onClose()
  }

  return (
    <div className="p-4 ">
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
                <div className="flex w-full gap-4">
                  <div className="w-full">
                    <Label htmlFor="name">Token Name*</Label>
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

                  <div className="w-full">
                    <Label htmlFor="symbol">Token Symbol*</Label>
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
                </div>

                <div>
                  <Label htmlFor="projectUrl">Project URL</Label>
                  <Input
                    id="projectUrl"
                    name="projectUrl"
                    placeholder="https://yourproject.com"
                    value={formData.projectUrl}
                    onChange={handleChange}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description*</Label>
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

                {/* Collapsible Social Media Section */}
                <div className="border border-white/10 rounded-lg p-3">
                  <button
                    type="button"
                    onClick={() => setShowSocials(!showSocials)}
                    className="flex justify-between items-center w-full text-left"
                  >
                    <span className="font-medium">Social Media Links (Optional)</span>
                    {showSocials ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>

                  {showSocials && (
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-4">
                        <div className="w-full">
                          <Label htmlFor="twitter">Twitter</Label>
                          <Input
                            id="twitter"
                            name="twitter"
                            placeholder="@username"
                            value={formData.twitter}
                            onChange={handleChange}
                            className="bg-white/5 border-white/10"
                          />
                        </div>

                        <div className="w-full">
                          <Label htmlFor="discord">Discord</Label>
                          <Input
                            id="discord"
                            name="discord"
                            placeholder="https://discord.gg/..."
                            value={formData.discord}
                            onChange={handleChange}
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="telegram">Telegram</Label>
                        <Input
                          id="telegram"
                          name="telegram"
                          placeholder="https://t.me/..."
                          value={formData.telegram}
                          onChange={handleChange}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                  )}
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
                  <Label htmlFor="supply">Total Supply*</Label>
                  <Input
                    id="supply"
                    name="supply"
                    type="text"
                    placeholder="e.g. 1000000"
                    value={formData.supply}
                    onChange={handleChange}
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div>
                  <Label htmlFor="initialLiquidity">Initial Liquidity*</Label>
                  <Input
                    id="initialLiquidity"
                    name="initialLiquidity"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5.0"
                    value={formData.initialLiquidity}
                    onChange={handleChange}
                    required
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-gray-400 mt-1">Amount in MOVE to create initial liquidity pool</p>
                </div>

                <div>
                  <Label htmlFor="image">Token Image*</Label>
                  <div className="mt-1 flex items-center gap-4">
                    <label className="block flex-1">
                      <span className="sr-only">Choose token image</span>
                      <Input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        required
                        className="block w-full text-sm text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-purple-500 file:text-white
                          hover:file:bg-purple-600
                          cursor-pointer bg-white/5 border-white/10"
                      />
                    </label>

                    {imagePreview && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20">
                        <img
                          src={imagePreview}
                          alt="Token preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
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
            onClick={closeModal}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            View My Token
          </Button>
        </motion.div>
      )}
    </div>
  )
}
