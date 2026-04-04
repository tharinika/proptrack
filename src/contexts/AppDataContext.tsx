import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockTenants, mockMaintenanceRequests } from '../data/mockData';
import { toast } from 'sonner@2.0.3';
import { Check } from 'lucide-react';
import { useAuth } from './AuthContext';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Unit {
  id: string;
  number: string;
  status: 'occupied' | 'vacant' | 'maintenance';
  tenant?: string;
  rent: number;
  monthlyElectricity: number;
  maintenanceType?: string; // Type of maintenance (e.g., Plumbing, Electrical, Painting)
}

export interface PropertyCharges {
  maintenanceFee: number;
  waterBill: number;
  gasBill: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  propertyCharges: PropertyCharges;
  units: Unit[];
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  property: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPayment: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  property: string;
  unit: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  method?: string;
  statusChangedAt?: string; // ISO date string tracking when status last changed (especially for overdue)
}

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  property: string;
  unit: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  description: string;
  dateSubmitted: string;
  dateCompleted?: string;
  images?: string[];
}

// ============================================================================
// Context Interface
// ============================================================================

interface AppDataContextType {
  // State
  tenants: Tenant[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  
  // Tenant Actions
  addTenant: (tenant: Omit<Tenant, 'id' | 'paymentStatus' | 'lastPayment'>) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  
  // Payment Actions
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePaymentStatus: (id: string, status: 'paid' | 'pending' | 'overdue', paidDate?: string, method?: string) => void;
  
  // Maintenance Actions
  addMaintenanceRequest: (request: Omit<MaintenanceRequest, 'id' | 'dateSubmitted'>) => void;
  updateMaintenanceStatus: (id: string, status: 'pending' | 'in-progress' | 'completed') => void;
  
  // Analytics (derived state)
  getDashboardMetrics: () => DashboardMetrics;
}

interface DashboardMetrics {
  totalRentCollected: number;
  pendingRent: number;
  overdueRent: number;
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  overduePayments: number;
  paymentStatusDistribution: {
    paid: number;
    pending: number;
    overdue: number;
  };
  maintenanceStats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

// ============================================================================
// Context Creation
// ============================================================================

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Initialize with demo data ONLY for demo users, empty arrays for new landlords
  const [tenants, setTenants] = useState<Tenant[]>(user?.isDemo ? mockTenants : []);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Transform mock maintenance requests to match AppDataContext structure (only for demo users)
  const initialMaintenanceRequests: MaintenanceRequest[] = user?.isDemo 
    ? mockMaintenanceRequests.map((req, index) => ({
        id: req.id,
        tenantId: `tenant-${index + 1}`, // Generate a tenant ID
        tenantName: req.tenant,
        property: req.property,
        unit: req.unit,
        category: req.category,
        priority: req.priority,
        status: req.status === 'new' ? 'pending' : req.status,
        description: req.description,
        dateSubmitted: req.createdAt,
        dateCompleted: req.completedAt,
        images: req.image ? [req.image] : []
      }))
    : [];
  
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(initialMaintenanceRequests);
  const [lastCheckedDate, setLastCheckedDate] = useState<string>('');

  // ============================================================================
  // Real-Time Cross-Context Synchronization
  // ============================================================================

  // Listen for property changes and sync related data
  useEffect(() => {
    const handlePropertyUpdated = (event: CustomEvent) => {
      const { property } = event.detail;
      const oldPropertyName = payments.find(p => p.property !== property.name)?.property;
      
      // Update all payments with the new property name if it changed
      setPayments(prev => prev.map(payment => 
        payment.property === oldPropertyName || payment.property === property.name
          ? { ...payment, property: property.name }
          : payment
      ));
      
      // Update all tenants with the new property name
      setTenants(prev => prev.map(tenant =>
        tenant.property === oldPropertyName || tenant.property === property.name
          ? { ...tenant, property: property.name }
          : tenant
      ));
      
      // Update all maintenance requests with the new property name
      setMaintenanceRequests(prev => prev.map(request =>
        request.property === oldPropertyName || request.property === property.name
          ? { ...request, property: property.name }
          : request
      ));
    };

    const handlePropertyDeleted = (event: CustomEvent) => {
      const { propertyId, propertyName } = event.detail;
      
      // Remove all tenants from deleted property
      const deletedTenantIds = tenants
        .filter(t => t.property === propertyName)
        .map(t => t.id);
      
      setTenants(prev => prev.filter(t => t.property !== propertyName));
      
      // Remove all payments for deleted property/tenants
      setPayments(prev => prev.filter(p => 
        p.property !== propertyName && !deletedTenantIds.includes(p.tenantId)
      ));
      
      // Remove all maintenance requests for deleted property
      setMaintenanceRequests(prev => prev.filter(r => 
        r.property !== propertyName && !deletedTenantIds.includes(r.tenantId)
      ));
      
      // Show notification if data was cleaned up
      if (deletedTenantIds.length > 0) {
        toast.info('Data Synchronized', {
          description: `Removed ${deletedTenantIds.length} tenant(s) and associated data from deleted property`
        });
      }
    };

    window.addEventListener('property-updated', handlePropertyUpdated as EventListener);
    window.addEventListener('property-deleted', handlePropertyDeleted as EventListener);

    return () => {
      window.removeEventListener('property-updated', handlePropertyUpdated as EventListener);
      window.removeEventListener('property-deleted', handlePropertyDeleted as EventListener);
    };
  }, [tenants, payments, maintenanceRequests]);

  // Initialize payments from tenants on mount
  useEffect(() => {
    const initialPayments: Payment[] = tenants.map((tenant, index) => ({
      id: `payment-${tenant.id}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      property: tenant.property,
      unit: tenant.unit,
      amount: tenant.monthlyRent,
      dueDate: '2026-01-01',
      paidDate: tenant.paymentStatus === 'paid' ? tenant.lastPayment : undefined,
      status: tenant.paymentStatus,
      method: tenant.paymentStatus === 'paid' ? 'Bank Transfer' : undefined
    }));
    setPayments(initialPayments);
  }, []);

  // Automatic payment status checker - runs on mount and checks periodically
  useEffect(() => {
    const checkAndUpdatePaymentStatuses = () => {
      const today = new Date();
      const currentDateString = today.toISOString().split('T')[0];
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Check if it's the 1st of the month and we haven't reset today
      const isFirstOfMonth = currentDay === 1;
      const hasResetToday = lastCheckedDate === currentDateString;

      let hasChanges = false;
      const updatedPayments = payments.map(payment => {
        // Skip already paid payments
        if (payment.status === 'paid') {
          return payment;
        }

        const dueDate = new Date(payment.dueDate);
        const isPastDue = today > dueDate;

        // On the 1st of the month, reset non-overdue pending payments
        if (isFirstOfMonth && !hasResetToday) {
          // Generate new due date for current month
          const newDueDate = new Date(currentYear, currentMonth, 1);
          
          // If payment is pending (not overdue), reset it for the new month
          if (payment.status === 'pending' && !isPastDue) {
            hasChanges = true;
            return {
              ...payment,
              dueDate: newDueDate.toISOString().split('T')[0],
              status: 'pending' as const
            };
          }
          
          // If payment is overdue, keep it as overdue
          if (payment.status === 'overdue' || isPastDue) {
            if (payment.status !== 'overdue') {
              hasChanges = true;
            }
            return {
              ...payment,
              status: 'overdue' as const
            };
          }
        }

        // Regular check: mark as overdue if past due date
        // BUT: Only auto-mark as overdue if it's not already manually set to pending
        // This allows landlords to manually keep payments as "pending" even if past due
        // The system will only auto-update to overdue on monthly reset (1st of month)
        if (isPastDue && payment.status !== 'overdue' && payment.status !== 'pending') {
          hasChanges = true;
          return {
            ...payment,
            status: 'overdue' as const
          };
        }

        return payment;
      });

      if (hasChanges) {
        setPayments(updatedPayments);

        // Sync tenant statuses with payment updates
        setTenants(prevTenants => 
          prevTenants.map(tenant => {
            const tenantPayment = updatedPayments.find(p => p.tenantId === tenant.id);
            if (tenantPayment && tenantPayment.status !== tenant.paymentStatus) {
              return {
                ...tenant,
                paymentStatus: tenantPayment.status
              };
            }
            return tenant;
          })
        );
      }

      // Update last checked date if it's the 1st of the month
      if (isFirstOfMonth && !hasResetToday) {
        setLastCheckedDate(currentDateString);
        
        // Show notification about monthly reset
        toast.info('Monthly Payment Reset', {
          description: 'Payment statuses have been updated for the new month'
        });
      }
    };

    // Run immediately on mount
    checkAndUpdatePaymentStatuses();

    // Run every hour to check for status updates
    const intervalId = setInterval(checkAndUpdatePaymentStatuses, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [lastCheckedDate, payments]);

  // ============================================================================
  // Tenant Actions
  // ============================================================================

  const addTenant = (tenantData: Omit<Tenant, 'id' | 'paymentStatus' | 'lastPayment'>) => {
    const newTenant: Tenant = {
      ...tenantData,
      id: `tenant-${Date.now()}`,
      paymentStatus: 'pending',
      lastPayment: ''
    };
    
    setTenants(prev => [...prev, newTenant]);
    
    // Auto-create payment record for new tenant
    const newPayment: Payment = {
      id: `payment-${newTenant.id}`,
      tenantId: newTenant.id,
      tenantName: newTenant.name,
      property: newTenant.property,
      unit: newTenant.unit,
      amount: newTenant.monthlyRent,
      dueDate: '2026-01-01',
      status: 'pending'
    };
    
    setPayments(prev => [...prev, newPayment]);
    
    // Show success notification
    toast.success('Tenant Added', {
      description: `${newTenant.name} has been added to ${newTenant.property} - ${newTenant.unit}`
    });
    
    // Dispatch event for real-time sync
    window.dispatchEvent(new CustomEvent('tenant-added', { 
      detail: { tenant: newTenant } 
    }));
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    const oldTenant = tenants.find(t => t.id === id);
    
    setTenants(prev => prev.map(tenant => 
      tenant.id === id ? { ...tenant, ...updates } : tenant
    ));
    
    // Sync payment records when tenant is updated
    if (updates.property || updates.unit || updates.name || updates.monthlyRent) {
      setPayments(prev => prev.map(payment => {
        if (payment.tenantId === id) {
          return {
            ...payment,
            tenantName: updates.name || payment.tenantName,
            property: updates.property || payment.property,
            unit: updates.unit || payment.unit,
            amount: updates.monthlyRent || payment.amount
          };
        }
        return payment;
      }));
    }
    
    // Sync maintenance requests when tenant is updated
    if (updates.property || updates.unit || updates.name) {
      setMaintenanceRequests(prev => prev.map(request => {
        if (request.tenantId === id) {
          return {
            ...request,
            tenantName: updates.name || request.tenantName,
            property: updates.property || request.property,
            unit: updates.unit || request.unit
          };
        }
        return request;
      }));
    }
    
    // Show success notification
    const updatedTenant = { ...oldTenant, ...updates };
    toast.success('Tenant Updated', {
      description: `${updatedTenant.name}'s information has been successfully updated`
    });
  };

  const deleteTenant = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
    
    // Remove associated payments
    setPayments(prev => prev.filter(p => p.tenantId !== id));
    
    // Remove associated maintenance requests
    setMaintenanceRequests(prev => prev.filter(r => r.tenantId !== id));
  };

  // ============================================================================
  // Payment Actions
  // ============================================================================

  const addPayment = (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `payment-${Date.now()}`
    };
    
    setPayments(prev => [...prev, newPayment]);
  };

  const updatePaymentStatus = (
    id: string, 
    status: 'paid' | 'pending' | 'overdue',
    paidDate?: string,
    method?: string
  ) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    
    // Update payment
    setPayments(prev => prev.map(p => 
      p.id === id ? { 
        ...p, 
        status, 
        paidDate: status === 'paid' ? (paidDate || new Date().toISOString()) : undefined,
        method: status === 'paid' ? (method || p.method) : undefined,
        statusChangedAt: status === 'overdue' ? new Date().toISOString() : undefined
      } : p
    ));
    
    // Sync tenant payment status
    setTenants(prev => prev.map(tenant => {
      if (tenant.id === payment.tenantId) {
        return {
          ...tenant,
          paymentStatus: status,
          lastPayment: status === 'paid' ? (paidDate || new Date().toISOString()) : tenant.lastPayment
        };
      }
      return tenant;
    }));
    
    // Show toast notification based on status
    if (status === 'paid') {
      toast.success('Payment Recorded', {
        description: `${payment.tenantName}'s payment of ₹${payment.amount.toLocaleString()} has been marked as paid`
      });
    } else if (status === 'pending') {
      toast.warning('Payment Pending', {
        description: `${payment.tenantName}'s payment has been marked as pending`
      });
    } else if (status === 'overdue') {
      toast.error('Payment Overdue', {
        description: `${payment.tenantName}'s payment has been marked as overdue`
      });
    }
  };

  // ============================================================================
  // Maintenance Actions
  // ============================================================================

  const addMaintenanceRequest = (requestData: Omit<MaintenanceRequest, 'id' | 'dateSubmitted'>) => {
    const newRequest: MaintenanceRequest = {
      ...requestData,
      id: `maintenance-${Date.now()}`,
      dateSubmitted: new Date().toISOString()
    };
    
    setMaintenanceRequests(prev => [...prev, newRequest]);
    
    toast.success('Maintenance Request Submitted', {
      description: `Request for ${requestData.category} in ${requestData.unit} has been submitted.`,
      icon: <Check className="w-4 h-4" />
    });
  };

  const updateMaintenanceStatus = (
    id: string, 
    status: 'pending' | 'in-progress' | 'completed'
  ) => {
    const request = maintenanceRequests.find(r => r.id === id);
    if (!request) return;
    
    setMaintenanceRequests(prev => prev.map(r => 
      r.id === id ? { 
        ...r, 
        status,
        dateCompleted: status === 'completed' ? new Date().toISOString() : r.dateCompleted
      } : r
    ));
    
    // Show toast notification
    const statusText = status === 'in-progress' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Pending';
    toast.success('Status Updated', {
      description: `Maintenance request for ${request.category} is now ${statusText}.`,
      icon: <Check className="w-4 h-4" />
    });
  };

  // ============================================================================
  // Analytics
  // ============================================================================

  const getDashboardMetrics = (): DashboardMetrics => {
    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    
    const totalRentCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingRent = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate overdue rent with months multiplier
    const overdueRent = overduePayments.reduce((sum, p) => {
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      const monthsDiff = (today.getFullYear() - dueDate.getFullYear()) * 12 + 
                         (today.getMonth() - dueDate.getMonth());
      const monthsOverdue = Math.max(1, monthsDiff);
      
      // Multiply monthly rent by number of months overdue
      return sum + (p.amount * monthsOverdue);
    }, 0);
    
    const pendingMaintenance = maintenanceRequests.filter(r => r.status === 'pending');
    const inProgressMaintenance = maintenanceRequests.filter(r => r.status === 'in-progress');
    const completedMaintenance = maintenanceRequests.filter(r => r.status === 'completed');
    
    return {
      totalRentCollected,
      pendingRent,
      overdueRent,
      totalPayments: payments.length,
      paidPayments: paidPayments.length,
      pendingPayments: pendingPayments.length,
      overduePayments: overduePayments.length,
      paymentStatusDistribution: {
        paid: paidPayments.length,
        pending: pendingPayments.length,
        overdue: overduePayments.length
      },
      maintenanceStats: {
        total: maintenanceRequests.length,
        pending: pendingMaintenance.length,
        inProgress: inProgressMaintenance.length,
        completed: completedMaintenance.length
      }
    };
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AppDataContextType = {
    // State
    tenants,
    payments,
    maintenanceRequests,
    
    // Actions
    addTenant,
    updateTenant,
    deleteTenant,
    addPayment,
    updatePaymentStatus,
    addMaintenanceRequest,
    updateMaintenanceStatus,
    getDashboardMetrics
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}