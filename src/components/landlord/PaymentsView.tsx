import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DollarSign, Calendar, Download, Search, ChevronDown, Home } from 'lucide-react';
import { useAppData } from '../../contexts/AppDataContext';
import { EmptyState } from './EmptyState';

export function PaymentsView() {
  const { payments, updatePaymentStatus, getDashboardMetrics } = useAppData();
  const metrics = getDashboardMetrics();
  const [searchQuery, setSearchQuery] = useState('');

  // NOTE: This view only displays monthly rent payments
  // Festival and community contribution payments are exclusively managed in the Community page
  
  // Filter payments based on search query
  const filteredPayments = payments.filter(payment => 
    payment.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = (paymentId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    updatePaymentStatus(paymentId, newStatus);
  };

  // Calculate overdue months for a payment
  const getOverdueMonths = (payment: any) => {
    if (payment.status !== 'overdue') return 0;
    const dueDate = new Date(payment.dueDate);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - dueDate.getFullYear()) * 12 + 
                       (today.getMonth() - dueDate.getMonth());
    return Math.max(1, monthsDiff);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Payments</h2>
          <p className="text-muted-foreground">Track monthly rent payments</p>
        </div>
      </div>

      {/* Search Bar */}
      {payments.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by tenant, property, unit, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Summary Cards - Auto-synced from global state */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-semibold text-primary">₹{metrics.totalRentCollected.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-semibold text-orange-500">₹{metrics.pendingRent.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue Payments</p>
              <p className="text-2xl font-semibold text-red-500">₹{metrics.overdueRent.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <EmptyState
            icon={DollarSign}
            title="No Payments Yet"
            description="Once you add properties and tenants, you'll be able to track rent payments, festival contributions, and other transactions here."
            actionLabel="View Properties"
            onAction={() => {
              alert('Navigate to Properties tab to add properties and tenants!');
            }}
          />
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{new Date(payment.dueDate).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{payment.tenantName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {payment.property}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{payment.unit}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">₹{payment.amount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="relative inline-block">
                            <select
                              value={payment.status}
                              onChange={(e) => handleStatusChange(payment.id, e.target.value as 'paid' | 'pending' | 'overdue')}
                              className={`appearance-none text-xs font-medium pl-3 pr-8 py-2.5 rounded-lg border border-border bg-background cursor-pointer transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                payment.status === 'paid'
                                  ? 'text-emerald-600 dark:text-emerald-300'
                                  : payment.status === 'pending'
                                  ? 'text-amber-600 dark:text-amber-300'
                                  : 'text-red-600 dark:text-red-300'
                              }`}
                            >
                              <option value="paid">Paid</option>
                              <option value="pending">Pending</option>
                              <option value="overdue">Overdue</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          </div>
                          {payment.status === 'overdue' && getOverdueMonths(payment) > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {getOverdueMonths(payment)} {getOverdueMonths(payment) === 1 ? 'month' : 'months'} overdue
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button 
                          className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{payment.tenantName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs">{new Date(payment.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">₹{payment.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Property</p>
                    <p className="text-sm font-medium">{payment.property}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Unit</p>
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">{payment.unit}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                    <div className="relative inline-block w-full max-w-[140px]">
                      <select
                        value={payment.status}
                        onChange={(e) => handleStatusChange(payment.id, e.target.value as 'paid' | 'pending' | 'overdue')}
                        className={`w-full appearance-none text-xs font-medium pl-3 pr-8 py-2.5 rounded-lg border border-border bg-background cursor-pointer transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          payment.status === 'paid'
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : payment.status === 'pending'
                            ? 'text-amber-600 dark:text-amber-300'
                            : 'text-red-600 dark:text-red-300'
                        }`}
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                    {payment.status === 'overdue' && getOverdueMonths(payment) > 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {getOverdueMonths(payment)} {getOverdueMonths(payment) === 1 ? 'month' : 'months'} overdue
                      </p>
                    )}
                  </div>
                  <button 
                    className="p-3 hover:bg-accent/50 rounded-lg transition-colors flex-shrink-0"
                    title="Download Receipt"
                  >
                    <Download className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}