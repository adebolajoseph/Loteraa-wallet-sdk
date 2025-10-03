"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ArrowUp,
  ArrowDown,
  Plus,
  TrendingUp,
  Eye,
  EyeOff,
  MoreVertical,
  Send,
  Download,
  Coins,
  CreditCard,
  Copy,
  QrCode,
  Wallet,
  LogOut,
} from "lucide-react"
import Image from "next/image"
import { ethers } from "ethers"

interface Transaction {
  id: string
  type: "send" | "receive" | "stake" | "buy"
  currency: "ETH" | "LOT"
  amount: string
  address: string
  timestamp: string
  status: "completed" | "pending" | "failed"
  hash?: string
}

export function WalletInterface() {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<"ETH" | "LOT">("ETH")
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string>("")
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [ethBalance, setEthBalance] = useState("0.0000")
  const [lotBalance, setLotBalance] = useState("0")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [sendForm, setSendForm] = useState({
    recipient: "",
    amount: "",
    currency: "ETH" as "ETH" | "LOT",
  })

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()

        if (accounts.length > 0) {
          setProvider(provider)
          setAccount(accounts[0].address)
          setIsConnected(true)
          await fetchBalances(provider, accounts[0].address)
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        setIsLoading(true)
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()

        setProvider(provider)
        setAccount(address)
        setIsConnected(true)
        await fetchBalances(provider, address)
      } catch (error: any) {
        if (error.code === 4001 || error.code === "ACTION_REJECTED") {
          // User rejected the connection request - this is normal behavior
          console.log("[v0] User declined wallet connection")
          // Don't show an error alert for user rejection - it's expected behavior
        } else if (error.code === -32002) {
          // Request already pending
          console.error("Connection request already pending:", error)
          alert("Connection request already pending. Please check your wallet.")
        } else if (error.message?.includes("User rejected")) {
          // Another way user rejection might be reported
          console.log("[v0] User declined wallet connection (alternative format)")
        } else {
          // Other unexpected errors
          console.error("Unexpected wallet connection error:", error)
          alert("Failed to connect wallet. Please try again.")
        }
      } finally {
        setIsLoading(false)
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet to use this feature.")
    }
  }

  const fetchBalances = async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const balance = await provider.getBalance(address)
      const ethBalanceFormatted = Number.parseFloat(ethers.formatEther(balance)).toFixed(4)
      setEthBalance(ethBalanceFormatted)

      setLotBalance("0")
    } catch (error) {
      console.error("Error fetching balances:", error)
    }
  }

  const currencies = {
    ETH: {
      name: "Ethereum",
      symbol: "ETH",
      balance: ethBalance,
      usdValue: `$${(Number.parseFloat(ethBalance) * 2000).toFixed(2)}`,
      change: "+2.5%",
      changePositive: true,
      color: "bg-blue-500",
    },
    LOT: {
      name: "Loteraa Token",
      symbol: "LOT",
      balance: lotBalance,
      usdValue: `$${(Number.parseFloat(lotBalance) * 0.1).toFixed(2)}`,
      change: "+5.2%",
      changePositive: true,
      color: "bg-purple-500",
    },
  }

  const currentCurrency = currencies[selectedCurrency]
  const totalPortfolioValue = Object.values(currencies).reduce((total, currency) => {
    return total + Number.parseFloat(currency.usdValue.replace("$", ""))
  }, 0)

  const handleSend = () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }
    setSendModalOpen(true)
  }

  const handleReceive = () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }
    setReceiveModalOpen(true)
  }

  const handleBuy = () => {
    setBuyModalOpen(true)
  }

  const handleSendSubmit = async () => {
    if (!provider || !account) {
      alert("Wallet not connected")
      return
    }

    if (!sendForm.recipient || !sendForm.amount) {
      alert("Please fill in all fields")
      return
    }

    try {
      setIsLoading(true)
      const signer = await provider.getSigner()

      if (sendForm.currency === "ETH") {
        const tx = await signer.sendTransaction({
          to: sendForm.recipient,
          value: ethers.parseEther(sendForm.amount),
        })

        const newTransaction: Transaction = {
          id: tx.hash,
          type: "send",
          currency: "ETH",
          amount: sendForm.amount,
          address: sendForm.recipient,
          timestamp: new Date().toLocaleString(),
          status: "pending",
          hash: tx.hash,
        }

        setTransactions((prev) => [newTransaction, ...prev])

        await tx.wait()

        setTransactions((prev) => prev.map((t) => (t.id === tx.hash ? { ...t, status: "completed" as const } : t)))

        await fetchBalances(provider, account)

        alert(`Transaction sent! Hash: ${tx.hash}`)
      } else {
        alert("LOT token sending not implemented yet. Please use ETH.")
      }

      setSendModalOpen(false)
      setSendForm({ recipient: "", amount: "", currency: "ETH" })
    } catch (error: any) {
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        // User rejected the transaction - this is normal behavior
        console.log("[v0] User declined transaction")
        // Don't show error for user rejection
      } else if (error.reason === "insufficient funds") {
        console.error("Insufficient funds error:", error)
        alert("Insufficient funds for this transaction.")
      } else if (error.reason === "invalid address") {
        console.error("Invalid address error:", error)
        alert("Invalid recipient address. Please check and try again.")
      } else {
        console.error("Transaction error:", error)
        alert("Transaction failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      alert("Address copied to clipboard!")
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAccount("")
    setProvider(null)
    setEthBalance("0.0000")
    setLotBalance("0")
    setTransactions([])
    console.log("[v0] Wallet disconnected")
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Loteraa Wallet</h1>
            <p className="text-gray-400 mb-6">Connect your Web3 wallet to get started</p>
            <Button
              onClick={connectWallet}
              disabled={isLoading}
              className="bg-white text-black hover:bg-gray-200 px-8 py-3"
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
          <p className="text-xs text-gray-500">Make sure you have MetaMask or another Web3 wallet installed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-4 py-6 border-b border-border/50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-balance text-white">Loteraa Wallet</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-400">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 p-2">
                  <MoreVertical className="w-5 h-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gray-900 border-gray-700 text-white min-w-[140px] z-[9999] shadow-xl"
                sideOffset={8}
                style={{
                  position: "fixed",
                  zIndex: 9999,
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                  padding: "4px",
                }}
              >
                <DropdownMenuItem
                  onClick={disconnectWallet}
                  className="text-white hover:bg-gray-800 cursor-pointer focus:bg-gray-800 focus:text-white px-3 py-2 rounded-sm"
                  style={{
                    backgroundColor: "transparent",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#374151"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Total Portfolio</span>
            <Button variant="ghost" size="sm" onClick={() => setBalanceVisible(!balanceVisible)}>
              {balanceVisible ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
            </Button>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-balance text-white">
              {balanceVisible ? `$${totalPortfolioValue.toFixed(2)}` : "••••••"}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2.8%
              </Badge>
              <span className="text-sm text-gray-400">24h</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-4 gap-3">
          <Button className="flex-col gap-2 h-auto py-4 bg-white text-black hover:bg-gray-200" onClick={handleSend}>
            <Send className="w-5 h-5" />
            <span className="text-xs">Send</span>
          </Button>
          <Button
            className="flex-col gap-2 h-auto py-4 bg-transparent border-white text-white hover:bg-white/10"
            variant="outline"
            onClick={handleReceive}
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">Receive</span>
          </Button>
          <Button
            className="flex-col gap-2 h-auto py-4 bg-transparent border-white text-white hover:bg-white/10"
            variant="outline"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Stake</span>
          </Button>
          <Button
            className="flex-col gap-2 h-auto py-4 bg-transparent border-white text-white hover:bg-white/10"
            variant="outline"
            onClick={handleBuy}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">Buy</span>
          </Button>
        </div>

        <div className="space-y-3">
          {Object.entries(currencies).map(([key, currency]) => (
            <Card
              key={key}
              className="p-4 bg-card/50 backdrop-blur-sm border-border/50 cursor-pointer hover:bg-card/70 transition-colors"
              onClick={() => setSelectedCurrency(key as "ETH" | "LOT")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                    {key === "ETH" ? (
                      <Image
                        src="/images/eth-icon.png"
                        alt="Ethereum"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src="/images/lot-icon.jpg"
                        alt="Loteraa Token"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {currency.balance} {currency.symbol}
                    </div>
                    <div className="text-sm text-gray-400">{currency.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">{currency.usdValue}</div>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    {currency.change}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Activity</h3>
            <Button variant="ghost" size="sm" className="text-xs text-white">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <Coins className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">No transactions yet</p>
                <p className="text-gray-500 text-xs mt-1">Your transaction history will appear here</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === "send"
                          ? "bg-destructive/10"
                          : transaction.type === "receive"
                            ? "bg-success/10"
                            : transaction.type === "stake"
                              ? "bg-warning/10"
                              : "bg-accent/10"
                      }`}
                    >
                      {transaction.type === "send" && <ArrowUp className="w-4 h-4 text-destructive" />}
                      {transaction.type === "receive" && <ArrowDown className="w-4 h-4 text-success" />}
                      {transaction.type === "stake" && <TrendingUp className="w-4 h-4 text-warning" />}
                      {transaction.type === "buy" && <Plus className="w-4 h-4 text-accent" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm capitalize text-white">
                        {transaction.type} {transaction.currency}
                      </div>
                      <div className="text-xs text-gray-400">
                        {transaction.address.slice(0, 10)}...{transaction.address.slice(-8)} • {transaction.timestamp}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-medium text-sm ${
                        transaction.type === "send" ? "text-destructive" : "text-success"
                      }`}
                    >
                      {transaction.type === "send" ? "-" : "+"}
                      {transaction.amount} {transaction.currency}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        transaction.status === "completed"
                          ? "bg-success/10 text-success"
                          : transaction.status === "pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="bg-black border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Send Crypto</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send cryptocurrency to another wallet address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currency" className="text-white">
                Currency
              </Label>
              <select
                id="currency"
                value={sendForm.currency}
                onChange={(e) => setSendForm({ ...sendForm, currency: e.target.value as "ETH" | "LOT" })}
                className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              >
                <option value="ETH">Ethereum (ETH)</option>
                <option value="LOT">Loteraa Token (LOT)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="recipient" className="text-white">
                Recipient Address
              </Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={sendForm.recipient}
                onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="amount" className="text-white">
                Amount
              </Label>
              <Input
                id="amount"
                placeholder="0.0"
                type="number"
                step="0.0001"
                value={sendForm.amount}
                onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
              />
              <div className="text-xs text-gray-400 mt-1">
                Available: {currencies[sendForm.currency].balance} {sendForm.currency}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSendSubmit}
                disabled={isLoading}
                className="flex-1 bg-white text-black hover:bg-gray-200"
              >
                {isLoading ? "Sending..." : "Send"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSendModalOpen(false)}
                className="flex-1 border-gray-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
        <DialogContent className="bg-black border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Receive Crypto</DialogTitle>
            <DialogDescription className="text-gray-400">
              Share your wallet address to receive cryptocurrency
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
              <QrCode className="w-24 h-24 text-black" />
            </div>
            <div>
              <Label className="text-white">Your Wallet Address</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input value={account} readOnly className="bg-gray-900 border-gray-700 text-white text-sm" />
                <Button onClick={copyAddress} size="sm" variant="outline" className="border-gray-700 bg-transparent">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">Only send ETH and LOT tokens to this address</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={buyModalOpen} onOpenChange={setBuyModalOpen}>
        <DialogContent className="bg-black border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Buy Crypto</DialogTitle>
            <DialogDescription className="text-gray-400">Purchase cryptocurrency with fiat currency</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button className="flex-col gap-2 h-auto py-6 bg-blue-600 hover:bg-blue-700">
                <CreditCard className="w-6 h-6" />
                <span>Credit Card</span>
              </Button>
              <Button className="flex-col gap-2 h-auto py-6 bg-green-600 hover:bg-green-700">
                <Coins className="w-6 h-6" />
                <span>Bank Transfer</span>
              </Button>
            </div>
            <div className="space-y-2">
              <Button className="w-full justify-start bg-gray-900 hover:bg-gray-800 border border-gray-700">
                Buy ETH with USD
              </Button>
              <Button className="w-full justify-start bg-gray-900 hover:bg-gray-800 border border-gray-700">
                Buy LOT with USD
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              You will be redirected to our payment partner to complete the purchase
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
