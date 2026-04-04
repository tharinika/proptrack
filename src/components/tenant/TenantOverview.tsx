import React from 'react';
import { StatCard } from '../StatCard';
import { Card } from '../ui/card';
import { DollarSign, AlertCircle, Calendar, TrendingUp, CreditCard, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GradientButton } from '../GradientButton';

interface TenantOverviewProps {
  onPayRent: () => void;
}

export function TenantOverview({ onPayRent }: TenantOverviewProps) {
  const { user } = useAuth();
  
  // Mock tenant data
  const tenantData = {
    totalRent: 15000,
    pendingRent: 15000,
    overduePayments: 0,
    nextDueDate: new Date('2026-03-05'),
    unit: 'A-101',
    property: 'Greenwood Apartments',
    lastPaymentDate: new Date('2026-02-01'),
    lastPaymentAmount: 15000,
  };

  const daysUntilDue = Math.ceil(
    (tenantData.nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Recent activity data
  const recentActivity = [
    {
      id: 1,
      type: 'payment',
      description: 'Rent Payment',
      date: tenantData.lastPaymentDate,
      amount: tenantData.lastPaymentAmount,
      status: 'completed' as const,
    },
    {
      id: 2,
      type: 'maintenance',
      description: 'AC Repair Request',
      date: new Date('2026-02-20'),
      status: 'in-progress' as const,
    },
    {
      id: 3,
      type: 'notice',
      description: 'Community Meeting Notice',
      date: new Date('2026-02-15'),
      status: 'completed' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-1">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h2>
        <p className="text-muted-foreground">
          {tenantData.property} - Unit {tenantData.unit}
        </p>
      </div>

      {/* Rent Due Alert */}
      {daysUntilDue <= 5 && tenantData.pendingRent > 0 && (
        <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-500 mb-1">Rent Due Soon</p>
              <p className="text-sm text-muted-foreground">
                Your rent of ₹{tenantData.pendingRent.toLocaleString()} is due in {daysUntilDue} days
              </p>
            </div>
            <GradientButton size="sm" onClick={onPayRent}>
              Pay Now
            </GradientButton>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Rent"
          value={`₹${tenantData.totalRent.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 0, isPositive: true }}
          iconColor="from-primary to-accent"
        />
        <StatCard
          title="Pending Rent"
          value={`₹${tenantData.pendingRent.toLocaleString()}`}
          icon={CreditCard}
          trend={{ value: 0, isPositive: false }}
          iconColor="from-orange-500 to-amber-500"
        />
        <StatCard
          title="Overdue Payments"
          value={`₹${tenantData.overduePayments.toLocaleString()}`}
          icon={AlertCircle}
          trend={{ value: 0, isPositive: true }}
          iconColor="from-red-500 to-rose-500"
        />
        <StatCard
          title="Next Due Date"
          value={tenantData.nextDueDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          icon={Calendar}
          subtitle={`${daysUntilDue} days remaining`}
          iconColor="from-blue-500 to-cyan-500"
        />
      </div>

      {/* Payment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Payment Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-2xl font-semibold text-primary">
                  ₹{tenantData.totalRent.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Last Payment</p>
                <p className="font-medium">
                  {tenantData.lastPaymentDate.toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="text-primary font-semibold">
                ₹{tenantData.lastPaymentAmount.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Next Due</p>
                <p className="font-medium">
                  {tenantData.nextDueDate.toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="text-orange-500 font-semibold">
                {daysUntilDue} days
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'payment'
                      ? 'bg-primary/10'
                      : activity.type === 'maintenance'
                      ? 'bg-orange-500/10'
                      : 'bg-blue-500/10'
                  }`}
                >
                  {activity.type === 'payment' ? (
                    <DollarSign className="w-5 h-5 text-primary" />
                  ) : activity.type === 'maintenance' ? (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  ) : (
                    <Calendar className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.date.toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {'amount' in activity && (
                  <div className="text-sm font-semibold text-primary">
                    ₹{activity.amount.toLocaleString()}
                  </div>
                )}
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-orange-500/10 text-orange-500'
                  }`}
                >
                  {activity.status === 'completed' ? 'Completed' : 'In Progress'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
