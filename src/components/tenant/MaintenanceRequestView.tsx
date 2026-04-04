import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { GradientButton } from '../GradientButton';
import { StatusBadge } from '../StatusBadge';
import { Badge } from '../ui/badge';
import { Wrench, Plus, Calendar, Upload, Sparkles, CheckCircle2 } from 'lucide-react';

const mockRequests = [
  {
    id: '1',
    title: 'Leaking faucet in kitchen',
    description: 'Kitchen sink faucet is leaking constantly, wasting water.',
    category: 'Plumbing',
    priority: 'medium' as const,
    status: 'in-progress' as const,
    createdAt: '2026-01-10',
  },
  {
    id: '2',
    title: 'Broken window lock',
    description: 'Bedroom window lock is broken, security concern.',
    category: 'Security',
    priority: 'high' as const,
    status: 'new' as const,
    createdAt: '2026-01-08',
  },
];

export function MaintenanceRequestView() {
  const [requests, setRequests] = useState(mockRequests);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    image: null as File | null
  });

  const handleSubmit = () => {
    const request = {
      id: String(requests.length + 1),
      ...newRequest,
      category: 'General',
      priority: 'medium' as const,
      status: 'new' as const,
      createdAt: new Date().toISOString().split('T')[0],
      image: null
    };
    setRequests([request, ...requests]);
    setIsAddDialogOpen(false);
    setNewRequest({ title: '', description: '', image: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Maintenance Requests</h2>
          <p className="text-muted-foreground">Submit and track your requests</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <GradientButton>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Request</span>
            </GradientButton>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Maintenance Request</DialogTitle>
              <DialogDescription>
                Describe the issue and we'll assign a technician to help you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="issue-title">Issue Title</Label>
                <Input
                  id="issue-title"
                  placeholder="e.g., Leaking faucet"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="issue-description">Description</Label>
                <Textarea
                  id="issue-description"
                  placeholder="Describe the issue in detail..."
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="mt-1.5 min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="issue-image">Photo (Optional)</Label>
                <div className="mt-1.5 border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                  <input
                    id="issue-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setNewRequest({ ...newRequest, image: e.target.files?.[0] || null })}
                  />
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Our AI will automatically categorize and prioritize your request
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <GradientButton onClick={handleSubmit} className="flex-1">
                  Submit Request
                </GradientButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Requests */}
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{request.title}</h3>
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                </div>
              </div>
              <StatusBadge status={request.status} className="flex-shrink-0" />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="w-4 h-4" />
              <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
            </div>

            {/* AI Classification */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI Classification</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-background">
                  {request.category}
                </Badge>
                <StatusBadge status={request.priority} />
              </div>
            </div>

            {request.status === 'completed' && (
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Issue resolved</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {requests.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No Maintenance Requests</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You haven't submitted any maintenance requests yet
          </p>
          <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
            Submit Your First Request
          </Button>
        </Card>
      )}
    </div>
  );
}