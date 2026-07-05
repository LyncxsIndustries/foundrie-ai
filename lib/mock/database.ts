export interface StatCard {
  id: string;
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  percentage: string;
  icon: string;
}

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  action: string;
  target: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface ChartDataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

export const staticDatabase = {
  user: {
    name: 'Alex Rivera',
    role: 'Product Designer',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    initials: 'AR'
  },
  stats: [
    {
      id: 'stat-1',
      title: 'Total Revenue',
      value: '$124,563.00',
      trend: 'up',
      percentage: '+14.5%',
      icon: 'dollar'
    },
    {
      id: 'stat-2',
      title: 'Active Users',
      value: '12,483',
      trend: 'up',
      percentage: '+5.2%',
      icon: 'users'
    },
    {
      id: 'stat-3',
      title: 'Conversion Rate',
      value: '4.2%',
      trend: 'down',
      percentage: '-1.1%',
      icon: 'activity'
    },
    {
      id: 'stat-4',
      title: 'Server Uptime',
      value: '99.99%',
      trend: 'neutral',
      percentage: '0.0%',
      icon: 'server'
    }
  ] as StatCard[],
  activities: [
    {
      id: 'act-1',
      user: { name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', initials: 'SC' },
      action: 'Deployed new version',
      target: 'Production-API',
      time: '2 mins ago',
      status: 'completed'
    },
    {
      id: 'act-2',
      user: { name: 'Michael Ross', avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d', initials: 'MR' },
      action: 'Failed database backup',
      target: 'DB-Cluster-01',
      time: '1 hour ago',
      status: 'failed'
    },
    {
      id: 'act-3',
      user: { name: 'Emma Watson', avatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d', initials: 'EW' },
      action: 'Created new project',
      target: 'Foundrie AI Redesign',
      time: '3 hours ago',
      status: 'completed'
    },
    {
      id: 'act-4',
      user: { name: 'James Smith', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704c', initials: 'JS' },
      action: 'Running integration tests',
      target: 'CI/CD Pipeline',
      time: '5 hours ago',
      status: 'pending'
    }
  ] as ActivityItem[],
  chartData: [
    { month: 'Jan', revenue: 4000, expenses: 2400 },
    { month: 'Feb', revenue: 3000, expenses: 1398 },
    { month: 'Mar', revenue: 2000, expenses: 9800 },
    { month: 'Apr', revenue: 2780, expenses: 3908 },
    { month: 'May', revenue: 1890, expenses: 4800 },
    { month: 'Jun', revenue: 2390, expenses: 3800 },
    { month: 'Jul', revenue: 3490, expenses: 4300 },
  ] as ChartDataPoint[]
};
