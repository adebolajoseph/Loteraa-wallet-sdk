"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Copy, Check, Wallet, Send, ArrowDown, Plus, RefreshCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatEther, formatUnits } from "ethers"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWalletContext } from "@/context/walletContext"
import { runTransaction, retrieveBalances } from "@/utils/walletUtils"

export default function WalletInterface() {
  const { state, dispatch } = useWalletContext()
  const [copied, setCopied] = useState(false)
  const [openSend, setOpenSend] = useState(false)
  const [openReceive, setOpenReceive] = useState(false)
  const [openBuy, setOpenBuy] = useState(false)
  const [sendTo, setSendTo] = useState("")
  const [sendAmt, setSendAmt] = useState("")
  const [sending, setSending] = useState(false)

  const initWallet = async () => {
    dispatch({ type: "SET_CONNECTING", payload: true })
    try {
      if (!window.ethereum) throw new Error("No wallet found")
      let provider: any = window.ethereum
      if (window.ethereum.providers) {
        const mm = window.ethereum.providers.find((p: any) => p.isMetaMask)
        if (mm) provider = mm
      }
      await provider.request({ method: "eth_requestAccounts" })
      const ethProv = new ethers.BrowserProvider(provider)
      const signer = await ethProv.getSigner()
      const net = await ethProv.getNetwork()
      const addr = await signer.getAddress()
      dispatch({
        type: "SET_CONNECTED",
        payload: { address: addr, chainId: Number(net.chainId), provider: ethProv, signer }
      })
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e.message })
    } finally {
      dispatch({ type: "SET_CONNECTING", payload: false })
    }
  }

  const disconnect = () => {
    dispatch({ type: "SET_DISCONNECTED" })
  }

  const reloadBalances = async () => {
    if (!state.signer || !state.address) return
    dispatch({ type: "SET_LOADING_BALANCE", payload: true })
    try {
      const { ethBalance, lotBalance, portfolioValue } = await retrieveBalances(state.signer, state.address)
      dispatch({ type: "SET_BALANCE", payload: { ethBalance, lotBalance, portfolioValue } })
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e.message })
    } finally {
      dispatch({ type: "SET_LOADING_BALANCE", payload: false })
    }
  }

  const processSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.signer || !sendTo || !sendAmt) return
    setSending(true)
    try {
      const tx = await runTransaction(state.signer, sendTo, sendAmt)
      dispatch({ type: "ADD_TRANSACTION", payload: tx })
      setOpenSend(false)
      setSendTo("")
      setSendAmt("")
      reloadBalances()
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e.message })
    } finally {
      setSending(false)
    }
  }

  const copyAddr = () => {
    if (!state.address) return
    navigator.clipboard.writeText(state.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  useEffect(() => {
    if (state.isConnected) reloadBalances()
  }, [state.isConnected, state.address, state.chainId])

  if (!state.isConnected) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Button onClick={initWallet} disabled={state.isConnecting}>
          {state.isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 p-4">
      <div className="rounded-2xl border p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Connected Wallet</div>
            <div className="text-sm text-neutral-400">
              {state.address ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={copyAddr}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
            <Button size="sm" variant="destructive" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Portfolio</h2>
          <Button variant="ghost" size="icon" onClick={reloadBalances} disabled={state.isLoadingBalance}>
            <RefreshCcw size={16} className={state.isLoadingBalance ? "animate-spin" : ""} />
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>ETH</span>
            <span>{Number(state.ethBalance).toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span>LOT</span>
            <span>{Number(state.lotBalance).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total Value</span>
            <span>${Number(state.portfolioValue).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Dialog open={openSend} onOpenChange={setOpenSend}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Send size={16} /> Send
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send ETH</DialogTitle>
            </DialogHeader>
            <form onSubmit={processSend} className="space-y-4">
              <Input placeholder="Recipient" value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
              <Input placeholder="Amount (ETH)" value={sendAmt} onChange={(e) => setSendAmt(e.target.value)} />
              <Button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={openReceive} onOpenChange={setOpenReceive}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <ArrowDown size={16} /> Receive
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Receive Assets</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-3">
              <div className="break-all text-sm">{state.address}</div>
              <Button onClick={copyAddr}>{copied ? "Copied" : "Copy"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openBuy} onOpenChange={setOpenBuy}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} /> Buy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buy Assets</DialogTitle>
            </DialogHeader>
            <div className="text-center">Coming soon...</div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-2">Transactions</h2>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {state.transactions.length === 0 && (
            <div className="text-sm text-neutral-400">No transactions yet</div>
          )}
          <AnimatePresence>
            {state.transactions.map((tx) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex justify-between items-center border rounded-lg p-2 text-sm"
              >
                <div className="truncate max-w-[150px]">{tx.hash}</div>
                <div className="capitalize">{tx.status}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
