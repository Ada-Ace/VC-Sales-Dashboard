import React, { useState, useEffect, useMemo } from 'react'
import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Calendar,
  Box,
  Layers,
  RotateCcw,
  Moon,
  Sun,
  LayoutDashboard,
  Database,
  Zap,
  Award,
  Target,
  Trophy,
  BrainCircuit,
  AlertCircle,
  Lightbulb,
  Rocket
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

const Dashboard = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('All Products')
  const [selectedChannel, setSelectedChannel] = useState('All Channels')

  // AI Insights State
  const [aiInsights, setAiInsights] = useState(null)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash') // Optimized for 2026 Free Tier access

  useEffect(() => {
    // Check local storage or system preference for dark mode
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    fetch('http://localhost:3001/api/sales')
      .then(res => res.json())
      .then(json => {
        const sanitized = (json || []).filter(row => row && row.date).map(row => ({
          ...row,
          revenue: Number(row.revenue || 0),
          orders: Number(row.orders || 0),
          cost: Number(row.cost || 0),
          visitors: Number(row.visitors || 0),
          profit: Number(row.revenue || 0) - Number(row.cost || 0)
        }))
        setData(sanitized)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching data from API:', error)
        setLoading(false)
      })
  }, [])


  const toggleDarkMode = () => {
    const nextMode = !isDarkMode
    setIsDarkMode(nextMode)
    if (nextMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Filter Options
  const products = useMemo(() => ['All Products', ...new Set(data.map(item => item.product))], [data])
  const channels = useMemo(() => ['All Channels', ...new Set(data.map(item => item.channel))], [data])

  // Core Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const dateMatch = (!startDate || row.date >= startDate) && (!endDate || row.date <= endDate)
      const productMatch = selectedProduct === 'All Products' || row.product === selectedProduct
      const channelMatch = selectedChannel === 'All Channels' || row.channel === selectedChannel
      const searchMatch = !searchTerm || Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
      return dateMatch && productMatch && channelMatch && searchMatch
    })
  }, [data, startDate, endDate, selectedProduct, selectedChannel, searchTerm])

  // KPI Calculations
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { revenue: 0, orders: 0, profit: 0, aov: 0, conversion: 0 }

    const rev = filteredData.reduce((acc, curr) => acc + curr.revenue, 0)
    const ord = filteredData.reduce((acc, curr) => acc + curr.orders, 0)
    const profit = filteredData.reduce((acc, curr) => acc + curr.profit, 0)
    const vis = filteredData.reduce((acc, curr) => acc + (curr.visitors || 0), 0)
    const aov = ord > 0 ? rev / ord : 0
    const conv = vis > 0 ? (ord / vis) * 100 : 0

    return { revenue: rev, orders: ord, profit: profit, aov, conversion: conv }
  }, [filteredData])

  // Data Insights (Calculated)
  const dataInsights = useMemo(() => {
    if (filteredData.length === 0) return null

    // 1. Best Product
    const prodMap = {}
    filteredData.forEach(d => prodMap[d.product] = (prodMap[d.product] || 0) + d.revenue)
    const bestProduct = Object.entries(prodMap).sort((a, b) => b[1] - a[1])[0]

    // 2. Best Channel
    const chanMap = {}
    filteredData.forEach(d => chanMap[d.channel] = (chanMap[d.channel] || 0) + d.revenue)
    const bestChannel = Object.entries(chanMap).sort((a, b) => b[1] - a[1])[0]

    // 3. Highest Revenue Day
    const dayMap = {}
    filteredData.forEach(d => dayMap[d.date] = (dayMap[d.date] || 0) + d.revenue)
    const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]

    // 4. Highest Conversion Channel
    const chanConvMap = {}
    const chanVisMap = {}
    const chanOrdMap = {}
    filteredData.forEach(d => {
      chanVisMap[d.channel] = (chanVisMap[d.channel] || 0) + (d.visitors || 0)
      chanOrdMap[d.channel] = (chanOrdMap[d.channel] || 0) + (d.orders || 0)
    })
    Object.keys(chanVisMap).forEach(c => {
      chanConvMap[c] = chanVisMap[c] > 0 ? (chanOrdMap[c] / chanVisMap[c]) * 100 : 0
    })
    const bestConvChannel = Object.entries(chanConvMap).sort((a, b) => b[1] - a[1])[0]

    return {
      bestProduct: { name: bestProduct[0], val: bestProduct[1] },
      bestChannel: { name: bestChannel[0], val: bestChannel[1] },
      bestDay: { date: bestDay[0], val: bestDay[1] },
      bestConvChannel: { name: bestConvChannel[0], val: bestConvChannel[1] }
    }
  }, [filteredData])

  // AI Generation
  const generateBusinessInsights = async () => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY

    if (!envKey) {
      alert("AI Configuration Missing: Please set VITE_GEMINI_API_KEY in your .env file and restart the server.")
      return
    }

    setIsGeneratingAi(true)
    try {
      const genAI = new GoogleGenerativeAI(envKey)
      const model = genAI.getGenerativeModel({ model: selectedModel })

      const prompt = `
        Analyze this sales data summary and provide short, clear business insights.
        
        Metrics:
        - Total Revenue: ${stats.revenue}
        - Total Orders: ${stats.orders}
        - Net Profit: ${stats.profit}
        - Top Product: ${dataInsights?.bestProduct.name}
        - Top Channel: ${dataInsights?.bestChannel.name}
        - Best Conversion Channel: ${dataInsights?.bestConvChannel.name} (${dataInsights?.bestConvChannel.val.toFixed(2)}%)
        
        Return the response in this exact JSON format:
        {
          "alerts": ["string", "string"],
          "opportunities": ["string", "string"],
          "suggestions": ["string", "string"]
        }
        Keep each insight under 15 words. Focused on business strategy.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Attempt to parse JSON from the response text
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonStr = text.substring(jsonStart, jsonEnd)

      setAiInsights(JSON.parse(jsonStr))
    } catch (error) {
      console.error("AI Generation Error:", error)
      alert("Failed to generate AI insights. Check your API key or model availability.")
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const trendMap = filteredData.reduce((acc, curr) => {
      acc[curr.date] = (acc[curr.date] || 0) + curr.revenue
      return acc
    }, {})
    const trend = Object.entries(trendMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const channelMap = filteredData.reduce((acc, curr) => {
      acc[curr.channel] = (acc[curr.channel] || 0) + curr.revenue
      return acc
    }, {})
    const byChannel = Object.entries(channelMap).map(([name, value]) => ({ name, value }))

    const productMap = filteredData.reduce((acc, curr) => {
      acc[curr.product] = (acc[curr.product] || 0) + curr.revenue
      return acc
    }, {})
    const byProduct = Object.entries(productMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return { trend, byChannel, byProduct }
  }, [filteredData])

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val || 0)

  const formatCompact = (val) => new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(val || 0)

  const lightColors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']
  const darkColors = ['#38bdf8', '#a78bfa', '#fbbf24', '#34d399', '#f87171']
  const COLORS = isDarkMode ? darkColors : lightColors

  const resetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedProduct('All Products')
    setSelectedChannel('All Channels')
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs">Simulating growth...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/95 transition-colors duration-300">
        <div className="p-4 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-500 rounded-2xl shadow-lg shadow-brand-500/20">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-none">
                  VC <span className="text-brand-600">Growth Engine</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium text-sm flex items-center gap-2">
                  <Database className="w-3.5 h-3.5" /> Intelligence Center v2.0
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative group flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Deep data scan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm text-sm w-full md:w-64"
                />
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-sm"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={resetFilters}
                className="p-2.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-sm"
                title="Reset Filters"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </header>


          {/* Data Insights Panel (The Request) */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 border-l-4 border-brand-500 bg-brand-50/20 dark:bg-brand-500/5 group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 rounded-lg"><Trophy className="w-4 h-4 text-brand-500" /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Champion Product</h4>
              </div>
              <div className="mt-2">
                <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{dataInsights?.bestProduct.name}</p>
                <p className="text-xs text-brand-600 font-bold mt-0.5">{formatCurrency(dataInsights?.bestProduct.val)} Volume</p>
              </div>
            </div>

            <div className="glass-card p-4 border-l-4 border-purple-500 bg-purple-50/20 dark:bg-purple-500/5 group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg"><Target className="w-4 h-4 text-purple-500" /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prime Channel</h4>
              </div>
              <div className="mt-2">
                <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{dataInsights?.bestChannel.name}</p>
                <p className="text-xs text-purple-600 font-bold mt-0.5">{formatCurrency(dataInsights?.bestChannel.val)} Revenue</p>
              </div>
            </div>

            <div className="glass-card p-4 border-l-4 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-500/5 group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><Zap className="w-4 h-4 text-emerald-500" /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Peak Performance Day</h4>
              </div>
              <div className="mt-2">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{dataInsights?.bestDay.date}</p>
                <p className="text-xs text-emerald-600 font-bold mt-0.5">{formatCurrency(dataInsights?.bestDay.val)} Scaled</p>
              </div>
            </div>

            <div className="glass-card p-4 border-l-4 border-orange-500 bg-orange-50/20 dark:bg-orange-500/5 group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg"><Award className="w-4 h-4 text-orange-500" /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Efficiency Leader</h4>
              </div>
              <div className="mt-2">
                <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{dataInsights?.bestConvChannel.name}</p>
                <p className="text-xs text-orange-600 font-bold mt-0.5">{dataInsights?.bestConvChannel.val.toFixed(1)}% Conversion</p>
              </div>
            </div>
          </section>

          {/* AI Strategy Console */}
          <section className="glass-card overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-brand-600 to-brand-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Quantum AI Strategy</h2>
                  <p className="text-brand-100 text-xs font-medium">Deep analysis engine powered by Google Gemini</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-md font-bold"
                >
                  <optgroup label="2026 Intelligence Fleet" className="bg-slate-900 text-white">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Core Engine)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Logic)</option>
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Speed)</option>
                  </optgroup>
                  <optgroup label="Advanced Reasoning" className="bg-slate-900 text-white">
                    <option value="deep-research-pro-preview-12-2025">Deep Research Pro (Preview)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Stable)</option>
                  </optgroup>
                </select>
                <button
                  onClick={generateBusinessInsights}
                  disabled={isGeneratingAi}
                  className="bg-white text-brand-600 px-6 py-2 rounded-xl text-sm font-black shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isGeneratingAi ? (
                    <><RotateCcw className="w-4 h-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Rocket className="w-4 h-4" /> Synthesize Insights</>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[160px]">
              {!aiInsights && !isGeneratingAi ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600 italic">
                  <BrainCircuit className="w-8 h-8 mb-3 opacity-20" />
                  <p>Quantum engine ready. Select a model and synthesize to begin data extrapolation.</p>
                </div>
              ) : isGeneratingAi ? (
                <div className="col-span-3 space-y-4 py-6">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-2/3 animate-pulse"></div>
                </div>
              ) : (
                <>
                  {/* Alerts */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <h3 className="text-sm font-black uppercase tracking-widest">Growth Alerts</h3>
                    </div>
                    <div className="space-y-2">
                      {aiInsights.alerts.map((a, i) => (
                        <div key={i} className="p-3 bg-red-50/50 dark:bg-red-500/5 rounded-xl border border-red-100/50 dark:border-red-900/20 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-brand-500 dark:text-brand-400">
                      <TrendingUp className="w-5 h-5" />
                      <h3 className="text-sm font-black uppercase tracking-widest">Opportunities</h3>
                    </div>
                    <div className="space-y-2">
                      {aiInsights.opportunities.map((o, i) => (
                        <div key={i} className="p-3 bg-brand-50/50 dark:bg-brand-500/5 rounded-xl border border-brand-100/50 dark:border-brand-900/20 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {o}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                      <Lightbulb className="w-5 h-5" />
                      <h3 className="text-sm font-black uppercase tracking-widest">Suggestions</h3>
                    </div>
                    <div className="space-y-2">
                      {aiInsights.suggestions.map((s, i) => (
                        <div key={i} className="p-3 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Filter Bar */}
          <section className="glass-card p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Temporal Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all font-bold"
                />
                <span className="text-slate-300 dark:text-slate-700">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Box className="w-3 h-3" /> Product Vertical
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all appearance-none font-bold"
              >
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Filter className="w-3 h-3" /> Acquisition Channel
              </label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all appearance-none font-bold"
              >
                {channels.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 text-xs font-bold text-slate-400 dark:text-slate-500 border-l border-slate-100 dark:border-slate-800 pl-4 h-full hidden lg:flex">
              <div className="text-right">
                <p className="text-slate-900 dark:text-slate-200 font-black text-lg leading-none">{filteredData.length}</p>
                <p className="uppercase tracking-tighter mt-1">Matched Nodes</p>
              </div>
            </div>
          </section>

          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Gross Revenue', value: formatCurrency(stats.revenue), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', darkColor: 'dark:text-blue-400' },
              { label: 'Cumulative Orders', value: stats.orders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10', darkColor: 'dark:text-purple-400' },
              { label: 'Net Profit Yield', value: formatCurrency(stats.profit), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', darkColor: 'dark:text-emerald-400' },
              { label: 'Conversion Rate', value: `${stats.conversion.toFixed(1)}%`, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10', darkColor: 'dark:text-orange-400' },
            ].map((kpi, i) => (
              <div key={i} className="kpi-card group">
                <div className="flex items-center justify-between">
                  <span className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color} ${kpi.darkColor} transition-transform group-hover:scale-110`}>
                    <kpi.icon className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-5">
                  <p className="stat-label uppercase tracking-widest text-[10px] font-black opacity-80">{kpi.label}</p>
                  <h3 className="stat-value text-2xl lg:text-3xl mt-1 tracking-tight">{kpi.value}</h3>
                </div>
              </div>
            ))}
          </section>

          {/* Charts Grid */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="glass-card p-6 flex flex-col h-[450px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Revenue Velocity</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Projected trend based on selected filters</p>
                </div>
                <div className="text-[10px] font-black text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-pulse"></div> Live View
                </div>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.trend}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }}
                      minTickGap={40}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }}
                      tickFormatter={(val) => `$${formatCompact(val)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        color: isDarkMode ? '#f1f5f9' : '#1e293b'
                      }}
                      formatter={(val) => [formatCurrency(val), 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Revenue by Channel */}
                <div className="glass-card p-6 flex flex-col min-h-[300px]">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Channel Attribution</h2>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.byChannel}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {chartData.byChannel.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Products */}
                <div className="glass-card p-6 flex flex-col min-h-[300px]">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Vertical Benchmarks</h2>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.byProduct} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }}
                          width={90}
                        />
                        <Tooltip
                          cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                          }}
                          formatter={(val) => [formatCurrency(val), 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Transaction Table */}
          <section className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Transaction Registry</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Operational data stream monitoring</p>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                Nodes: {filteredData.length}
              </span>
            </div>
            <div className="overflow-x-auto relative">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-900 z-1 text-slate-400 dark:text-slate-600 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4 font-black">Asset Class</th>
                    <th className="px-6 py-4">Source Channel</th>
                    <th className="px-6 py-4 text-right">Revenue (USD)</th>
                    <th className="px-6 py-4 text-right">Net Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredData.slice(0, 30).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4.5 text-sm font-semibold text-slate-600 dark:text-slate-400">{row.date}</td>
                      <td className="px-6 py-4.5">
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200/50 dark:border-slate-700">
                          {row.product}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-sm italic text-slate-400 dark:text-slate-500 font-medium">{row.channel}</td>
                      <td className="px-6 py-4.5 text-right text-sm font-black text-slate-900 dark:text-slate-200">{formatCurrency(row.revenue)}</td>
                      <td className="px-6 py-4.5 text-right text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(row.profit)}</td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-slate-400 dark:text-slate-600 italic">
                        No matching data found. Reconfigure filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {filteredData.length > 30 && (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">
                  Truncated View • showing top 30 filtered records
                </div>
              )}
            </div>
          </section>

          <footer className="pt-10 pb-6 flex flex-col items-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
            <p className="text-[10px] text-slate-300 dark:text-slate-700 uppercase font-black tracking-[0.3em] flex items-center gap-2">
              VC GROWTH CONSOLE <span className="text-brand-500 opacity-50">•</span> QUANTUM DATA ENGINE v2.0
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
