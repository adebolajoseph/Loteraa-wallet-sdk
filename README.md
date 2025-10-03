# Loteraa Wallet SDK

A comprehensive Web3 wallet interface built with Next.js, React, and ethers.js. This SDK provides a complete wallet solution with connection management, balance tracking, transaction handling, and a beautiful dark-themed UI.


## 🚀 Live Demo

**[https://v0-wallet-ui-design-rho.vercel.app/](https://v0-wallet-ui-design-rho.vercel.app/)**

## ✨ Features

- 🔐 **Secure Wallet Connection** - MetaMask and Web3 wallet integration
- 💰 **Multi-Currency Support** - ETH and custom token (LOT) support
- 📊 **Real-time Balance Tracking** - Live balance updates and portfolio overview
- 💸 **Transaction Management** - Send, receive, and track transactions
- 🎨 **Beautiful Dark UI** - Modern, responsive design with shadcn/ui
- 🔄 **Transaction History** - Complete transaction tracking with status updates
- 📱 **Mobile Responsive** - Optimized for all device sizes
- ⚡ **Fast & Lightweight** - Built with Next.js 14 and modern React patterns

## 🛠 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet

### Quick Start

1. **Clone the repository**
\`\`\`bash
git clone https://github.com/your-org/wallet-ui-design.git
cd wallet-ui-design
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. **Run the development server**
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

4. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Using as an SDK

### Installation in Your Project

\`\`\`bash
npm install ethers lucide-react @radix-ui/react-dropdown-menu
npm install -D tailwindcss @tailwindcss/postcss
\`\`\`

### Basic Setup

#### 1. Set Up Your Layout

\`\`\`tsx
// app/layout.tsx or pages/_app.tsx
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
\`\`\`

#### 2. Import the Wallet Interface

\`\`\`tsx
// app/page.tsx
import { WalletInterface } from '@/components/wallet-interface'

export default function Home() {
  return <WalletInterface />
}
\`\`\`

#### 3. Add Required Styles

\`\`\`css
/* app/globals.css */
@import 'tailwindcss';

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

/* Dark theme variables */
:root {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  --card: 0 0% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 0 0% 14.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 0 0% 83.1%;
  --radius: 0.5rem;
}
\`\`\`

## 🎯 Core Components

### WalletInterface

The main wallet component that handles all wallet operations.

\`\`\`tsx
import { WalletInterface } from '@/components/wallet-interface'

export default function App() {
  return <WalletInterface />
}
\`\`\`

**Features:**
- Automatic wallet detection and connection
- Balance display for ETH and custom tokens
- Send/receive functionality
- Transaction history
- Portfolio overview
- Responsive design

## 🔧 API Reference

### Wallet Connection

The wallet automatically detects and connects to MetaMask or compatible Web3 wallets.

\`\`\`typescript
// Connection states
interface WalletState {
  isConnected: boolean
  account: string
  provider: ethers.BrowserProvider | null
  ethBalance: string
  lotBalance: string
}
\`\`\`

### Transaction Management

\`\`\`typescript
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
\`\`\`

### Currency Support

\`\`\`typescript
interface Currency {
  name: string
  symbol: string
  balance: string
  usdValue: string
  change: string
  changePositive: boolean
  color: string
}
\`\`\`

## 💡 Usage Examples

### Basic Wallet Integration

\`\`\`tsx
import { WalletInterface } from '@/components/wallet-interface'

function MyApp() {
  return (
    <div className="min-h-screen bg-black">
      <WalletInterface />
    </div>
  )
}
\`\`\`

### Custom Wallet Connection Button

\`\`\`tsx
import { useState } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'

function ConnectButton() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        
        setAccount(address)
        setIsConnected(true)
      } catch (error) {
        console.error('Connection failed:', error)
      }
    }
  }

  return (
    <Button onClick={connectWallet} disabled={isConnected}>
      {isConnected ? `Connected: ${account.slice(0, 6)}...` : 'Connect Wallet'}
    </Button>
  )
}
\`\`\`

### Balance Display Component

\`\`\`tsx
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from '@/components/ui/card'

function BalanceDisplay({ provider, account }: { 
  provider: ethers.BrowserProvider | null
  account: string 
}) {
  const [balance, setBalance] = useState('0.0000')

  useEffect(() => {
    const fetchBalance = async () => {
      if (provider && account) {
        try {
          const balance = await provider.getBalance(account)
          const ethBalance = parseFloat(ethers.formatEther(balance)).toFixed(4)
          setBalance(ethBalance)
        } catch (error) {
          console.error('Error fetching balance:', error)
        }
      }
    }

    fetchBalance()
  }, [provider, account])

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">ETH Balance</h3>
      <p className="text-2xl font-bold">{balance} ETH</p>
    </Card>
  )
}
\`\`\`

### Send Transaction Form

\`\`\`tsx
import { useState } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SendForm({ provider, account }: {
  provider: ethers.BrowserProvider | null
  account: string
}) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!provider || !account || !recipient || !amount) return

    try {
      setIsLoading(true)
      const signer = await provider.getSigner()
      
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount)
      })

      console.log('Transaction sent:', tx.hash)
      await tx.wait()
      console.log('Transaction confirmed')
      
      // Reset form
      setRecipient('')
      setAmount('')
    } catch (error) {
      console.error('Transaction failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="recipient">Recipient Address</Label>
        <Input
          id="recipient"
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="amount">Amount (ETH)</Label>
        <Input
          id="amount"
          type="number"
          step="0.0001"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <Button 
        onClick={handleSend} 
        disabled={isLoading || !recipient || !amount}
        className="w-full"
      >
        {isLoading ? 'Sending...' : 'Send ETH'}
      </Button>
    </div>
  )
}
\`\`\`

## 🎨 Customization

### Theming

The wallet uses CSS custom properties for theming. Customize colors by modifying the CSS variables:

\`\`\`css
:root {
  --background: 0 0% 0%;           /* Main background */
  --foreground: 0 0% 100%;         /* Text color */
  --card: 0 0% 3.9%;               /* Card background */
  --primary: 0 0% 98%;             /* Primary buttons */
  --secondary: 0 0% 14.9%;         /* Secondary elements */
  --accent: 0 0% 14.9%;            /* Accent color */
  --destructive: 0 84.2% 60.2%;    /* Error/danger color */
  --border: 0 0% 14.9%;            /* Border color */
}
\`\`\`

### Custom Tokens

Add support for custom tokens by extending the currencies object:

\`\`\`tsx
const currencies = {
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    balance: ethBalance,
    // ... other properties
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    balance: usdcBalance,
    // ... other properties
  }
}
\`\`\`

### Styling Components

All components use Tailwind CSS classes and can be customized:

\`\`\`tsx
// Custom button styling
<Button className="bg-blue-600 hover:bg-blue-700 text-white">
  Custom Button
</Button>

// Custom card styling
<Card className="bg-gradient-to-r from-purple-500 to-pink-500">
  Custom Card
</Card>
\`\`\`

## 🔒 Security Best Practices

1. **Never store private keys** - The wallet only connects to external wallet providers
2. **Validate addresses** - Always validate recipient addresses before transactions
3. **Check balances** - Verify sufficient balance before sending transactions
4. **Handle errors gracefully** - Implement proper error handling for all wallet operations
5. **Use HTTPS** - Always serve your application over HTTPS in production

## 🐛 Error Handling

The wallet includes comprehensive error handling:

\`\`\`typescript
// Connection errors
if (error.code === 4001) {
  // User rejected connection
  console.log('User declined wallet connection')
}

// Transaction errors
if (error.reason === 'insufficient funds') {
  alert('Insufficient funds for this transaction')
}

if (error.reason === 'invalid address') {
  alert('Invalid recipient address')
}
\`\`\`

## 🧪 Testing

### Manual Testing Checklist

- [ ] Wallet connection works with MetaMask
- [ ] Balance displays correctly
- [ ] Send transactions work
- [ ] Receive address displays correctly
- [ ] Transaction history updates
- [ ] Disconnect functionality works
- [ ] Error handling works properly
- [ ] Mobile responsive design

### Test Networks

For development, use test networks:

- **Sepolia Testnet** - Recommended for testing
- **Goerli Testnet** - Alternative test network

Get test ETH from faucets:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Goerli Faucet](https://goerlifaucet.com/)

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README for detailed usage instructions
- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/your-org/wallet-ui-design/issues)
- **Community**: Join our [Discord](https://discord.gg/your-server) for community support

## 🔗 Links

- **Live Demo**: [https://v0-wallet-ui-design-rho.vercel.app/](https://v0-wallet-ui-design-rho.vercel.app/)
- **GitHub**: [https://github.com/your-org/wallet-ui-design](https://github.com/your-org/wallet-ui-design)
- **Documentation**: [https://docs.your-org.com/wallet-sdk](https://docs.your-org.com/wallet-sdk)

---

Built with ❤️ using [v0.app](https://v0.app), Next.js, React, and ethers.js
