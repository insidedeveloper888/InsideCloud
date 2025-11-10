import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line,
  ResponsiveContainer
} from 'recharts';
import {
  Activity, TrendingUp, DollarSign, Target,
  Zap, Award, Briefcase, Heart,
  ChevronRight, Star, ArrowUp, ArrowDown, Minus, X
} from 'lucide-react';
import { handleJSAPIAccess, handleUserAuth } from '../../utils/auth_access_util.js';
import OrganizationSelector, { ORGANIZATION_SLUG_KEY } from '../../components/organizationSelector/index.js';
import './index.css';

// Realistic placeholder data
const companyData = {
  annualTarget: 1000000,
  currentProgress: 750000,
  monthlyRevenue: 125000,
  monthlyExpenses: 85000,
  profitMargin: 32,
  kpiAchievement: 78
};

const departmentData = [
  {
    id: 'marketing',
    name: 'Marketing',
    nameChinese: '营销',
    status: 'healthy',
    kpis: {
      opportunityValue: { value: 450000, target: 500000, trend: 'up' },
      leadConversion: { value: 24, target: 30, trend: 'up' },
      campaignROI: { value: 3.2, target: 4.0, trend: 'stable' }
    },
    chartData: [
      { month: 'Jan', value: 380000 },
      { month: 'Feb', value: 420000 },
      { month: 'Mar', value: 450000 }
    ]
  },
  {
    id: 'sales',
    name: 'Sales',
    nameChinese: '销售',
    status: 'healthy',
    kpis: {
      dealsClosedValue: { value: 320000, target: 350000, trend: 'up' },
      averageDealSize: { value: 12500, target: 15000, trend: 'up' },
      conversionRate: { value: 18, target: 20, trend: 'stable' }
    },
    chartData: [
      { month: 'Jan', value: 280000 },
      { month: 'Feb', value: 300000 },
      { month: 'Mar', value: 320000 }
    ]
  },
  {
    id: 'operation',
    name: 'Operation',
    nameChinese: '运营',
    status: 'at-risk',
    kpis: {
      ordersFulfilled: { value: 142, target: 160, trend: 'down' },
      serviceEfficiency: { value: 87, target: 95, trend: 'stable' },
      customerSatisfaction: { value: 4.2, target: 4.5, trend: 'up' }
    },
    chartData: [
      { month: 'Jan', value: 155 },
      { month: 'Feb', value: 148 },
      { month: 'Mar', value: 142 }
    ]
  },
  {
    id: 'finance',
    name: 'Finance',
    nameChinese: '财务',
    status: 'healthy',
    kpis: {
      receivablesCollected: { value: 92, target: 95, trend: 'up' },
      costRatio: { value: 68, target: 65, trend: 'down' },
      cashFlow: { value: 185000, target: 200000, trend: 'up' }
    },
    chartData: [
      { month: 'Jan', value: 88 },
      { month: 'Feb', value: 90 },
      { month: 'Mar', value: 92 }
    ]
  },
  {
    id: 'account',
    name: 'Account',
    nameChinese: '会计',
    status: 'healthy',
    kpis: {
      recordAccuracy: { value: 99.2, target: 99.5, trend: 'stable' },
      reportTimeliness: { value: 95, target: 98, trend: 'up' },
      complianceScore: { value: 98, target: 100, trend: 'stable' }
    },
    chartData: [
      { month: 'Jan', value: 98.8 },
      { month: 'Feb', value: 99.0 },
      { month: 'Mar', value: 99.2 }
    ]
  },
  {
    id: 'hr',
    name: 'HR',
    nameChinese: '人力',
    status: 'healthy',
    kpis: {
      employeeRetention: { value: 94, target: 95, trend: 'stable' },
      trainingProgress: { value: 78, target: 85, trend: 'up' },
      satisfaction: { value: 4.3, target: 4.5, trend: 'up' }
    },
    chartData: [
      { month: 'Jan', value: 92 },
      { month: 'Feb', value: 93 },
      { month: 'Mar', value: 94 }
    ]
  }
];

const announcements = [
  {
    id: 1,
    type: 'announcement',
    title: 'Q1 Performance Review Complete',
    content: 'All departments have successfully completed their quarterly reviews. Overall company performance exceeds expectations.',
    timestamp: '2024-03-15',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
    files: [
      { name: 'Q1 Review Summary.pdf', url: '#' },
      { name: 'Department KPIs.xlsx', url: '#' }
    ]
  },
  {
    id: 2,
    type: 'birthday',
    title: 'Happy Birthday Sarah Chen!',
    content: "Celebrating our Marketing Director's birthday today. Join us for cake at 3 PM!",
    timestamp: '2024-03-15',
    image: 'https://images.unsplash.com/photo-1519681393784-3cdf85c2fafd?q=80&w=1200&auto=format&fit=crop',
    files: []
  },
  {
    id: 3,
    type: 'policy',
    title: 'New Remote Work Policy',
    content: 'Updated hybrid work guidelines now in effect. Check your email for detailed information.',
    timestamp: '2024-03-14',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop',
    files: [
      { name: 'Remote Work Policy.pdf', url: '#' }
    ]
  },
  {
    id: 4,
    type: 'achievement',
    title: 'Client Milestone Reached',
    content: 'Successfully onboarded our 100th SME client this quarter. Congratulations to the entire team!',
    timestamp: '2024-03-13',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
    files: [
      { name: 'Press Release.docx', url: '#' }
    ]
  }
];

const employees = [
  {
    id: 1,
    name: 'Alex Wong',
    department: 'Sales',
    achievement: 'Top Performer - 150% of target',
    avatar: 'AW',
    metric: '150%'
  },
  {
    id: 2,
    name: 'Sarah Chen',
    department: 'Marketing',
    achievement: 'Campaign Excellence Award',
    avatar: 'SC',
    metric: '320% ROI'
  },
  {
    id: 3,
    name: 'David Lim',
    department: 'Operation',
    achievement: 'Process Optimization Leader',
    avatar: 'DL',
    metric: '25% Efficiency'
  }
];

const milestones = [
  {
    id: 1,
    title: 'Q1 Review Complete',
    date: '2024-03-15',
    status: 'completed',
    description: 'Quarterly performance review and planning session'
  },
  {
    id: 2,
    title: 'New CRM Launch',
    date: '2024-04-01',
    status: 'upcoming',
    description: 'Company-wide CRM system implementation'
  },
  {
    id: 3,
    title: 'Team Building Event',
    date: '2024-04-15',
    status: 'upcoming',
    description: 'Annual company retreat and team building activities'
  },
  {
    id: 4,
    title: 'Q2 Planning',
    date: '2024-04-30',
    status: 'upcoming',
    description: 'Strategic planning for second quarter objectives'
  },
  {
    id: 5,
    title: 'Mid-Year Review',
    date: '2024-06-30',
    status: 'planned',
    description: 'Comprehensive mid-year performance evaluation'
  }
];

// Header Component
const Header = ({ userInfo }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [companyStatus] = useState('healthy');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.header
      className="glass-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <motion.div
          className="flex items-center space-x-4"
          whileHover={{ scale: 1.02 }}
        >
          {/* User Profile Section */}
          <div className="flex items-center space-x-3 mr-6">
            <img
              src={userInfo?.avatar_url || '/default-avatar.png'}
              alt="User Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow-lg shadow-cyan-400/20"
            />
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm">
                Hi! {userInfo?.en_name || 'User'}
              </span>
              <span className="text-gray-400 text-xs">
                Welcome to Inside Advisory
              </span>
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-gray-600 mr-4"></div>

          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-space font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Internal Intelligence Hub
          </h1>
        </motion.div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-lg font-mono text-cyan-400">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-400">
              {currentTime.toLocaleDateString()}
            </div>
          </div>

          <motion.div
            className={`flex items-center space-x-2 px-3 py-2 rounded-full ${companyStatus === 'healthy' ? 'bg-green-500/20 border border-green-500/30' : 'bg-amber-500/20 border border-amber-500/30'
              }`}
            animate={{
              boxShadow: companyStatus === 'healthy'
                ? ['0 0 10px rgba(34, 197, 94, 0.3)', '0 0 20px rgba(34, 197, 94, 0.6)', '0 0 10px rgba(34, 197, 94, 0.3)']
                : ['0 0 10px rgba(245, 158, 11, 0.3)', '0 0 20px rgba(245, 158, 11, 0.6)', '0 0 10px rgba(245, 158, 11, 0.3)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className={`w-2 h-2 rounded-full ${companyStatus === 'healthy' ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className={`text-sm font-medium ${companyStatus === 'healthy' ? 'text-green-400' : 'text-amber-400'}`}>
              {companyStatus === 'healthy' ? 'Healthy' : 'At Risk'}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

// Company Overview Panel
const CompanyOverview = () => {
  const progressPercentage = (companyData.currentProgress / companyData.annualTarget) * 100;

  return (
    <motion.section
      className="company-overview"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="container mx-auto px-6 py-12">
        <div className="glass-panel p-8 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="network-lines"></div>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-space font-bold text-white mb-2">Company Performance Overview</h2>
              <p className="text-gray-400">Real-time insights into our progress and achievements</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Progress Circle */}
              <div className="flex justify-center">
                <div className="relative w-64 h-64">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="rgba(59, 130, 246, 0.1)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progressPercentage / 100) }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                      className="text-4xl font-bold text-cyan-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.8, delay: 1 }}
                    >
                      {Math.round(progressPercentage)}%
                    </motion.div>
                    <div className="text-sm text-gray-400">Annual Target</div>
                    <div className="text-lg text-white font-semibold">
                      RM {(companyData.currentProgress / 1000).toFixed(0)}K / {(companyData.annualTarget / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  className="glass-card p-4"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    <ArrowUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">RM {(companyData.monthlyRevenue / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-gray-400">Revenue This Month</div>
                </motion.div>

                <motion.div
                  className="glass-card p-4"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-6 h-6 text-red-400" />
                    <ArrowDown className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">RM {(companyData.monthlyExpenses / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-gray-400">Expenses This Month</div>
                </motion.div>

                <motion.div
                  className="glass-card p-4"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-6 h-6 text-purple-400" />
                    <ArrowUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{companyData.profitMargin}%</div>
                  <div className="text-sm text-gray-400">Profit Margin</div>
                </motion.div>

                <motion.div
                  className="glass-card p-4"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-6 h-6 text-cyan-400" />
                    <ArrowUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{companyData.kpiAchievement}%</div>
                  <div className="text-sm text-gray-400">KPI Achievement</div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

// Department Performance Section
const DepartmentPerformance = () => {
  const [, setSelectedDepartment] = useState(null);

  return (
    <motion.section
      className="department-performance py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-space font-bold text-white mb-4">Departmental Performance</h2>
          <p className="text-gray-400">Interactive overview of all department KPIs and metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentData.map((dept, index) => (
            <motion.div
              key={dept.id}
              className={`glass-card p-6 cursor-pointer transition-all duration-300 ${dept.status === 'healthy' ? 'border-green-500/30' : 'border-amber-500/30'
                }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              onClick={() => setSelectedDepartment(dept)}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{dept.name}</h3>
                  <p className="text-sm text-gray-400 text-align-left">{dept.nameChinese}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${dept.status === 'healthy' ? 'bg-green-500' : 'bg-amber-500'
                  } animate-pulse`} />
              </div>

              <div className="space-y-3">
                {Object.entries(dept.kpis).slice(0, 2).map(([key, kpi]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">
                        {typeof kpi.value === 'number' && kpi.value > 1000
                          ? `${(kpi.value / 1000).toFixed(0)}K`
                          : kpi.value}
                      </span>
                      {kpi.trend === 'up' && <ArrowUp className="w-3 h-3 text-green-400" />}
                      {kpi.trend === 'down' && <ArrowDown className="w-3 h-3 text-red-400" />}
                      {kpi.trend === 'stable' && <Minus className="w-3 h-3 text-gray-400" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dept.chartData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={dept.status === 'healthy' ? '#22d3ee' : '#f59e0b'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                <span className="text-xs text-gray-500">View Details</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Announcements Section
const Announcements = () => {
  const [openItem, setOpenItem] = useState(null);
  return (
    <motion.section
      className="announcements py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-space font-bold text-white mb-2">Company Announcements</h2>
          <p className="text-gray-400">Latest announcements and important information</p>
        </div>

        <div className="grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((announcement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-panel p-6 relative overflow-hidden h-full cursor-pointer"
              onClick={() => setOpenItem(announcement)}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-3 mb-2">
                  {announcement.type === 'birthday' && <Heart className="w-6 h-6 text-pink-400" />}
                  {announcement.type === 'announcement' && <Zap className="w-6 h-6 text-cyan-400" />}
                  {announcement.type === 'policy' && <Briefcase className="w-6 h-6 text-purple-400" />}
                  {announcement.type === 'achievement' && <Award className="w-6 h-6 text-yellow-400" />}
                  <h3 className="text-lg font-bold text-white truncate">{announcement.title}</h3>
                </div>

                <p className="text-gray-300 mb-4 text-sm leading-relaxed">{announcement.content}</p>

                <p className="text-xs text-gray-500 mt-auto">{announcement.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {openItem && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenItem(null)}
          >
            <motion.div
              className="glass-panel max-w-2xl w-full p-6 relative"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-white hover:bg-white/10 p-1"
                onClick={() => setOpenItem(null)}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2 bg-transparent">
                {openItem?.type === 'birthday' && <Heart className="w-6 h-6 text-pink-400" />}
                {openItem?.type === 'announcement' && <Zap className="w-6 h-6 text-cyan-400" />}
                {openItem?.type === 'policy' && <Briefcase className="w-6 h-6 text-purple-400" />}
                {openItem?.type === 'achievement' && <Award className="w-6 h-6 text-yellow-400" />}
                <h3 className="text-xl font-bold text-white">{openItem?.title}</h3>
              </div>

              <span className="text-sm text-gray-400 mb-3 inline-block bg-transparent">{openItem?.timestamp}</span>

              {openItem?.image && (
                <img
                  src={openItem.image}
                  alt="announcement"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              <p className="text-gray-200 leading-relaxed mb-4">{openItem?.content}</p>

              {openItem?.files && openItem.files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-400 mb-2">Attachments</p>
                  <ul className="space-y-2">
                    {openItem.files.map((file, idx) => (
                      <li key={idx}>
                        <a
                          href={file.url}
                          className="text-cyan-400 hover:text-cyan-300 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

// Employee Spotlight Section
const EmployeeSpotlight = () => {
  return (
    <motion.section
      className="employee-spotlight py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.8 }}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-space font-bold text-white mb-2">Employee Spotlight</h2>
          <p className="text-gray-400">Celebrating our top performers and achievements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {employees.map((employee, index) => (
            <motion.div
              key={employee.id}
              className="glass-card p-6 text-center relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -10 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                  {employee.avatar}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{employee.name}</h3>
                <p className="text-cyan-400 mb-2">{employee.department}</p>
                <p className="text-gray-300 text-sm mb-4">{employee.achievement}</p>
                <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-white font-semibold">{employee.metric}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

// Company Roadmap Section
const CompanyRoadmap = () => {
  return (
    <motion.section
      className="company-roadmap py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 1.0 }}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-space font-bold text-white mb-2">Company Roadmap & Milestones</h2>
          <p className="text-gray-400">Our journey through 2024 and beyond</p>
        </div>

        <div className="glass-panel p-8">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600"></div>

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  className="relative flex items-start space-x-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className={`relative z-10 w-4 h-4 rounded-full border-2 ${milestone.status === 'completed' ? 'bg-green-500 border-green-500' :
                    milestone.status === 'upcoming' ? 'bg-cyan-400 border-cyan-400' :
                      'bg-gray-600 border-gray-600'
                    }`}>
                    {milestone.status === 'completed' && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-green-500"
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{milestone.title}</h3>
                      <span className="text-sm text-gray-400">{milestone.date}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{milestone.description}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${milestone.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        milestone.status === 'upcoming' ? 'bg-cyan-500/20 text-cyan-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                        {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

// Footer Component
const Footer = () => {
  const [uptime] = useState('99.9%');
  const [version] = useState('v2.1.3');

  return (
    <motion.footer
      className="footer py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 1.2 }}
    >
      <div className="container mx-auto px-6">
        <div className="glass-panel p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-8 mb-4 md:mb-0">
              <div className="text-center">
                <div className="text-sm text-gray-400">System Uptime</div>
                <div className="text-green-400 font-semibold">{uptime}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Version</div>
                <div className="text-cyan-400 font-semibold">{version}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Last Updated</div>
                <div className="text-purple-400 font-semibold">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            <motion.div
              className="text-center"
              animate={{
                textShadow: [
                  '0 0 10px rgba(34, 211, 238, 0.5)',
                  '0 0 20px rgba(34, 211, 238, 0.8)',
                  '0 0 10px rgba(34, 211, 238, 0.5)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="text-xl font-space font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                "Digitize. Analyze. Optimize."
              </div>
              <div className="text-sm text-gray-400 mt-1">Inside Advisory - Empowering Malaysian SMEs</div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

// Main Dashboard Component
const InternalIntelligenceHub = ({ userInfo }) => {
  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated background particles */}
      <div className="fixed inset-0 z-0">
        <div className="particles"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <Header userInfo={userInfo} />
        <CompanyOverview />
        <Announcements />
        <DepartmentPerformance />
        <EmployeeSpotlight />
        <CompanyRoadmap />
        <Footer />
      </div>
    </div>
  );
};

// Main Home component that handles authentication
const Home = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [organizationSlug, setOrganizationSlug] = useState(null);
  const [showOrganizationSelector, setShowOrganizationSelector] = useState(true);

  useEffect(() => {
    // Check if organization is already selected
    const savedOrgSlug = localStorage.getItem(ORGANIZATION_SLUG_KEY);
    if (savedOrgSlug) {
      setOrganizationSlug(savedOrgSlug);
      setShowOrganizationSelector(false);
      initializeAuth(savedOrgSlug);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleOrganizationSelected = (slug, orgInfo) => {
    if (slug) {
      setOrganizationSlug(slug);
      setShowOrganizationSelector(false);
      setIsLoading(true);
      initializeAuth(slug);
    } else {
      // Skip organization selection (single-tenant mode)
      setShowOrganizationSelector(false);
      setIsLoading(true);
      initializeAuth(null);
    }
  };

  const initializeAuth = async (orgSlug) => {
    try {
      console.log('🚀 Starting authentication process...');
      console.log('🔍 Checking if Lark SDK is available...');

      // Check if Lark SDK is available
      if (typeof window.h5sdk === 'undefined') {
        console.warn('⚠️ Lark SDK not available, running in development mode');
        // In development mode, create mock user data
        const mockUserInfo = {
          access_token: 'mock_token',
          avatar_url: 'https://via.placeholder.com/40',
          en_name: 'Development User',
          name: '开发用户'
        };
        setUserInfo(mockUserInfo);
        setIsLoading(false);
        return;
      }

      console.log('✅ Lark SDK is available');
      if (orgSlug) {
        console.log(`🔍 Multi-tenant mode: Using organization: ${orgSlug}`);
      }

      // First handle JSAPI access
      console.log('🔐 Starting JSAPI authentication...');
      const jsapiSuccess = await new Promise((resolve) => {
        handleJSAPIAccess((success) => {
          console.log('🔐 JSAPI Access result:', success);
          resolve(success);
        }, orgSlug);
      });

      if (!jsapiSuccess) {
        throw new Error('JSAPI authentication failed');
      }

      // Then handle user authentication
      console.log('👤 Starting user authentication...');
      const userData = await new Promise((resolve) => {
        handleUserAuth((userData) => {
          console.log('👤 User auth result:', userData);
          resolve(userData);
        }, orgSlug);
      });

      if (userData) {
        console.log('✅ Authentication successful:', userData);
        setUserInfo(userData);
      } else {
        console.warn('⚠️ No user data received');
      }

    } catch (error) {
      console.error('❌ Authentication error:', error);
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showOrganizationSelector) {
    return <OrganizationSelector onOrganizationSelected={handleOrganizationSelected} />;
  }

  if (isLoading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>🔐</div>
          <div>Authenticating with Lark...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
            Please wait while we connect to Lark
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="error-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>❌</div>
          <div style={{ marginBottom: '10px' }}>Authentication Failed</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {authError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <InternalIntelligenceHub userInfo={userInfo} />;
};

export default Home;