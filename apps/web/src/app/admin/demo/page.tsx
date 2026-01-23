/**
 * Admin Panel Demo Page
 * Shows the admin dashboard UI with mock data for preview purposes
 * This page bypasses authentication for demonstration
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  generateMockTransactions, 
  formatTxHash, 
  formatAddress, 
  getStatusColor, 
  formatTimeAgo,
  CRONOS_TESTNET_CONFIG,
  type MockTransaction
} from '@/lib/admin'

export default function AdminDemoPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<MockTransaction[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirming' | 'completed' | 'failed'>('all')

  // Load mock transactions on mount
  useEffect(() => {
    const mockTxs = generateMockTransactions(15)
    setTransactions(mockTxs)
  }, [])

  // Auto-refresh transactions every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true)
      const newTxs = generateMockTransactions(15)
      setTransactions(newTxs)
      setTimeout(() => setRefreshing(false), 500)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    const newTxs = generateMockTransactions(15)
    setTransactions(newTxs)
    setTimeout(() => setRefreshing(false), 500)
  }

  // Filter transactions
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.status === filter)

  // Calculate stats
  const stats = {
    total: transactions.length,
    pending: transactions.filter(tx => tx.status === 'pending').length,
    confirming: transactions.filter(tx => tx.status === 'confirming').length,
    completed: transactions.filter(tx => tx.status === 'completed').length,
    failed: transactions.filter(tx => tx.status === 'failed').length,
    totalVolume: transactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.usdValue, 0),
  }

  const mockAdminAddress = '0x742d...a4F2'

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Demo Banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center">
        <span className="text-yellow-500 text-sm font-medium">
          🔍 Demo Mode - This is a preview of the admin dashboard with mock data
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Nova-x402 Logo"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <h2 className="text-xl font-extrabold tracking-tight text-white">Nova-x402 Admin</h2>
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-primary-user/10 text-primary-user rounded uppercase">
              Testnet
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <button
                onClick={() => router.push('/')}
                className="hover:text-white transition-colors"
              >
                Storefront
              </button>
              <span className="text-white">Admin Panel</span>
            </nav>
            
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Admin</span>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {mockAdminAddress}
                </span>
              </div>
              <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all">
                Connected
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-card-dark rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-400 text-lg">📋</span>
              <span className="text-xs text-slate-400 font-medium">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          
          <div className="bg-card-dark rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-500 text-lg">⏳</span>
              <span className="text-xs text-slate-400 font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{stats.pending}</p>
          </div>
          
          <div className="bg-card-dark rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-500 text-lg">⏱️</span>
              <span className="text-xs text-slate-400 font-medium">Confirming</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{stats.confirming}</p>
          </div>
          
          <div className="bg-card-dark rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-500 text-lg">✅</span>
              <span className="text-xs text-slate-400 font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          </div>
          
          <div className="bg-card-dark rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-500 text-lg">❌</span>
              <span className="text-xs text-slate-400 font-medium">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
          </div>
          
          <div className="bg-card-dark rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary-user text-lg">💰</span>
              <span className="text-xs text-slate-400 font-medium">Volume (USDC)</span>
            </div>
            <p className="text-2xl font-bold text-primary-user">${stats.totalVolume}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-card-dark rounded-2xl border border-white/5 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Gift Card Orders</h2>
              <p className="text-sm text-slate-400 mt-1">
                Transactions processed through Crypto.com Testnet
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 bg-background-dark rounded-lg p-1">
                {(['all', 'pending', 'confirming', 'completed', 'failed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      filter === status
                        ? 'bg-primary-user text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-primary-user/10 hover:bg-primary-user/20 text-primary-user px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              >
                <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                Refresh
              </button>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-white/5">
                  <th className="text-left px-6 py-4 font-semibold">Transaction</th>
                  <th className="text-left px-6 py-4 font-semibold">Gift Card</th>
                  <th className="text-left px-6 py-4 font-semibold">Amount</th>
                  <th className="text-left px-6 py-4 font-semibold">From</th>
                  <th className="text-left px-6 py-4 font-semibold">Recipient</th>
                  <th className="text-left px-6 py-4 font-semibold">Status</th>
                  <th className="text-left px-6 py-4 font-semibold">Confirmations</th>
                  <th className="text-left px-6 py-4 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <a
                        href={`https://testnet.cronoscan.com/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-user hover:underline font-mono text-sm"
                      >
                        {formatTxHash(tx.txHash)}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{tx.giftCardBrand}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-bold">${tx.usdValue}</span>
                      <span className="text-slate-400 text-xs ml-1">USDC</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 font-mono text-sm">{formatAddress(tx.fromAddress)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 text-sm">{tx.recipientEmail}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(tx.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          tx.status === 'completed' ? 'bg-green-500' :
                          tx.status === 'confirming' ? 'bg-yellow-500' :
                          tx.status === 'pending' ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}></span>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 font-mono text-sm">
                        {tx.status === 'pending' ? '-' : `${tx.confirmations}/12`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-sm">{formatTimeAgo(tx.timestamp)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="px-6 py-12 text-center">
              <span className="text-4xl text-slate-600 mb-4">📭</span>
              <p className="text-slate-400">No transactions found with the selected filter.</p>
            </div>
          )}
        </div>

        {/* Network Info Footer */}
        <div className="mt-8 bg-card-dark rounded-xl border border-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold mb-1">Crypto.com {CRONOS_TESTNET_CONFIG.name}</h3>
              <p className="text-slate-400 text-sm">
                Chain ID: {CRONOS_TESTNET_CONFIG.chainId} • RPC: {CRONOS_TESTNET_CONFIG.rpc} • Explorer: {CRONOS_TESTNET_CONFIG.explorer}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-500 text-sm font-bold">Network Online</span>
            </div>
          </div>
        </div>
      </main>
      
      {/* Ambient Glow Effects */}
      <div className="fixed top-1/4 -left-64 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 -right-64 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  )
}
