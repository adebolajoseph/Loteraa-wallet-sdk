"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import type { TransactionResult } from "@/utils/walletUtils"

export interface SessionState {
  isActive: boolean
  isConnecting: boolean
  account: string | null
  chain: number | null
  eth: string
  lot: string
  totalValue: string
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  txs: TransactionResult[]
  pending: string[]
  error: string | null
  loadingBalance: boolean
  sending: boolean
}

export type SessionAction =
  | { type: "CONNECTING"; payload: boolean }
  | { type: "CONNECTED"; payload: { account: string; chain: number; provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner } }
  | { type: "DISCONNECTED" }
  | { type: "BALANCE"; payload: { eth: string; lot: string; totalValue: string } }
  | { type: "LOADING_BALANCE"; payload: boolean }
  | { type: "SENDING"; payload: boolean }
  | { type: "ADD_TX"; payload: TransactionResult }
  | { type: "UPDATE_TX"; payload: { hash: string; status: "confirmed" | "failed"; gasUsed?: string; blockNumber?: number } }
  | { type: "ADD_PENDING"; payload: string }
  | { type: "REMOVE_PENDING"; payload: string }
  | { type: "ERROR"; payload: string | null }
  | { type: "CHAIN"; payload: number }

const defaultState: SessionState = {
  isActive: false,
  isConnecting: false,
  account: null,
  chain: null,
  eth: "0",
  lot: "0",
  totalValue: "0",
  provider: null,
  signer: null,
  txs: [],
  pending: [],
  error: null,
  loadingBalance: false,
  sending: false,
}

const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case "CONNECTING":
      return { ...state, isConnecting: action.payload, error: null }
    case "CONNECTED":
      return {
        ...state,
        isActive: true,
        isConnecting: false,
        account: action.payload.account,
        chain: action.payload.chain,
        provider: action.payload.provider,
        signer: action.payload.signer,
        error: null,
      }
    case "DISCONNECTED":
      return { ...defaultState }
    case "BALANCE":
      return {
        ...state,
        eth: action.payload.eth,
        lot: action.payload.lot,
        totalValue: action.payload.totalValue,
        loadingBalance: false,
      }
    case "LOADING_BALANCE":
      return { ...state, loadingBalance: action.payload }
    case "SENDING":
      return { ...state, sending: action.payload }
    case "ADD_TX":
      return { ...state, txs: [action.payload, ...state.txs] }
    case "UPDATE_TX":
      return {
        ...state,
        txs: state.txs.map((t) =>
          t.hash === action.payload.hash
            ? { ...t, status: action.payload.status, gasUsed: action.payload.gasUsed, blockNumber: action.payload.blockNumber }
            : t,
        ),
      }
    case "ADD_PENDING":
      return { ...state, pending: [...state.pending, action.payload] }
    case "REMOVE_PENDING":
      return { ...state, pending: state.pending.filter((h) => h !== action.payload) }
    case "ERROR":
      return { ...state, error: action.payload }
    case "CHAIN":
      return { ...state, chain: action.payload }
    default:
      return state
  }
}

export interface SessionContextType {
  state: SessionState
  dispatch: React.Dispatch<SessionAction>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export interface SessionProviderProps {
  children: ReactNode
}

const ProviderComponent: React.FC<SessionProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, defaultState)

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const onAccounts = (accounts: string[]) => {
        if (accounts.length === 0) {
          dispatch({ type: "DISCONNECTED" })
        } else if (accounts[0] !== state.account) {
          window.location.reload()
        }
      }
      const onChain = (chainId: string) => {
        dispatch({ type: "CHAIN", payload: Number.parseInt(chainId, 16) })
      }
      const onDisconnect = () => dispatch({ type: "DISCONNECTED" })

      window.ethereum.on("accountsChanged", onAccounts)
      window.ethereum.on("chainChanged", onChain)
      window.ethereum.on("disconnect", onDisconnect)

      return () => {
        window.ethereum.removeListener("accountsChanged", onAccounts)
        window.ethereum.removeListener("chainChanged", onChain)
        window.ethereum.removeListener("disconnect", onDisconnect)
      }
    }
  }, [state.account])

  useEffect(() => {
    const auto = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        if (window.self !== window.top) return
        try {
          let provider = window.ethereum
          if (window.ethereum.providers) {
            const mm = window.ethereum.providers.find((p: any) => p.isMetaMask)
            if (mm) provider = mm
          }
          const accounts = await provider.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            const ethersProvider = new ethers.BrowserProvider(provider)
            const signer = await ethersProvider.getSigner()
            const net = await ethersProvider.getNetwork()
            dispatch({
              type: "CONNECTED",
              payload: { account: accounts[0], chain: Number(net.chainId), provider: ethersProvider, signer },
            })
          }
        } catch {}
      }
    }
    auto()
  }, [])

  const value: SessionContextType = { state, dispatch }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const SessionProvider = ProviderComponent

export const useSession = (): SessionContextType => {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be inside a SessionProvider")
  return ctx
}
