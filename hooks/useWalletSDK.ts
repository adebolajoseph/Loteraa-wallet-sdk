"use client"

import { useCallback, useEffect } from "react"
import { ethers } from "ethers"
import { useWalletContext } from "@/context/WalletContext"
import {
  detectProviders,
  isValidAddress,
  generateWallet,
  estimateGas,
  weiToEth,
  ethToWei,
  WalletError,
  isMetaMaskAvailable,
  getPreferredProvider,
  type TransactionResult,
} from "@/utils/walletUtils"

export interface TxParams {
  to: string
  amount: string
  currency: "ETH" | "LOT"
  gasLimit?: string
}

export interface WalletInitResult {
  address: string
  privateKey: string
  mnemonic: string
  warning: string
}

export interface LoteraHook {
  connect: () => Promise<void>
  disconnect: () => void
  createWallet: () => WalletInitResult

  loadBalance: () => Promise<void>
  ethBalance: () => string
  lotBalance: () => string
  portfolioValue: () => string

  transfer: (params: TxParams) => Promise<string>
  estimateGasCost: (params: TxParams) => Promise<string>
  history: () => TransactionResult[]

  providers: () => any[]
  hasMetaMask: () => boolean

  connected: () => boolean
  connecting: () => boolean
  walletAddress: () => string | null
  chain: () => number | null
  error: () => string | null
  loadingBalance: () => boolean
  sendingTx: () => boolean

  checkAddress: (address: string) => boolean
  format: (balance: string) => string
  network: () => string
}

export const useLotera = (): LoteraHook => {
  const { state, dispatch } = useWalletContext()

  const connect = useCallback(async () => {
    try {
      dispatch({ type: "SET_CONNECTING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })

      if (typeof window !== "undefined" && window.self !== window.top) {
        throw new WalletError("Wallet not allowed in iframe", "IFRAME_BLOCKED")
      }

      const provider = getPreferredProvider()
      if (!provider) {
        throw new WalletError("No wallet detected", "NO_WALLET")
      }

      if ((provider as any).isTrust) {
        console.warn("Trust Wallet detected, MetaMask recommended")
      }

      const accounts = await provider.request({ method: "eth_requestAccounts" })
      if (!accounts.length) {
        throw new WalletError("No accounts available", "NO_ACCOUNTS")
      }

      const ethersProvider = new ethers.BrowserProvider(provider)
      const signer = await ethersProvider.getSigner()
      const network = await ethersProvider.getNetwork()

      dispatch({
        type: "SET_CONNECTED",
        payload: {
          address: accounts[0],
          chainId: Number(network.chainId),
          provider: ethersProvider,
          signer,
        },
      })
    } catch (err: any) {
      let msg = "Failed to connect"
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        dispatch({ type: "SET_CONNECTING", payload: false })
        return
      } else if (err instanceof WalletError) {
        msg = err.message
      } else if (err.message?.includes("frame")) {
        msg = "Wallet blocked in embedded frame"
      } else if (err.message) {
        msg = err.message
      }
      dispatch({ type: "SET_ERROR", payload: msg })
      dispatch({ type: "SET_CONNECTING", payload: false })
    }
  }, [dispatch])

  const disconnect = useCallback(() => {
    dispatch({ type: "SET_DISCONNECTED" })
  }, [dispatch])

  const createWallet = useCallback((): WalletInitResult => {
    const wallet = generateWallet()
    return {
      ...wallet,
      warning: "Keep your keys and mnemonic safe. Losing them means losing access permanently.",
    }
  }, [])

  const loadBalance = useCallback(async () => {
    if (!state.provider || !state.address) return
    try {
      dispatch({ type: "SET_LOADING_BALANCE", payload: true })
      const bal = await state.provider.getBalance(state.address)
      const ethBal = weiToEth(bal.toString())
      const lotBal = "0"
      const ethPrice = 2000
      const value = (Number.parseFloat(ethBal) * ethPrice).toFixed(2)
      dispatch({
        type: "SET_BALANCE",
        payload: { ethBalance: ethBal, lotBalance: lotBal, portfolioValue: value },
      })
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Failed to load balance" })
      dispatch({ type: "SET_LOADING_BALANCE", payload: false })
    }
  }, [state.provider, state.address, dispatch])

  const transfer = useCallback(
    async (params: TxParams) => {
      if (!state.signer || !state.provider) {
        throw new WalletError("Not connected", "NOT_CONNECTED")
      }
      if (!isValidAddress(params.to)) {
        throw new WalletError("Invalid address", "INVALID_ADDRESS")
      }
      try {
        dispatch({ type: "SET_SENDING_TRANSACTION", payload: true })
        dispatch({ type: "SET_ERROR", payload: null })
        const value = ethToWei(params.amount)
        const balance = await state.provider.getBalance(state.address!)
        if (balance < BigInt(value)) {
          throw new WalletError("Insufficient funds", "INSUFFICIENT_FUNDS")
        }
        const gasEstimate = await estimateGas(state.provider, { to: params.to, value })
        const tx = await state.signer.sendTransaction({
          to: params.to,
          value,
          gasLimit: params.gasLimit || gasEstimate,
        })
        dispatch({ type: "ADD_PENDING_TRANSACTION", payload: tx.hash })
        const record: TransactionResult = { hash: tx.hash, status: "pending" }
        dispatch({ type: "ADD_TRANSACTION", payload: record })
        tx.wait()
          .then((receipt) => {
            dispatch({ type: "REMOVE_PENDING_TRANSACTION", payload: tx.hash })
            dispatch({
              type: "UPDATE_TRANSACTION",
              payload: {
                hash: tx.hash,
                status: receipt?.status === 1 ? "confirmed" : "failed",
                gasUsed: receipt?.gasUsed.toString(),
                blockNumber: receipt?.blockNumber,
              },
            })
            if (receipt?.status === 1) {
              loadBalance()
            }
          })
          .catch(() => {
            dispatch({ type: "REMOVE_PENDING_TRANSACTION", payload: tx.hash })
            dispatch({
              type: "UPDATE_TRANSACTION",
              payload: { hash: tx.hash, status: "failed" },
            })
          })
        return tx.hash
      } catch (err: any) {
        let msg = "Transaction failed"
        if (err instanceof WalletError) {
          msg = err.message
        } else if (err.code === 4001) {
          msg = "User rejected transaction"
        } else if (err.message) {
          msg = err.message
        }
        dispatch({ type: "SET_ERROR", payload: msg })
        throw new WalletError(msg, "TRANSACTION_FAILED", err)
      } finally {
        dispatch({ type: "SET_SENDING_TRANSACTION", payload: false })
      }
    },
    [state.signer, state.provider, state.address, dispatch, loadBalance],
  )

  const estimateGasCost = useCallback(
    async (params: TxParams): Promise<string> => {
      if (!state.provider) throw new WalletError("Not connected", "NOT_CONNECTED")
      const value = ethToWei(params.amount)
      return await estimateGas(state.provider, { to: params.to, value })
    },
    [state.provider],
  )

  useEffect(() => {
    if (state.isConnected && state.address) {
      loadBalance()
    }
  }, [state.isConnected, state.address, loadBalance])

  return {
    connect,
    disconnect,
    createWallet,
    loadBalance,
    ethBalance: () => state.ethBalance,
    lotBalance: () => state.lotBalance,
    portfolioValue: () => state.portfolioValue,
    transfer,
    estimateGasCost,
    history: () => state.transactions,
    providers: detectProviders,
    hasMetaMask: isMetaMaskAvailable,
    connected: () => state.isConnected,
    connecting: () => state.isConnecting,
    walletAddress: () => state.address,
    chain: () => state.chainId,
    error: () => state.error,
    loadingBalance: () => state.isLoadingBalance,
    sendingTx: () => state.isSendingTransaction,
    checkAddress: isValidAddress,
    format: (bal: string) => Number.parseFloat(bal).toFixed(4),
    network: () => {
      const nets: Record<number, string> = {
        1: "Ethereum Mainnet",
        5: "Goerli",
        11155111: "Sepolia",
      }
      return nets[state.chainId || 1] || `Chain ID: ${state.chainId}`
    },
  }
}

export default useLotera
