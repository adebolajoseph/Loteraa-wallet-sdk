"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import type { TransactionResult } from "@/utils/walletUtils"

export interface WalletState {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  chainId: number | null

  // Balance and portfolio
  ethBalance: string
  lotBalance: string
  portfolioValue: string

  // Provider and signer
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null

  // Transaction state
  transactions: TransactionResult[]
  pendingTransactions: string[]

  // Error handling
  error: string | null

  // Loading states
  isLoadingBalance: boolean
  isSendingTransaction: boolean
}

export type WalletAction =
  | { type: "SET_CONNECTING"; payload: boolean }
  | {
      type: "SET_CONNECTED"
      payload: { address: string; chainId: number; provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner }
    }
  | { type: "SET_DISCONNECTED" }
  | { type: "SET_BALANCE"; payload: { ethBalance: string; lotBalance: string; portfolioValue: string } }
  | { type: "SET_LOADING_BALANCE"; payload: boolean }
  | { type: "SET_SENDING_TRANSACTION"; payload: boolean }
  | { type: "ADD_TRANSACTION"; payload: TransactionResult }
  | {
      type: "UPDATE_TRANSACTION"
      payload: { hash: string; status: "confirmed" | "failed"; gasUsed?: string; blockNumber?: number }
    }
  | { type: "ADD_PENDING_TRANSACTION"; payload: string }
  | { type: "REMOVE_PENDING_TRANSACTION"; payload: string }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CHAIN_ID"; payload: number }

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  chainId: null,
  ethBalance: "0",
  lotBalance: "0",
  portfolioValue: "0",
  provider: null,
  signer: null,
  transactions: [],
  pendingTransactions: [],
  error: null,
  isLoadingBalance: false,
  isSendingTransaction: false,
}

const walletReducer = (state: WalletState, action: WalletAction): WalletState => {
  switch (action.type) {
    case "SET_CONNECTING":
      return { ...state, isConnecting: action.payload, error: null }

    case "SET_CONNECTED":
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        address: action.payload.address,
        chainId: action.payload.chainId,
        provider: action.payload.provider,
        signer: action.payload.signer,
        error: null,
      }

    case "SET_DISCONNECTED":
      return {
        ...initialState,
      }

    case "SET_BALANCE":
      return {
        ...state,
        ethBalance: action.payload.ethBalance,
        lotBalance: action.payload.lotBalance,
        portfolioValue: action.payload.portfolioValue,
        isLoadingBalance: false,
      }

    case "SET_LOADING_BALANCE":
      return { ...state, isLoadingBalance: action.payload }

    case "SET_SENDING_TRANSACTION":
      return { ...state, isSendingTransaction: action.payload }

    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      }

    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.hash === action.payload.hash
            ? {
                ...tx,
                status: action.payload.status,
                gasUsed: action.payload.gasUsed,
                blockNumber: action.payload.blockNumber,
              }
            : tx,
        ),
      }

    case "ADD_PENDING_TRANSACTION":
      return {
        ...state,
        pendingTransactions: [...state.pendingTransactions, action.payload],
      }

    case "REMOVE_PENDING_TRANSACTION":
      return {
        ...state,
        pendingTransactions: state.pendingTransactions.filter((hash) => hash !== action.payload),
      }

    case "SET_ERROR":
      return { ...state, error: action.payload }

    case "SET_CHAIN_ID":
      return { ...state, chainId: action.payload }

    default:
      return state
  }
}

export interface WalletContextType {
  state: WalletState
  dispatch: React.Dispatch<WalletAction>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export interface WalletProviderProps {
  children: ReactNode
}

const WalletProviderComponent: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState)

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          dispatch({ type: "SET_DISCONNECTED" })
        } else if (accounts[0] !== state.address) {
          // Account changed, reconnect
          window.location.reload()
        }
      }

      const handleChainChanged = (chainId: string) => {
        const newChainId = Number.parseInt(chainId, 16)
        dispatch({ type: "SET_CHAIN_ID", payload: newChainId })
      }

      const handleDisconnect = () => {
        dispatch({ type: "SET_DISCONNECTED" })
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("disconnect", handleDisconnect)

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
          window.ethereum.removeListener("chainChanged", handleChainChanged)
          window.ethereum.removeListener("disconnect", handleDisconnect)
        }
      }
    }
  }, [state.address])

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        // Check if we're in an iframe
        const isInIframe = window.self !== window.top
        if (isInIframe) {
          console.warn("Auto-connect disabled in iframe for security reasons")
          return
        }

        try {
          // Prioritize MetaMask for auto-connect
          let provider = window.ethereum
          if (window.ethereum.providers) {
            const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask)
            if (metaMaskProvider) {
              provider = metaMaskProvider
            }
          }

          const accounts = await provider.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
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
          }
        } catch (error) {
          console.error("Auto-connect failed:", error)
        }
      }
    }

    autoConnect()
  }, [])

  const value: WalletContextType = {
    state,
    dispatch,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export const WalletProvider = WalletProviderComponent

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider")
  }
  return context
}
