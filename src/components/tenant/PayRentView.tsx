import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { GradientButton } from '../GradientButton';
import { StatusBadge } from '../StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { DollarSign, CreditCard, Smartphone, Building, CheckCircle2, Download, Calendar } from 'lucide-react';

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'upi', name: 'UPI', icon: Smartphone },
  { id: 'bank', name: 'Bank Transfer', icon: Building },
];

const paymentHistory = [
  { id: '1', date: '2025-12-01', amount: 1200, status: 'paid' as const },
  { id: '2', date: '2025-11-01', amount: 1200, status: 'paid' as const },
  { id: '3', date: '2025-10-01', amount: 1200, status: 'paid' as const },
];

export function PayRentView() {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const currentRent = 1200;
  const festivalContribution = 125;
  const totalAmount = currentRent + festivalContribution;

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIsSuccess(true);
    
    // Close after success
    setTimeout(() => {
      setIsSuccess(false);
      setIsPaymentDialogOpen(false);
      setSelectedMethod('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Pay Rent</h2>
        <p className="text-muted-foreground">Make your rent payment securely</p>
      </div>

      {/* Current Payment Due */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Amount Due</p>
            <h3 className="text-4xl font-bold text-primary">${currentRent}</h3>
            <p className="text-sm text-muted-foreground mt-2">Due: January 15, 2026</p>
          </div>
          <StatusBadge status="pending" />
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between py-2 border-t border-border">
            <span className="text-muted-foreground">Monthly Rent</span>
            <span className="font-medium">${currentRent}</span>
          </div>
        </div>

        <GradientButton 
          className="w-full" 
          size="lg"
          onClick={() => setIsPaymentDialogOpen(true)}
        >
          <DollarSign className="w-5 h-5" />
          Pay Now
        </GradientButton>
      </Card>

      {/* Festival Contribution (if any) */}
      {festivalContribution > 0 && (
        <Card className="p-6 border-l-4 border-l-accent">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold mb-1">Festival Contribution</h3>
              <p className="text-sm text-muted-foreground">Diwali Celebration 2026</p>
            </div>
            <StatusBadge status="pending" />
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Your Share</span>
            <span className="text-2xl font-semibold text-accent">${festivalContribution}</span>
          </div>
          <Button variant="outline" className="w-full">
            Pay Festival Contribution
          </Button>
        </Card>
      )}

      {/* Payment History */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Payment History</h3>
        <div className="space-y-3">
          {paymentHistory.map((payment) => (
            <div 
              key={payment.id}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{new Date(payment.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-sm text-muted-foreground">${payment.amount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={payment.status} />
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Choose your payment method and complete the transaction.
            </DialogDescription>
          </DialogHeader>
          
          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground">Your rent has been paid successfully</p>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {/* Amount Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span className="font-medium">${currentRent}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-semibold text-primary text-lg">${currentRent}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="font-medium mb-3">Select Payment Method</p>
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          selectedMethod === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{method.name}</span>
                        {selectedMethod === method.id && (
                          <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPaymentDialogOpen(false)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <GradientButton 
                  onClick={handlePayment}
                  className="flex-1"
                  disabled={!selectedMethod || isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Pay Now'}
                </GradientButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}