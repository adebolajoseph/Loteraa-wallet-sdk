import { ethers } from "ethers"

export type WalletProvider = {
  isMetaMask?: boolean
  isWalletConnect?: boolean
  isTrust?: boolean
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, handler: (...args: any[]) => void) => void
  removeListener: (event: string, handler: (...args: any[]) => void) => void
}

export type WalletProfile = {
  address: string
  balance: string
  chainId: number
  isConnected: boolean
}

export type TxRequest = {
  to: string
  value: string
  gasLimit?: string
  gasPrice?: string
  data?: string
}

export type TxResult = {
  hash: string
  status: "pending" | "confirmed" | "failed"
  gasUsed?: string
  blockNumber?: number
}

export class WalletException extends Error {
  code: string
  original?: any
  constructor(msg: string, code: string, original?: any) {
    super(msg)
    this.code = code
    this.original = original
    this.name = "WalletException"
  }
}

export const getAvailableProviders = (): WalletProvider[] => {
  const detected: WalletProvider[] = []
  if (typeof window === "undefined") return detected

  const insideFrame = window.self !== window.top

  if (window.ethereum?.isMetaMask && !insideFrame) {
    detected.push(window.ethereum)
  }

  if (window.ethereum?.providers) {
    const valid = window.ethereum.providers.filter((p: any) => {
      if (insideFrame && p.isTrust) return false
      if (p.isMetaMask) return true
      return !insideFrame
    })

    valid.sort((a: any, b: any) => {
      if (a.isMetaMask && !b.isMetaMask) return -1
      if (!a.isMetaMask && b.isMetaMask) return 1
      return 0
    })

    detected.push(...valid)
  }

  if (
    detected.length === 0 &&
    window.ethereum &&
    !window.ethereum.isMetaMask &&
    (!window.ethereum.isTrust || !insideFrame)
  ) {
    detected.push(window.ethereum)
  }

  return detected
}

export const verifyAddress = (addr: string): boolean => {

export type WalletProvider = {
  isMetaMask?: boolean
  isWalletConnect?: boolean
  isTrust?: boolean
  request: (args: { method: string; params?: any[] }) => Promise<any>
  on: (event: string, handler: (...args: any[]) => void) => void
  removeListener: (event: string, handler: (...args: any[]) => void) => void
}

export type WalletProfile = {
  address: string
  balance: string
  chainId: number
  isConnected: boolean
}

export type TxRequest = {
  to: string
  value: string
  gasLimit?: string
  gasPrice?: string
  data?: string
}

export type TxResult = {
  hash: string
  status: "pending" | "confirmed" | "failed"
  gasUsed?: string
  blockNumber?: number
}

export class WalletException extends Error {
  code: string
  original?: any
  constructor(msg: string, code: string, original?: any) {
    super(msg)
    this.code = code
    this.original = original
    this.name = "WalletException"
  }
}

export const getAvailableProviders = (): WalletProvider[] => {
  const detected: WalletProvider[] = []
  if (typeof window === "undefined") return detected

  const insideFrame = window.self !== window.top

  if (window.ethereum?.isMetaMask && !insideFrame) {
    detected.push(window.ethereum)
  }

  if (window.ethereum?.providers) {
    const valid = window.ethereum.providers.filter((p: any) => {
      if (insideFrame && p.isTrust) return false
      if (p.isMetaMask) return true
      return !insideFrame
    })

    valid.sort((a: any, b: any) => {
      if (a.isMetaMask && !b.isMetaMask) return -1
      if (!a.isMetaMask && b.isMetaMask) return 1
      return 0
    })

    detected.push(...valid)
  }

  if (
    detected.length === 0 &&
    window.ethereum &&
    !window.ethereum.isMetaMask &&
    (!window.ethereum.isTrust || !insideFrame)
  ) {
    detected.push(window.ethereum)
  }

  return detected
}

export const verifyAddress = (addr: string): boolean => {
  try {
    return ethers.isAddress(addr)
  } catch {
    return false
  }
}

export const displayBalance = (bal: string, decimals = 18): string => {
  try {
    return ethers.formatUnits(bal, decimals)
  } catch {
    return "0"
  }
}

export const toWeiAmount = (amount: string, decimals = 18): string => {
  try {
    return ethers.parseUnits(amount, decimals).toString()
  } catch {
    throw new WalletException("Invalid numeric value", "INVALID_AMOUNT")
  }
}

export const createRandomWallet = (): {
  address: string
  privateKey: string
  mnemonic: string
} => {
  const w = ethers.Wallet.createRandom()
  return {
    address: w.address,
    privateKey: w.privateKey,
    mnemonic: w.mnemonic?.phrase || "",
  }
}

export const calcGas = async (
  provider: ethers.Provider,
  tx: TxRequest
): Promise<string> => {
  try {
    const g = await provider.estimateGas({
      to: tx.to,
      value: tx.value,
      data: tx.data,
    })
    return g.toString()
  } catch (e) {
    throw new WalletException("Unable to estimate gas", "GAS_ESTIMATION_FAILED", e)
  }
}

export const fetchGasPrice = async (provider: ethers.Provider): Promise<string> => {
  try {
    const data = await provider.getFeeData()
    return data.gasPrice?.toString() || "0"
  } catch (e) {
    throw new WalletException("Gas price fetch failed", "GAS_PRICE_FAILED", e)
  }
}

export const shortHash = (hash: string, size = 10): string => {
  if (hash.length <= size) return hash
  return `${hash.slice(0, size / 2)}...${hash.slice(-size / 2)}`
}

export const fromWei = (wei: string): string => ethers.formatEther(wei)

export const toWei = (eth: string): string => ethers.parseEther(eth).toString()

export const chainLabel = (id: number): string => {
  const map: Record<number, string> = {
    1: "Ethereum Mainnet",
    5: "Goerli",
    11155111: "Sepolia",
    137: "Polygon",
    80001: "Mumbai",
    56: "BSC",
    97: "BSC Testnet",
  }
  return map[id] || `Chain ${id}`
}

export const txIsPending = (status: string): boolean => status === "pending"

export const verifyPrivateKey = (key: string): boolean => {
  try {
    new ethers.Wallet(key)
    return true
  } catch {
    return false
  }
}

export const walletFromKey = (key: string): ethers.Wallet => {
  try {
    return new ethers.Wallet(key)
  } catch (e) {
    throw new WalletException("Bad private key", "INVALID_PRIVATE_KEY", e)
  }
}

export const hasMetaMask = (): boolean => {
  if (typeof window === "undefined") return false
  const insideFrame = window.self !== window.top
  if (insideFrame) return false
  if (window.ethereum?.isMetaMask) return true
  if (window.ethereum?.providers) {
    return window.ethereum.providers.some((p: any) => p.isMetaMask)
  }
  return false
}

export const pickProvider = (): WalletProvider | null => {
  const list = getAvailableProviders()
  const mm = list.find((p) => p.isMetaMask)
  return mm || list[0] || null
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
