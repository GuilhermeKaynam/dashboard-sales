import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format, subDays, subHours, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, DollarSign, ShoppingCart, Users, Activity } from 'lucide-react';

// Generate more realistic historical data for 2025
const generateHistoricalData = () => {
  const data = [];
  const baseRevenue = 20000; // Base revenue of R$20k
  const seasonalityFactors = {
    0: 1.1,  // January (post-holiday still good)
    1: 0.9,  // February (slower)
    2: 1.0,  // March
    3: 1.0,  // April
    4: 1.2,  // May (Mother's Day)
    5: 0.9,  // June
    6: 1.0,  // July
    7: 0.9,  // August
    8: 1.1,  // September
    9: 1.2,  // October
    10: 1.3, // November (Black Friday)
    11: 1.4  // December (holiday season)
  };

  // Generate data for the entire year of 2025
  const startDate = new Date(2025, 0, 1);
  const endDate = new Date(2025, 11, 31);
  
  for (let currentDate = startDate; currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
    const month = currentDate.getMonth();
    const dayOfWeek = currentDate.getDay();
    
    // Add daily and weekly variations
    const seasonality = seasonalityFactors[month];
    const weekdayFactor = [1, 2, 3, 4, 5].includes(dayOfWeek) ? 1.2 : 0.8; // Weekdays have higher sales
    const randomFactor = 0.8 + Math.random() * 0.4; // Random variation between 0.8 and 1.2
    
    const dailyRevenue = Math.floor(baseRevenue * seasonality * weekdayFactor * randomFactor);
    const orders = Math.floor(dailyRevenue / 200); // Average order value of R$200
    const activeUsers = Math.floor(orders * 8 + Math.random() * 100); // Each order brings ~8 visitors
    const conversionRate = ((orders / activeUsers) * 100).toFixed(1);

    data.push({
      date: new Date(currentDate),
      value: dailyRevenue,
      orders: orders,
      activeUsers: activeUsers,
      conversionRate: conversionRate,
      avgTicket: Math.floor(dailyRevenue / orders)
    });
  }

  // Generate hourly data for the last 48 hours
  const now = new Date();
  const hourlyData = [];
  for (let i = 48; i >= 0; i--) {
    const date = subHours(now, i);
    const hour = date.getHours();
    const businessHourFactor = (hour >= 8 && hour <= 18) ? 1.5 : 0.5; // Higher sales during business hours
    const randomHourlyFactor = 0.7 + Math.random() * 0.6;
    
    const hourlyRevenue = Math.floor((baseRevenue / 24) * businessHourFactor * randomHourlyFactor);
    const hourlyOrders = Math.floor(hourlyRevenue / 200);
    const hourlyUsers = Math.floor(hourlyOrders * 8 + Math.random() * 20);
    
    hourlyData.push({
      date: date,
      value: hourlyRevenue,
      orders: hourlyOrders,
      activeUsers: hourlyUsers,
      conversionRate: ((hourlyOrders / hourlyUsers) * 100).toFixed(1),
      avgTicket: Math.floor(hourlyRevenue / hourlyOrders)
    });
  }

  // Replace the last 48 hours of daily data with hourly data
  return [...data.slice(0, -2), ...hourlyData];
};

const historicalData = generateHistoricalData();

const dateRanges = [
  { label: 'Últimas 24 horas', value: '24h' },
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Último mês', value: '1m' },
  { label: 'Mês passado', value: 'last_m' },
  { label: 'Este ano', value: 'year' }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Animated counter component
const AnimatedValue = ({ value, prefix = '', suffix = '' }: { value: string, prefix?: string, suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
  
  useEffect(() => {
    let startValue = parseFloat(displayValue.replace(/[^0-9.-]+/g, ""));
    const step = (numericValue - startValue) / 20;
    let current = startValue;
    
    const timer = setInterval(() => {
      current += step;
      if ((step > 0 && current >= numericValue) || (step < 0 && current <= numericValue)) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(`${prefix}${Math.floor(current).toLocaleString('pt-BR')}${suffix}`);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
};

const StatCard = ({ icon: Icon, title, value, trend, subtitle }: { 
  icon: React.ElementType, 
  title: string, 
  value: string, 
  trend: string,
  subtitle?: string 
}) => (
  <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg border border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/15">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-emerald-500/30 p-3 rounded-full">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={`text-sm font-medium px-2 py-1 rounded-full ${
        trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
      }`}>
        {trend}
      </div>
    </div>
    <div>
      <p className="text-white/90 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white mb-2">
        <AnimatedValue value={value} />
      </h3>
      {subtitle && (
        <p className="text-white/60 text-xs">{subtitle}</p>
      )}
    </div>
  </div>
);

function App() {
  const [selectedRange, setSelectedRange] = useState('7d');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const { filteredData, stats } = useMemo(() => {
    const today = new Date();
    let startDate, endDate;

    switch (selectedRange) {
      case '24h':
        startDate = subHours(today, 24);
        endDate = today;
        break;
      case '7d':
        startDate = subDays(today, 7);
        endDate = today;
        break;
      case '1m':
        startDate = startOfMonth(today);
        endDate = today;
        break;
      case 'last_m':
        startDate = startOfMonth(subDays(startOfMonth(today), 1));
        endDate = endOfMonth(subDays(startOfMonth(today), 1));
        break;
      case 'year':
        startDate = new Date(2025, 0, 1);
        endDate = new Date(2025, 11, 31);
        break;
      default:
        startDate = subDays(today, 7);
        endDate = today;
    }

    const filtered = historicalData.filter(item => 
      isWithinInterval(item.date, { start: startDate, end: endDate })
    );

    // Calculate stats for the period
    const totalRevenue = filtered.reduce((sum, item) => sum + item.value, 0);
    const totalOrders = filtered.reduce((sum, item) => sum + item.orders, 0);
    const totalUsers = filtered.reduce((sum, item) => sum + item.activeUsers, 0);
    const avgTicket = totalRevenue / totalOrders;
    
    // Calculate trends
    const midPoint = Math.floor(filtered.length / 2);
    const firstHalf = filtered.slice(0, midPoint);
    const secondHalf = filtered.slice(midPoint);
    
    const calculateTrend = (current: number, previous: number) => 
      previous === 0 ? 0 : ((current - previous) / previous * 100);

    const revenueTrend = calculateTrend(
      secondHalf.reduce((sum, item) => sum + item.value, 0),
      firstHalf.reduce((sum, item) => sum + item.value, 0)
    );
    
    const ordersTrend = calculateTrend(
      secondHalf.reduce((sum, item) => sum + item.orders, 0),
      firstHalf.reduce((sum, item) => sum + item.orders, 0)
    );

    const usersTrend = calculateTrend(
      secondHalf.reduce((sum, item) => sum + item.activeUsers, 0),
      firstHalf.reduce((sum, item) => sum + item.activeUsers, 0)
    );

    const conversionTrend = calculateTrend(
      (secondHalf.reduce((sum, item) => sum + parseFloat(item.conversionRate), 0) / secondHalf.length),
      (firstHalf.reduce((sum, item) => sum + parseFloat(item.conversionRate), 0) / firstHalf.length)
    );

    return {
      filteredData: filtered.map(item => ({
        ...item,
        date: format(item.date, 
          selectedRange === '24h' ? 'HH:mm' :
          selectedRange === 'year' ? 'MMM dd' : 
          'dd MMM',
          { locale: ptBR }
        )
      })),
      stats: {
        revenue: formatCurrency(totalRevenue),
        orders: totalOrders.toLocaleString('pt-BR'),
        activeUsers: totalUsers.toLocaleString('pt-BR'),
        avgTicket: formatCurrency(avgTicket),
        trends: {
          revenue: `${revenueTrend > 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`,
          orders: `${ordersTrend > 0 ? '+' : ''}${ordersTrend.toFixed(1)}%`,
          users: `${usersTrend > 0 ? '+' : ''}${usersTrend.toFixed(1)}%`,
          conversion: `${conversionTrend > 0 ? '+' : ''}${conversionTrend.toFixed(1)}%`
        }
      }
    };
  }, [selectedRange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard de Vendas</h1>
            <p className="text-emerald-200 text-sm">Acompanhamento em tempo real das métricas de vendas</p>
          </div>
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="w-full sm:w-auto bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value} className="text-gray-900">
                {range.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            title="Receita Total"
            value={stats.revenue}
            trend={stats.trends.revenue}
            subtitle="Valor total de vendas no período"
          />
          <StatCard
            icon={ShoppingCart}
            title="Pedidos"
            value={stats.orders}
            trend={stats.trends.orders}
            subtitle={`Ticket médio: ${stats.avgTicket}`}
          />
          <StatCard
            icon={Users}
            title="Visitantes"
            value={stats.activeUsers}
            trend={stats.trends.users}
            subtitle="Usuários ativos no período"
          />
          <StatCard
            icon={Activity}
            title="Taxa de Conversão"
            value={`${((parseInt(stats.orders.replace(/\D/g, '')) / parseInt(stats.activeUsers.replace(/\D/g, ''))) * 100).toFixed(1)}%`}
            trend={stats.trends.conversion}
            subtitle="Visitantes convertidos em vendas"
          />
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Análise de Receita</h2>
              <p className="text-emerald-200 text-sm">
                {hoveredDate ? 
                  `Receita para ${hoveredDate}: ${formatCurrency(filteredData.find(d => d.date === hoveredDate)?.value || 0)}` : 
                  'Passe o mouse sobre o gráfico para ver detalhes'}
              </p>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={filteredData}
                onMouseMove={(e) => {
                  if (e.activeLabel) {
                    setHoveredDate(e.activeLabel);
                  }
                }}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="date" 
                  axisLine={{ stroke: '#ffffff40' }}
                  tickLine={false}
                  tick={{ fill: '#fff', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={{ stroke: '#ffffff40' }}
                  tickLine={false}
                  tick={{ fill: '#fff', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Receita"
                  stroke="#4ade80"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 8, fill: '#4ade80' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;