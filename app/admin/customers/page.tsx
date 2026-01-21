'use client';'use client';"use client"



import React, { useState, useEffect } from 'react';

import { Search, Crown, Zap, Moon, AlertTriangle, Users, TrendingUp, DollarSign } from 'lucide-react';

import { Input } from '@/components/ui/input';import React, { useState, useEffect } from 'react';import { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';import { Search, Crown, Zap, Moon, AlertTriangle, Users, TrendingUp, DollarSign } from 'lucide-react';import { motion } from 'framer-motion'

import {

  Table,import { Input } from '@/components/ui/input';import { 

  TableBody,

  TableCell,import { Badge } from '@/components/ui/badge';  Users, Search, Mail, Phone, Calendar, DollarSign, 

  TableHead,

  TableHeader,import { Button } from '@/components/ui/button';  ShoppingBag, Filter, Download, RefreshCw, Eye, TrendingUp 

  TableRow,

} from '@/components/ui/table';import {} from 'lucide-react'

import { Card } from '@/components/ui/card';

import { Skeleton } from '@/components/ui/skeleton';  Table,import { supabase } from '@/lib/supabase'

import CustomerDrawer from '@/components/CustomerDrawer';

import { Customer } from '@/app/api/admin/customers/route';  TableBody,import { format, subDays } from 'date-fns'



function useDebounce<T>(value: T, delay: number): T {  TableCell,import { ptBR } from 'date-fns/locale'

  const [debouncedValue, setDebouncedValue] = useState(value);

  TableHead,import { fetchCustomersWithMetrics } from '@/lib/dashboard-queries'

  useEffect(() => {

    const handler = setTimeout(() => {  TableHeader,

      setDebouncedValue(value);

    }, delay);  TableRow,interface Customer {



    return () => {} from '@/components/ui/table';  customer_id: string

      clearTimeout(handler);

    };import { Card } from '@/components/ui/card';  name: string

  }, [value, delay]);

import { Skeleton } from '@/components/ui/skeleton';  email: string

  return debouncedValue;

}import CustomerDrawer from '@/components/CustomerDrawer';  phone: string | null



function getInitials(name: string): string {import { Customer } from '@/app/api/admin/customers/route';  segment: string | null

  if (!name) return '??';

  const parts = name.trim().split(' ');  status: string

  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();// Debounce hook  total_orders: number

}

function useDebounce<T>(value: T, delay: number): T {  total_spent: number

function getColorFromString(str: string): string {

  let hash = 0;  const [debouncedValue, setDebouncedValue] = useState(value);  average_order_value: number

  for (let i = 0; i < str.length; i++) {

    hash = str.charCodeAt(i) + ((hash << 5) - hash);  last_purchase_at: string

  }

  const hue = hash % 360;  useEffect(() => {  first_purchase_at: string

  return `hsl(${hue}, 65%, 55%)`;

}    const handler = setTimeout(() => {}



function CustomerAvatar({ name, email }: { name: string; email: string }) {      setDebouncedValue(value);

  const initials = getInitials(name);

  const color = getColorFromString(email);    }, delay);export default function CustomersPage() {

  

  return (  const [customers, setCustomers] = useState<Customer[]>([])

    <div

      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"    return () => {  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])

      style={{ backgroundColor: color }}

    >      clearTimeout(handler);  const [loading, setLoading] = useState(true)

      {initials}

    </div>    };  const [refreshing, setRefreshing] = useState(false)

  );

}  }, [value, delay]);  const [searchTerm, setSearchTerm] = useState('')



function SegmentBadge({ segment }: { segment: Customer['segment'] }) {  const [sortBy, setSortBy] = useState<'total_spent' | 'total_orders' | 'last_purchase_at'>('total_spent')

  const config = {

    VIP: { icon: Crown, color: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white', label: '👑 VIP' },  return debouncedValue;  const [filterSegment, setFilterSegment] = useState<'all' | 'vip' | 'regular' | 'new'>('all')

    New: { icon: Zap, color: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white', label: '🔥 Novo' },

    Dormant: { icon: Moon, color: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white', label: '💤 Ausente' },}  

    'Churn Risk': { icon: AlertTriangle, color: 'bg-gradient-to-r from-orange-500 to-red-600 text-white', label: '⚠️ Churn' },

    Regular: { icon: Users, color: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white', label: 'Regular' },  // Filtros de data

  };

  // Função para gerar avatar com iniciais  const today = new Date()

  const { color, label } = config[segment] || config.Regular;

  function getInitials(name: string): string {  const thirtyDaysAgo = subDays(today, 30)

  return (

    <Badge className={`${color} border-0 font-semibold px-3 py-1`}>  if (!name) return '??';  const [startDate, setStartDate] = useState(format(thirtyDaysAgo, 'yyyy-MM-dd'))

      {label}

    </Badge>  const parts = name.trim().split(' ');  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'))

  );

}  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();  const [period, setPeriod] = useState(30)



const formatCurrency = (value: number | null) => {  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  if (!value) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {}  // Função para definir período rápido

    style: 'currency',

    currency: 'BRL',  const setQuickPeriod = (days: number) => {

  }).format(value);

};// Função para gerar cor baseada em hash    setPeriod(days)



function getRelativeTime(date: string): string {function getColorFromString(str: string): string {    const end = new Date()

  const now = new Date();

  const past = new Date(date);  let hash = 0;    const start = subDays(end, days)

  const diffMs = now.getTime() - past.getTime();

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));  for (let i = 0; i < str.length; i++) {    setStartDate(format(start, 'yyyy-MM-dd'))

  

  if (diffDays === 0) return 'Hoje';    hash = str.charCodeAt(i) + ((hash << 5) - hash);    setEndDate(format(end, 'yyyy-MM-dd'))

  if (diffDays === 1) return 'Ontem';

  if (diffDays < 7) return `${diffDays} dias atrás`;  }  }

  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;

  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;  const hue = hash % 360;

  return `${Math.floor(diffDays / 365)} anos atrás`;

}  return `hsl(${hue}, 65%, 55%)`;  useEffect(() => {



export default function CustomersPage() {}    loadCustomers()

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);  }, [startDate, endDate])

  const [search, setSearch] = useState('');

  const [selectedSegment, setSelectedSegment] = useState('');// Componente de Avatar

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);function CustomerAvatar({ name, email }: { name: string; email: string }) {  useEffect(() => {

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);  const initials = getInitials(name);    filterAndSortCustomers()

  const [stats, setStats] = useState({

    total_customers: 0,  const color = getColorFromString(email);  }, [searchTerm, sortBy, filterSegment, customers])

    vip_count: 0,

    dormant_count: 0,  

    total_ltv: 0,

    avg_ltv: 0,  return (  const loadCustomers = async () => {

  });

    <div    try {

  const debouncedSearch = useDebounce(search, 500);

      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"      setRefreshing(true)

  const fetchCustomers = async () => {

    setLoading(true);      style={{ backgroundColor: color }}

    try {

      const params = new URLSearchParams({    >      console.log('📊 Carregando clientes:', { startDate, endDate })

        page: page.toString(),

        limit: '20',      {initials}

        search: debouncedSearch,

        segment: selectedSegment,    </div>      // Usar helper de queries

        sortBy: 'ltv',

        sortOrder: 'desc',  );      const { data, error } = await fetchCustomersWithMetrics(

      });

      }        supabase,

      const response = await fetch(`/api/admin/customers?${params}`);

      const data = await response.json();        startDate,

      

      setCustomers(data.customers || []);// Badge de Segmento        endDate

      setTotalPages(data.pagination?.totalPages || 1);

      setStats(data.stats || stats);function SegmentBadge({ segment }: { segment: Customer['segment'] }) {      )

    } catch (error) {

      console.error('Error fetching customers:', error);  const config = {

    } finally {

      setLoading(false);    VIP: { icon: Crown, color: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white', label: '👑 VIP' },      if (error) {

    }

  };    New: { icon: Zap, color: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white', label: '🔥 Novo' },        console.error('❌ Erro ao buscar clientes:', error)



  useEffect(() => {    Dormant: { icon: Moon, color: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white', label: '💤 Ausente' },        return

    fetchCustomers();

  }, [debouncedSearch, selectedSegment, page]);    'Churn Risk': { icon: AlertTriangle, color: 'bg-gradient-to-r from-orange-500 to-red-600 text-white', label: '⚠️ Churn' },      }



  const handleRowClick = (customer: Customer) => {    Regular: { icon: Users, color: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white', label: 'Regular' },

    setSelectedCustomer(customer);

    setDrawerOpen(true);  };      console.log('✅ Clientes carregados:', data?.length || 0)

  };

        setCustomers(data || [])

  return (

    <div className="min-h-screen bg-[#0A0A0A] p-6 space-y-6">  const { color, label } = config[segment] || config.Regular;

      <div className="flex items-center justify-between">

        <div>      } catch (error) {

          <h1 className="text-3xl font-bold text-white flex items-center gap-3">

            <Users className="w-8 h-8 text-purple-400" />  return (      console.error('❌ Erro:', error)

            Clientes

          </h1>    <Badge className={`${color} border-0 font-semibold px-3 py-1`}>    } finally {

          <p className="text-gray-400 mt-1">

            Mini-CRM: Identifique VIPs, recupere Churns e acompanhe LTV      {label}      setLoading(false)

          </p>

        </div>    </Badge>      setRefreshing(false)

      </div>

  );    }

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/30 p-6">}  }

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-400 text-sm font-medium">Total de Clientes</p>

              <p className="text-3xl font-bold text-white mt-1">{stats.total_customers}</p>// Formatter de moeda  const filterAndSortCustomers = () => {

            </div>

            <Users className="w-10 h-10 text-purple-400" />const formatCurrency = (value: number | null) => {    let filtered = [...customers]

          </div>

        </Card>  if (!value) return 'R$ 0,00';



        <Card className="bg-gradient-to-br from-yellow-900/30 to-amber-800/20 border-yellow-700/30 p-6">  return new Intl.NumberFormat('pt-BR', {    // Filtrar por busca

          <div className="flex items-center justify-between">

            <div>    style: 'currency',    if (searchTerm) {

              <p className="text-gray-400 text-sm font-medium">VIPs</p>

              <p className="text-3xl font-bold text-white mt-1">{stats.vip_count}</p>    currency: 'BRL',      filtered = filtered.filter(c =>

            </div>

            <Crown className="w-10 h-10 text-yellow-400" />  }).format(value);        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||

          </div>

        </Card>};        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||



        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-800/20 border-green-700/30 p-6">        c.phone?.includes(searchTerm)

          <div className="flex items-center justify-between">

            <div>// Formatter de data relativa      )

              <p className="text-gray-400 text-sm font-medium">LTV Total</p>

              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.total_ltv)}</p>function getRelativeTime(date: string): string {    }

            </div>

            <DollarSign className="w-10 h-10 text-green-400" />  const now = new Date();

          </div>

        </Card>  const past = new Date(date);    // Filtrar por segmento



        <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-800/20 border-blue-700/30 p-6">  const diffMs = now.getTime() - past.getTime();    if (filterSegment !== 'all') {

          <div className="flex items-center justify-between">

            <div>  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));      filtered = filtered.filter(c => c.segment === filterSegment)

              <p className="text-gray-400 text-sm font-medium">LTV Médio</p>

              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.avg_ltv)}</p>      }

            </div>

            <TrendingUp className="w-10 h-10 text-blue-400" />  if (diffDays === 0) return 'Hoje';

          </div>

        </Card>  if (diffDays === 1) return 'Ontem';    // Ordenar

      </div>

  if (diffDays < 7) return `${diffDays} dias atrás`;    filtered.sort((a, b) => {

      <Card className="bg-[#111111] border-gray-800 p-6">

        <div className="flex flex-col md:flex-row gap-4">  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;      switch (sortBy) {

          <div className="flex-1 relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;        case 'total_spent':

            <Input

              placeholder="Buscar por nome ou email..."  return `${Math.floor(diffDays / 365)} anos atrás`;          return b.total_spent - a.total_spent

              value={search}

              onChange={(e) => setSearch(e.target.value)}}        case 'total_orders':

              className="pl-10 bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500"

            />          return b.total_orders - a.total_orders

          </div>

export default function CustomersPage() {        case 'last_purchase_at':

          <div className="flex gap-2 flex-wrap">

            {['', 'VIP', 'New', 'Dormant', 'Churn Risk', 'Regular'].map((segment) => (  const [customers, setCustomers] = useState<Customer[]>([]);          return new Date(b.last_purchase_at).getTime() - new Date(a.last_purchase_at).getTime()

              <Button

                key={segment || 'all'}  const [loading, setLoading] = useState(true);        default:

                variant={selectedSegment === segment ? 'default' : 'outline'}

                onClick={() => setSelectedSegment(segment)}  const [search, setSearch] = useState('');          return 0

                className={`${

                  selectedSegment === segment  const [selectedSegment, setSelectedSegment] = useState('');      }

                    ? 'bg-purple-600 hover:bg-purple-700 text-white'

                    : 'bg-[#1A1A1A] border-gray-700 text-gray-300 hover:bg-[#222222]'  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);    })

                }`}

              >  const [drawerOpen, setDrawerOpen] = useState(false);

                {segment || 'Todos'}

              </Button>  const [page, setPage] = useState(1);    setFilteredCustomers(filtered)

            ))}

          </div>  const [totalPages, setTotalPages] = useState(1);  }

        </div>

      </Card>  const [stats, setStats] = useState({



      <Card className="bg-[#111111] border-gray-800">    total_customers: 0,  // Métricas totais

        <Table>

          <TableHeader>    vip_count: 0,  const totalCustomers = customers.length

            <TableRow className="border-gray-800 hover:bg-transparent">

              <TableHead className="text-gray-400 font-semibold">Cliente</TableHead>    dormant_count: 0,  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0)

              <TableHead className="text-gray-400 font-semibold">Segmento</TableHead>

              <TableHead className="text-gray-400 font-semibold text-right">LTV</TableHead>    total_ltv: 0,  const avgOrderValue = customers.reduce((sum, c) => sum + c.average_order_value, 0) / (customers.length || 1)

              <TableHead className="text-gray-400 font-semibold text-right">Pedidos</TableHead>

              <TableHead className="text-gray-400 font-semibold text-right">Ticket Médio</TableHead>    avg_ltv: 0,  const totalOrders = customers.reduce((sum, c) => sum + c.total_orders, 0)

              <TableHead className="text-gray-400 font-semibold">Última Compra</TableHead>

              <TableHead className="text-gray-400 font-semibold text-center">Score</TableHead>  });

            </TableRow>

          </TableHeader>  // Segmentos

          <TableBody>

            {loading ? (  const debouncedSearch = useDebounce(search, 500);  const vipCount = customers.filter(c => c.segment === 'vip').length

              Array.from({ length: 5 }).map((_, i) => (

                <TableRow key={i} className="border-gray-800">  const regularCount = customers.filter(c => c.segment === 'regular').length

                  <TableCell colSpan={7}>

                    <Skeleton className="h-12 w-full bg-gray-800" />  // Fetch customers  const newCount = customers.filter(c => c.segment === 'new').length

                  </TableCell>

                </TableRow>  const fetchCustomers = async () => {

              ))

            ) : customers.length === 0 ? (    setLoading(true);  const MetricCard = ({ title, value, icon: Icon, color, prefix = '', suffix = '' }: any) => (

              <TableRow className="border-gray-800">

                <TableCell colSpan={7} className="text-center text-gray-500 py-12">    try {    <motion.div

                  Nenhum cliente encontrado

                </TableCell>      const params = new URLSearchParams({      initial={{ opacity: 0, y: 20 }}

              </TableRow>

            ) : (        page: page.toString(),      animate={{ opacity: 1, y: 0 }}

              customers.map((customer) => (

                <TableRow        limit: '20',      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50"

                  key={customer.email}

                  onClick={() => handleRowClick(customer)}        search: debouncedSearch,    >

                  className="border-gray-800 hover:bg-[#1A1A1A] cursor-pointer transition-colors"

                >        segment: selectedSegment,      <div className="flex items-center gap-4">

                  <TableCell>

                    <div className="flex items-center gap-3">        sortBy: 'ltv',        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>

                      <CustomerAvatar name={customer.name} email={customer.email} />

                      <div>        sortOrder: 'desc',          <Icon className="w-6 h-6 text-white" />

                        <p className="font-medium text-white">{customer.name || 'Sem nome'}</p>

                        <p className="text-sm text-gray-500">{customer.email}</p>      });        </div>

                      </div>

                    </div>              <div>

                  </TableCell>

                  <TableCell>      const response = await fetch(`/api/admin/customers?${params}`);          <p className="text-gray-400 text-sm font-medium">{title}</p>

                    <SegmentBadge segment={customer.segment} />

                  </TableCell>      const data = await response.json();          <p className="text-2xl font-bold text-white">

                  <TableCell className="text-right">

                    <span className="font-bold text-green-400">{formatCurrency(customer.ltv)}</span>                  {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR', {

                  </TableCell>

                  <TableCell className="text-right text-white">      setCustomers(data.customers || []);              minimumFractionDigits: prefix === 'R$ ' ? 2 : 0,

                    {customer.paid_orders}/{customer.total_orders}

                  </TableCell>      setTotalPages(data.pagination?.totalPages || 1);              maximumFractionDigits: prefix === 'R$ ' ? 2 : 0,

                  <TableCell className="text-right text-gray-300">

                    {formatCurrency(customer.aov)}      setStats(data.stats || stats);            }) : value}{suffix}

                  </TableCell>

                  <TableCell>    } catch (error) {          </p>

                    <span className="text-gray-400 text-sm">

                      {customer.last_purchase ? getRelativeTime(customer.last_purchase) : 'Nunca'}      console.error('Error fetching customers:', error);        </div>

                    </span>

                  </TableCell>    } finally {      </div>

                  <TableCell className="text-center">

                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600">      setLoading(false);    </motion.div>

                      <span className="text-white font-bold text-sm">{customer.engagement_score}</span>

                    </div>    }  )

                  </TableCell>

                </TableRow>  };

              ))

            )}  const SegmentBadge = ({ segment }: { segment: string | null }) => {

          </TableBody>

        </Table>  useEffect(() => {    const styles = {



        {totalPages > 1 && (    fetchCustomers();      vip: 'bg-purple-500/20 text-purple-400 border-purple-500/30',

          <div className="flex items-center justify-between p-4 border-t border-gray-800">

            <Button  }, [debouncedSearch, selectedSegment, page]);      regular: 'bg-blue-500/20 text-blue-400 border-blue-500/30',

              variant="outline"

              onClick={() => setPage(Math.max(1, page - 1))}      new: 'bg-green-500/20 text-green-400 border-green-500/30',

              disabled={page === 1}

              className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#222222] disabled:opacity-50"  // Abrir drawer    }

            >

              Anterior  const handleRowClick = (customer: Customer) => {

            </Button>

            <span className="text-gray-400">    setSelectedCustomer(customer);    const labels = {

              Página {page} de {totalPages}

            </span>    setDrawerOpen(true);      vip: '⭐ VIP',

            <Button

              variant="outline"  };      regular: '👤 Regular',

              onClick={() => setPage(Math.min(totalPages, page + 1))}

              disabled={page === totalPages}      new: '🆕 Novo',

              className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#222222] disabled:opacity-50"

            >  return (    }

              Próxima

            </Button>    <div className="min-h-screen bg-[#0A0A0A] p-6 space-y-6">

          </div>

        )}      {/* Header */}    const seg = segment || 'new'

      </Card>

      <div className="flex items-center justify-between">    return (

      {selectedCustomer && (

        <CustomerDrawer        <div>      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[seg as keyof typeof styles]}`}>

          customer={selectedCustomer}

          open={drawerOpen}          <h1 className="text-3xl font-bold text-white flex items-center gap-3">        {labels[seg as keyof typeof labels]}

          onClose={() => setDrawerOpen(false)}

        />            <Users className="w-8 h-8 text-purple-400" />      </span>

      )}

    </div>            Clientes    )

  );

}          </h1>  }


          <p className="text-gray-400 mt-1">

            Mini-CRM: Identifique VIPs, recupere Churns e acompanhe LTV  if (loading) {

          </p>    return (

        </div>      <div className="flex items-center justify-center h-96">

      </div>        <div className="text-center">

          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

      {/* Stats Cards */}          <p className="text-gray-400 font-medium">Carregando clientes...</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">        </div>

        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/30 p-6">      </div>

          <div className="flex items-center justify-between">    )

            <div>  }

              <p className="text-gray-400 text-sm font-medium">Total de Clientes</p>

              <p className="text-3xl font-bold text-white mt-1">{stats.total_customers}</p>  return (

            </div>    <div className="space-y-8">

            <Users className="w-10 h-10 text-purple-400" />      {/* Header */}

          </div>      <div className="flex items-center justify-between flex-wrap gap-4">

        </Card>        <div>

          <h1 className="text-3xl font-black text-white">Clientes</h1>

        <Card className="bg-gradient-to-br from-yellow-900/30 to-amber-800/20 border-yellow-700/30 p-6">          <p className="text-gray-400 mt-1">Gerencie sua base de clientes</p>

          <div className="flex items-center justify-between">        </div>

            <div>

              <p className="text-gray-400 text-sm font-medium">VIPs</p>        <div className="flex gap-3 flex-wrap">

              <p className="text-3xl font-bold text-white mt-1">{stats.vip_count}</p>          {/* Filtros Rápidos */}

            </div>          <div className="flex gap-2 bg-gray-800 border border-gray-700 rounded-xl p-1">

            <Crown className="w-10 h-10 text-yellow-400" />            {[7, 14, 30, 90].map((days) => (

          </div>              <button

        </Card>                key={days}

                onClick={() => setQuickPeriod(days)}

        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-800/20 border-green-700/30 p-6">                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${

          <div className="flex items-center justify-between">                  period === days

            <div>                    ? 'bg-brand-500 text-white shadow-lg'

              <p className="text-gray-400 text-sm font-medium">LTV Total</p>                    : 'text-gray-400 hover:text-white'

              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.total_ltv)}</p>                }`}

            </div>              >

            <DollarSign className="w-10 h-10 text-green-400" />                {days} dias

          </div>              </button>

        </Card>            ))}

          </div>

        <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-800/20 border-blue-700/30 p-6">

          <div className="flex items-center justify-between">          <button

            <div>            onClick={loadCustomers}

              <p className="text-gray-400 text-sm font-medium">LTV Médio</p>            disabled={refreshing}

              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.avg_ltv)}</p>            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 text-white transition-colors"

            </div>          >

            <TrendingUp className="w-10 h-10 text-blue-400" />            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />

          </div>            Atualizar

        </Card>          </button>

      </div>        </div>

      </div>

      {/* Filters */}

      <Card className="bg-[#111111] border-gray-800 p-6">      {/* Métricas */}

        <div className="flex flex-col md:flex-row gap-4">      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Search */}        <MetricCard

          <div className="flex-1 relative">          title="Total de Clientes"

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />          value={totalCustomers}

            <Input          icon={Users}

              placeholder="Buscar por nome ou email..."          color="from-blue-500 to-cyan-600"

              value={search}        />

              onChange={(e) => setSearch(e.target.value)}        <MetricCard

              className="pl-10 bg-[#1A1A1A] border-gray-700 text-white placeholder:text-gray-500"          title="Receita Total"

            />          value={totalRevenue}

          </div>          icon={DollarSign}

          color="from-green-500 to-emerald-600"

          {/* Segment Filter */}          prefix="R$ "

          <div className="flex gap-2 flex-wrap">        />

            {['', 'VIP', 'New', 'Dormant', 'Churn Risk', 'Regular'].map((segment) => (        <MetricCard

              <Button          title="Ticket Médio"

                key={segment || 'all'}          value={avgOrderValue}

                variant={selectedSegment === segment ? 'default' : 'outline'}          icon={ShoppingBag}

                onClick={() => setSelectedSegment(segment)}          color="from-orange-500 to-red-600"

                className={`${          prefix="R$ "

                  selectedSegment === segment        />

                    ? 'bg-purple-600 hover:bg-purple-700 text-white'        <MetricCard

                    : 'bg-[#1A1A1A] border-gray-700 text-gray-300 hover:bg-[#222222]'          title="Total de Pedidos"

                }`}          value={totalOrders}

              >          icon={TrendingUp}

                {segment || 'Todos'}          color="from-purple-500 to-pink-600"

              </Button>        />

            ))}      </div>

          </div>

        </div>      {/* Filtros e Busca */}

      </Card>      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/50">

        <div className="flex flex-wrap gap-4">

      {/* Table */}          {/* Busca */}

      <Card className="bg-[#111111] border-gray-800">          <div className="flex-1 min-w-[300px]">

        <Table>            <div className="relative">

          <TableHeader>              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

            <TableRow className="border-gray-800 hover:bg-transparent">              <input

              <TableHead className="text-gray-400 font-semibold">Cliente</TableHead>                type="text"

              <TableHead className="text-gray-400 font-semibold">Segmento</TableHead>                placeholder="Buscar por nome, email ou telefone..."

              <TableHead className="text-gray-400 font-semibold text-right">LTV</TableHead>                value={searchTerm}

              <TableHead className="text-gray-400 font-semibold text-right">Pedidos</TableHead>                onChange={(e) => setSearchTerm(e.target.value)}

              <TableHead className="text-gray-400 font-semibold text-right">Ticket Médio</TableHead>                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"

              <TableHead className="text-gray-400 font-semibold">Última Compra</TableHead>              />

              <TableHead className="text-gray-400 font-semibold text-center">Score</TableHead>            </div>

            </TableRow>          </div>

          </TableHeader>

          <TableBody>          {/* Filtro Segmento */}

            {loading ? (          <select

              Array.from({ length: 5 }).map((_, i) => (            value={filterSegment}

                <TableRow key={i} className="border-gray-800">            onChange={(e) => setFilterSegment(e.target.value as any)}

                  <TableCell colSpan={7}>            className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500"

                    <Skeleton className="h-12 w-full bg-gray-800" />          >

                  </TableCell>            <option value="all">Todos os Segmentos</option>

                </TableRow>            <option value="vip">⭐ VIP ({vipCount})</option>

              ))            <option value="regular">👤 Regular ({regularCount})</option>

            ) : customers.length === 0 ? (            <option value="new">🆕 Novo ({newCount})</option>

              <TableRow className="border-gray-800">          </select>

                <TableCell colSpan={7} className="text-center text-gray-500 py-12">

                  Nenhum cliente encontrado          {/* Ordenar por */}

                </TableCell>          <select

              </TableRow>            value={sortBy}

            ) : (            onChange={(e) => setSortBy(e.target.value as any)}

              customers.map((customer) => (            className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500"

                <TableRow          >

                  key={customer.email}            <option value="total_spent">Maior Gasto</option>

                  onClick={() => handleRowClick(customer)}            <option value="total_orders">Mais Pedidos</option>

                  className="border-gray-800 hover:bg-[#1A1A1A] cursor-pointer transition-colors"            <option value="last_purchase_at">Última Compra</option>

                >          </select>

                  <TableCell>

                    <div className="flex items-center gap-3">          <button className="flex items-center gap-2 px-4 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors">

                      <CustomerAvatar name={customer.name} email={customer.email} />            <Download className="w-4 h-4" />

                      <div>            Exportar

                        <p className="font-medium text-white">{customer.name || 'Sem nome'}</p>          </button>

                        <p className="text-sm text-gray-500">{customer.email}</p>        </div>

                      </div>      </div>

                    </div>

                  </TableCell>      {/* Tabela de Clientes */}

                  <TableCell>      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden">

                    <SegmentBadge segment={customer.segment} />        <div className="overflow-x-auto">

                  </TableCell>          <table className="w-full">

                  <TableCell className="text-right">            <thead className="bg-gray-900/50 border-b border-gray-700">

                    <span className="font-bold text-green-400">{formatCurrency(customer.ltv)}</span>              <tr>

                  </TableCell>                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Cliente</th>

                  <TableCell className="text-right text-white">                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Segmento</th>

                    {customer.paid_orders}/{customer.total_orders}                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Total Gasto</th>

                  </TableCell>                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Pedidos</th>

                  <TableCell className="text-right text-gray-300">                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Ticket Médio</th>

                    {formatCurrency(customer.aov)}                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Última Compra</th>

                  </TableCell>                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Ações</th>

                  <TableCell>              </tr>

                    <span className="text-gray-400 text-sm">            </thead>

                      {customer.last_purchase ? getRelativeTime(customer.last_purchase) : 'Nunca'}            <tbody className="divide-y divide-gray-700">

                    </span>              {filteredCustomers.map((customer) => (

                  </TableCell>                <tr key={customer.customer_id} className="hover:bg-gray-700/30 transition-colors">

                  <TableCell className="text-center">                  <td className="px-6 py-4">

                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600">                    <div>

                      <span className="text-white font-bold text-sm">{customer.engagement_score}</span>                      <div className="font-semibold text-white">{customer.name}</div>

                    </div>                      <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">

                  </TableCell>                        <Mail className="w-3 h-3" />

                </TableRow>                        {customer.email}

              ))                      </div>

            )}                      {customer.phone && (

          </TableBody>                        <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">

        </Table>                          <Phone className="w-3 h-3" />

                          {customer.phone}

        {/* Pagination */}                        </div>

        {totalPages > 1 && (                      )}

          <div className="flex items-center justify-between p-4 border-t border-gray-800">                    </div>

            <Button                  </td>

              variant="outline"                  <td className="px-6 py-4">

              onClick={() => setPage(Math.max(1, page - 1))}                    <SegmentBadge segment={customer.segment} />

              disabled={page === 1}                  </td>

              className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#222222] disabled:opacity-50"                  <td className="px-6 py-4">

            >                    <div className="font-bold text-green-400">

              Anterior                      R$ {customer.total_spent.toFixed(2)}

            </Button>                    </div>

            <span className="text-gray-400">                  </td>

              Página {page} de {totalPages}                  <td className="px-6 py-4">

            </span>                    <div className="flex items-center gap-2">

            <Button                      <ShoppingBag className="w-4 h-4 text-blue-400" />

              variant="outline"                      <span className="font-semibold text-white">{customer.total_orders}</span>

              onClick={() => setPage(Math.min(totalPages, page + 1))}                    </div>

              disabled={page === totalPages}                  </td>

              className="bg-[#1A1A1A] border-gray-700 text-white hover:bg-[#222222] disabled:opacity-50"                  <td className="px-6 py-4">

            >                    <div className="text-gray-300">

              Próxima                      R$ {customer.average_order_value.toFixed(2)}

            </Button>                    </div>

          </div>                  </td>

        )}                  <td className="px-6 py-4">

      </Card>                    <div className="flex items-center gap-2 text-sm text-gray-400">

                      <Calendar className="w-4 h-4" />

      {/* Customer Drawer */}                      {format(new Date(customer.last_purchase_at), 'dd/MM/yyyy', { locale: ptBR })}

      {selectedCustomer && (                    </div>

        <CustomerDrawer                  </td>

          customer={selectedCustomer}                  <td className="px-6 py-4 text-right">

          open={drawerOpen}                    <button className="text-brand-400 hover:text-brand-300 font-semibold text-sm transition-colors">

          onClose={() => setDrawerOpen(false)}                      <Eye className="w-5 h-5 inline" />

        />                    </button>

      )}                  </td>

    </div>                </tr>

  );              ))}

}            </tbody>

          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Nenhum cliente encontrado</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Aguardando primeiras vendas'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
