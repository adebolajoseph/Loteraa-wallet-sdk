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

export interface SendTransactionParams {
  to: string
  amount: string
  currency: "ETH" | "LOT"
  gasLimit?: string
}

export interface CreateWalletResult {
  address: string
  privateKey: string
  mnemonic: string
  warning: string
}

export interface WalletSDKHook {
  // Connection methods
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  createNewWallet: () => CreateWalletResult

  // Balance methods
  fetchBalance: () => Promise<void>
  getEthBalance: () => string
  getLotBalance: () => string
  getPortfolioValue: () => string

  // Transaction methods
  sendTransaction: (params: SendTransactionParams) => Promise<string>
  estimateTransactionGas: (params: SendTransactionParams) => Promise<string>
  getTransactionHistory: () => TransactionResult[]

  // Provider detection
  getAvailableProviders: () => any[]
  isMetaMaskAvailable: () => boolean

  // State getters
  isConnected: () => boolean
  isConnecting: () => boolean
  getAddress: () => string | null
  getChainId: () => number | null
  getError: () => string | null
  isLoadingBalance: () => boolean
  isSendingTransaction: () => boolean

  // Utility methods
  validateAddress: (address: string) => boolean
  formatBalance: (balance: string) => string
  getNetworkName: () => string
}

export const useWalletSDK = (): WalletSDKHook => {
  const { state, dispatch } = useWalletContext()

  // Connect to wallet
  const connectWallet = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: "SET_CONNECTING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })

      // Check if we're in an iframe
      const isInIframe = typeof window !== "undefined" && window.self !== window.top
      if (isInIframe) {
        throw new WalletError(
          "Wallet connection is not supported in embedded frames. Please open this app in a new tab.",
          "IFRAME_BLOCKED",
        )
      }

      // Get preferred provider (MetaMask first)
      const provider = getPreferredProvider()

      if (!provider) {
        throw new WalletError(
          "No compatible Ethereum wallet found. Please install MetaMask or another Web3 wallet.",
          "NO_WALLET",
        )
      }

      // Check if it's Trust Wallet and warn user
      if ((provider as any).isTrust) {
        console.warn("Trust Wallet detected. For best experience, please use MetaMask.")
      }

      const accounts = await provider.request({ method: "eth_requestAccounts" })

      if (accounts.length === 0) {
        throw new WalletError("No accounts found", "NO_ACCOUNTS")
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
    } catch (error: any) {
      let errorMessage = "Failed to connect wallet"

      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        // User rejected - don't show error, just stop connecting
        dispatch({ type: "SET_CONNECTING", payload: false })
        return
      } else if (error instanceof WalletError) {
        errorMessage = error.message
      } else if (error.message?.includes("frame")) {
        errorMessage = "Wallet connection blocked. Please open this app in a new tab instead of an embedded frame."
      } else if (error.message) {
        errorMessage = error.message
      }

      dispatch({ type: "SET_ERROR", payload: errorMessage })
      dispatch({ type: "SET_CONNECTING", payload: false })
    }
  }, [dispatch])

  // Disconnect wallet
  const disconnectWallet = useCallback((): void => {
    dispatch({ type: "SET_DISCONNECTED" })
  }, [dispatch])

  // Create new wallet
  const createNewWallet = useCallback((): CreateWalletResult => {
    const wallet = generateWallet()
    return {
      ...wallet,
      warning:
        "WARNING: Store your private key and mnemonic phrase securely. Never share them with anyone. Loss of these credentials means permanent loss of access to your wallet.",
    }
  }, [])

  // Fetch balances
  const fetchBalance = useCallback(async (): Promise<void> => {
    if (!state.provider || !state.address) return

    try {
      dispatch({ type: "SET_LOADING_BALANCE", payload: true })

      const balance = await state.provider.getBalance(state.address)
      const ethBalance = weiToEth(balance.toString())

      // Mock LOT balance for now (would need ERC-20 contract integration)
      const lotBalance = "0"

      // Mock portfolio value calculation (would integrate with price APIs)
      const ethPrice = 2000 // Mock ETH price
      const portfolioValue = (Number.parseFloat(ethBalance) * ethPrice).toFixed(2)

      dispatch({
        type: "SET_BALANCE",
        payload: {
          ethBalance,
          lotBalance,
          portfolioValue,
        },
      })
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch balance" })
      dispatch({ type: "SET_LOADING_BALANCE", payload: false })
    }
  }, [state.provider, state.address, dispatch])

  // Send transaction
  const sendTransaction = useCallback(
    async (params: SendTransactionParams): Promise<string> => {
      if (!state.signer || !state.provider) {
        throw new WalletError("Wallet not connected", "NOT_CONNECTED")
      }

      if (!isValidAddress(params.to)) {
        throw new WalletError("Invalid recipient address", "INVALID_ADDRESS")
      }

      try {
        dispatch({ type: "SET_SENDING_TRANSACTION", payload: true })
        dispatch({ type: "SET_ERROR", payload: null })

        const value = ethToWei(params.amount)

        // Check balance
        const balance = await state.provider.getBalance(state.address!)
        if (balance < BigInt(value)) {
          throw new WalletError("Insufficient balance", "INSUFFICIENT_FUNDS")
        }

        // Estimate gas
        const gasEstimate = await estimateGas(state.provider, {
          to: params.to,
          value,
        })

        // Send transaction
        const tx = await state.signer.sendTransaction({
          to: params.to,
          value,
          gasLimit: params.gasLimit || gasEstimate,
        })

        // Add to pending transactions
        dispatch({ type: "ADD_PENDING_TRANSACTION", payload: tx.hash })

        // Add to transaction history
        const transaction: TransactionResult = {
          hash: tx.hash,
          status: "pending",
        }
        dispatch({ type: "ADD_TRANSACTION", payload: transaction })

        // Wait for confirmation
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

            // Refresh balance after successful transaction
            if (receipt?.status === 1) {
              fetchBalance()
            }
          })
          .catch((error) => {
            dispatch({ type: "REMOVE_PENDING_TRANSACTION", payload: tx.hash })
            dispatch({
              type: "UPDATE_TRANSACTION",
              payload: {
                hash: tx.hash,
                status: "failed",
              },
            })
          })

        return tx.hash
      } catch (error: any) {
        let errorMessage = "Transaction failed"

        if (error instanceof WalletError) {
          errorMessage = error.message
        } else if (error.code === 4001) {
          errorMessage = "Transaction rejected by user"
        } else if (error.message) {
          errorMessage = error.message
        }

        dispatch({ type: "SET_ERROR", payload: errorMessage })
        throw new WalletError(errorMessage, "TRANSACTION_FAILED", error)
      } finally {
        dispatch({ type: "SET_SENDING_TRANSACTION", payload: false })
      }
    },
    [state.signer, state.provider, state.address, dispatch, fetchBalance],
  )

  // Estimate transaction gas
  const estimateTransactionGas = useCallback(
    async (params: SendTransactionParams): Promise<string> => {
      if (!state.provider) {
        throw new WalletError("Wallet not connected", "NOT_CONNECTED")
      }

      const value = ethToWei(params.amount)
      return await estimateGas(state.provider, {
        to: params.to,
        value,
      })
    },
    [state.provider],
  )

  // Auto-fetch balance when connected
  useEffect(() => {
    if (state.isConnected && state.address) {
      fetchBalance()
    }
  }, [state.isConnected, state.address, fetchBalance])

  // Return SDK interface
  return {
    // Connection methods
    connectWallet,
    disconnectWallet,
    createNewWallet,

    // Balance methods
    fetchBalance,
    getEthBalance: () => state.ethBalance,
    getLotBalance: () => state.lotBalance,
    getPortfolioValue: () => state.portfolioValue,

    // Transaction methods
    sendTransaction,
    estimateTransactionGas,
    getTransactionHistory: () => state.transactions,

    // Provider detection
    getAvailableProviders: detectProviders,
    isMetaMaskAvailable,

    // State getters
    isConnected: () => state.isConnected,
    isConnecting: () => state.isConnecting,
    getAddress: () => state.address,
    getChainId: () => state.chainId,
    getError: () => state.error,
    isLoadingBalance: () => state.isLoadingBalance,
    isSendingTransaction: () => state.isSendingTransaction,

    // Utility methods
    validateAddress: isValidAddress,
    formatBalance: (balance: string) => Number.parseFloat(balance).toFixed(4),
    getNetworkName: () => {
      const networks: Record<number, string> = {
        1: "Ethereum Mainnet",
        5: "Goerli Testnet",
        11155111: "Sepolia Testnet",
      }
      return networks[state.chainId || 1] || `Chain ID: ${state.chainId}`
    },
  }
}

export default useWalletSDK
