import { ethers } from "ethers"

export interface WalletProvider {
  isMetaMask?: boolean
  isWalletConnect?: boolean
  isTrust?: boolean
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, handler: (...args: any[]) => void) => void
  removeListener: (event: string, handler: (...args: any[]) => void) => void
}

export interface WalletInfo {
  address: string
  balance: string
  chainId: number
  isConnected: boolean
}

export interface TransactionRequest {
  to: string
  value: string
  gasLimit?: string
  gasPrice?: string
  data?: string
}

export interface TransactionResult {
  hash: string
  status: "pending" | "confirmed" | "failed"
  gasUsed?: string
  blockNumber?: number
}

export class WalletError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any,
  ) {
    super(message)
    this.name = "WalletError"
  }
}

// Detect available Ethereum providers
export const detectProviders = (): WalletProvider[] => {
  const providers: WalletProvider[] = []

  if (typeof window !== "undefined") {
    // Check if we're in an iframe (Trust Wallet blocks iframe connections)
    const isInIframe = window.self !== window.top

    // First priority: MetaMask
    if (window.ethereum?.isMetaMask && !isInIframe) {
      providers.push(window.ethereum)
    }

    // Handle multiple providers (like when both MetaMask and Trust Wallet are installed)
    if (window.ethereum?.providers) {
      // Filter out Trust Wallet if in iframe, prioritize MetaMask
      const filteredProviders = window.ethereum.providers.filter((provider: any) => {
        // Skip Trust Wallet if in iframe
        if (isInIframe && provider.isTrust) {
          return false
        }
        // Prioritize MetaMask
        if (provider.isMetaMask) {
          return true
        }
        // Allow other providers if not in iframe
        return !isInIframe
      })

      // Sort to put MetaMask first
      filteredProviders.sort((a: any, b: any) => {
        if (a.isMetaMask && !b.isMetaMask) return -1
        if (!a.isMetaMask && b.isMetaMask) return 1
        return 0
      })

      providers.push(...filteredProviders)
    }

    // Fallback: if no MetaMask found and not in iframe, try the main ethereum provider
    if (providers.length === 0 && window.ethereum && !window.ethereum.isMetaMask && !isInIframe) {
      // Only add if it's not Trust Wallet or if we're not in iframe
      if (!window.ethereum.isTrust || !isInIframe) {
        providers.push(window.ethereum)
      }
    }
  }

  return providers
}

// Validate Ethereum address
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address)
  } catch {
    return false
  }
}

// Format balance for display
export const formatBalance = (balance: string, decimals = 18): string => {
  try {
    return ethers.formatUnits(balance, decimals)
  } catch {
    return "0"
  }
}

// Parse amount to wei
export const parseAmount = (amount: string, decimals = 18): string => {
  try {
    return ethers.parseUnits(amount, decimals).toString()
  } catch {
    throw new WalletError("Invalid amount format", "INVALID_AMOUNT")
  }
}

// Generate new wallet
export const generateWallet = (): { address: string; privateKey: string; mnemonic: string } => {
  const wallet = ethers.Wallet.createRandom()
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || "",
  }
}

// Estimate gas for transaction
export const estimateGas = async (provider: ethers.Provider, transaction: TransactionRequest): Promise<string> => {
  try {
    const gasEstimate = await provider.estimateGas({
      to: transaction.to,
      value: transaction.value,
      data: transaction.data,
    })
    return gasEstimate.toString()
  } catch (error) {
    throw new WalletError("Gas estimation failed", "GAS_ESTIMATION_FAILED", error)
  }
}

// Get current gas price
export const getGasPrice = async (provider: ethers.Provider): Promise<string> => {
  try {
    const feeData = await provider.getFeeData()
    return feeData.gasPrice?.toString() || "0"
  } catch (error) {
    throw new WalletError("Failed to get gas price", "GAS_PRICE_FAILED", error)
  }
}

// Format transaction hash for display
export const formatTxHash = (hash: string, length = 10): string => {
  if (hash.length <= length) return hash
  return `${hash.slice(0, length / 2)}...${hash.slice(-length / 2)}`
}

// Convert wei to ETH
export const weiToEth = (wei: string): string => {
  return ethers.formatEther(wei)
}

// Convert ETH to wei
export const ethToWei = (eth: string): string => {
  return ethers.parseEther(eth).toString()
}

// Get network name from chain ID
export const getNetworkName = (chainId: number): string => {
  const networks: Record<number, string> = {
    1: "Ethereum Mainnet",
    5: "Goerli Testnet",
    11155111: "Sepolia Testnet",
    137: "Polygon Mainnet",
    80001: "Polygon Mumbai",
    56: "BSC Mainnet",
    97: "BSC Testnet",
  }

  return networks[chainId] || `Chain ID: ${chainId}`
}

// Check if transaction is pending
export const isTransactionPending = (status: string): boolean => {
  return status === "pending"
}

// Validate private key
export const isValidPrivateKey = (privateKey: string): boolean => {
  try {
    new ethers.Wallet(privateKey)
    return true
  } catch {
    return false
  }
}

// Create wallet from private key
export const createWalletFromPrivateKey = (privateKey: string): ethers.Wallet => {
  try {
    return new ethers.Wallet(privateKey)
  } catch (error) {
    throw new WalletError("Invalid private key", "INVALID_PRIVATE_KEY", error)
  }
}

export const isMetaMaskAvailable = (): boolean => {
  if (typeof window === "undefined") return false

  // Check if we're in iframe
  const isInIframe = window.self !== window.top
  if (isInIframe) return false

  // Check for MetaMask specifically
  if (window.ethereum?.isMetaMask) return true

  // Check in providers array
  if (window.ethereum?.providers) {
    return window.ethereum.providers.some((provider: any) => provider.isMetaMask)
  }

  return false
}

export const getPreferredProvider = (): WalletProvider | null => {
  const providers = detectProviders()

  // Return MetaMask if available
  const metaMask = providers.find((p) => p.isMetaMask)
  if (metaMask) return metaMask

  // Return first available provider
  return providers[0] || null
}

declare global {
  interface Window {
    ethereum?: WalletProvider & {
      providers?: WalletProvider[]
      isMetaMask?: boolean
      isTrust?: boolean
    }
  }
}
