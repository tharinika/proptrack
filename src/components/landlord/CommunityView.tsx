import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { GradientButton } from '../GradientButton';
import { EmptyState } from './EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useProperties } from '../../contexts/PropertiesContext';
import { useCommunity } from '../../contexts/CommunityContext';
import { useAppData } from '../../contexts/AppDataContext';
import { MessageCircle, Send, Users, DollarSign, PartyPopper, Crown, User, ChevronDown, CheckCircle2, Clock, AlertCircle, ChevronUp, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockTenants } from '../../data/mockData';
import { toast } from 'sonner@2.0.3';
import { supabase } from "../../lib/supabase"


interface Message {
  id: string;
  sender: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  type: 'text' | 'payment-request';
  paymentAmount?: number;
  festivalPaymentId?: string;
}

interface PersonalMessage {
  id: string;
  sender: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  isRead: boolean;
}

export function CommunityView() {

  const { user } = useAuth();
  const { properties } = useProperties();
  const { communities, personalChats, addMessage, createFestivalPayment, updateFestivalPaymentStatus, addPersonalMessage, createPersonalChat, markPersonalChatAsRead } = useCommunity();
  const { tenants } = useAppData();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isFestivalDialogOpen, setIsFestivalDialogOpen] = useState(false);
  const [festivalName, setFestivalName] = useState('');
  const [festivalAmount, setFestivalAmount] = useState(500);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
const [messages, setMessages] = useState<any[]>([])
  const propertyId = selectedCommunityId
  const fetchMessages = async () => {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("property_id", propertyId)

  setMessages(data || [])
}
useEffect(() => {
  if (!propertyId) return

  fetchMessages()

  const channel = supabase
    .channel("messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `property_id=eq.${propertyId}`
      },
      (payload) => {
        setMessages((prev) => [...prev, payload.new])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [propertyId])


  
  // Personal Messages State
  
  const [viewMode, setViewMode] = useState<'community' | 'personal'>('community');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [showTenantSuggestions, setShowTenantSuggestions] = useState(false);
  const [personalMessageInput, setPersonalMessageInput] = useState('');
  
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  //  Auto-scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-select first community if none selected
  useEffect(() => {
    if (!selectedCommunityId && communities.length > 0) {
      setSelectedCommunityId(communities[0].id);
    }
  }, [communities]);

  // Auto-scroll to bottom when messages change or community is selected
  useEffect(() => {
    scrollToBottom();
  }, [communities, selectedCommunityId]);

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId) || null;

  const handleSendMessage = async () => {
  if (!newMessage.trim() || !propertyId) return

  const userData = await supabase.auth.getUser()

  const { error } = await supabase.from("messages").insert({
    property_id: propertyId,
    sender_id: userData.data.user?.id,
    sender_role: "landlord",
    message: newMessage
  })

  if (error) console.log(error)

  setNewMessage('')
}

  const handleFestivalCollection = () => {
    if (!selectedCommunity || !festivalName.trim()) return;

    // Get tenants for this property
    const tenantsInProperty = tenants.filter(t => t.property === selectedCommunity.property);
    
    if (tenantsInProperty.length === 0) {
      toast.error('No Tenants Found', {
        description: 'Add tenants to this property before creating a festival payment'
      });
      return;
    }

    const perTenantAmount = Math.round(festivalAmount / tenantsInProperty.length);
    
    // Create festival payment
    createFestivalPayment(selectedCommunity.id, festivalName, festivalAmount, tenantsInProperty);
    
    // Add message to chat
    const message: Message = {
      id: `msg-${Date.now()}`,
      sender: user?.name || 'Landlord',
      senderRole: 'landlord',
      content: `${festivalName} - Festival contribution collection of ₹${perTenantAmount} per tenant`,
      timestamp: new Date().toISOString(),
      type: 'payment-request',
      paymentAmount: perTenantAmount
    };

    addMessage(selectedCommunity.id, message);

    // Show success notification
    toast.success('Festival Collection Created', {
      description: `${festivalName} payment request of ₹${perTenantAmount} per tenant has been sent to ${selectedCommunity.property} community`
    });

    setIsFestivalDialogOpen(false);
    setFestivalName('');
    setFestivalAmount(500);
  };

  const handlePaymentStatusChange = (festivalPaymentId: string, tenantId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    if (!selectedCommunity) return;
    
    updateFestivalPaymentStatus(selectedCommunity.id, festivalPaymentId, tenantId, newStatus);
    
    // Show toast notification
    const tenant = tenants.find(t => t.id === tenantId);
    const payment = selectedCommunity.festivalPayments?.find(p => p.id === festivalPaymentId);
    
    if (tenant && payment) {
      if (newStatus === 'paid') {
        toast.success('Payment Recorded', {
          description: `${tenant.name}'s ${payment.festivalName} payment of ₹${payment.perTenantAmount.toLocaleString()} has been marked as paid`
        });
      } else if (newStatus === 'pending') {
        toast.warning('Payment Pending', {
          description: `${tenant.name}'s payment has been marked as pending`
        });
      } else if (newStatus === 'overdue') {
        toast.error('Payment Overdue', {
          description: `${tenant.name}'s payment has been marked as overdue`
        });
      }
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleSelectTenant = (tenantId: string, tenantName: string) => {
    // DO NOT create chat here - just select the tenant for composing
    // Chat will be created only when first message is sent
    
    // Close search suggestions
    setShowTenantSuggestions(false);
    
    // Select the tenant
    setSelectedTenantId(tenantId);
    setViewMode('personal');

    // Mark as read only if chat already exists
    const existingChat = personalChats.find(chat => chat.tenantId === tenantId);
    if (existingChat) {
      markPersonalChatAsRead(tenantId);
    }
  };

  const handleClearSearch = () => {
    setTenantSearchQuery('');
    setShowTenantSuggestions(false);
    
    // If current selected tenant has no messages (temporary search selection),
    // clear the selection when search is cleared
    if (selectedTenantId && viewMode === 'personal') {
      const selectedChat = personalChats.find(chat => chat.tenantId === selectedTenantId);
      if (!selectedChat || selectedChat.messages.length === 0) {
        setSelectedTenantId(null);
        setViewMode('community');
      }
    }
  };

  const handleSendPersonalMessage = () => {
    if (!personalMessageInput.trim() || !selectedTenantId) return;

    const message: PersonalMessage = {
      id: `personal-msg-${Date.now()}`,
      sender: user?.name || 'Landlord',
      senderRole: 'landlord',
      content: personalMessageInput,
      timestamp: new Date().toISOString(),
      isRead: true // Landlord's own messages are automatically read
    };

    // Check if chat exists
    const existingChat = personalChats.find(chat => chat.tenantId === selectedTenantId);
    
    if (!existingChat) {
      // Create chat first with the first message
      const tenant = tenants.find(t => t.id === selectedTenantId);
      if (tenant) {
        createPersonalChat(selectedTenantId, tenant.name);
      }
    }
    
    // Add the message (will work after chat is created)
    // Use setTimeout to ensure chat is created first
    setTimeout(() => {
      addPersonalMessage(selectedTenantId, message);
    }, 0);

    setPersonalMessageInput('');

    // Show toast notification
    const tenant = tenants.find(t => t.id === selectedTenantId);
    if (tenant) {
      toast.success('Message Sent', {
        description: `Your message has been sent to ${tenant.name}`
      });
    }
  };

  const selectedPersonalChat = personalChats.find(chat => chat.tenantId === selectedTenantId);
  
  // Get tenant info for compose mode (when chat doesn't exist yet)
  const selectedTenantForCompose = selectedTenantId ? tenants.find(t => t.id === selectedTenantId) : null;

  if (communities.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Community</h2>
          <p className="text-muted-foreground">Connect with your tenants</p>
        </div>
        <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <EmptyState
            icon={MessageCircle}
            title="No Community Created Yet"
            description="Create a community chat for your properties to communicate with tenants, share announcements, and collect festival contributions."
            actionLabel="Create Community"
            onAction={() => {
              alert('Add properties first to create communities!');
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Community</h2>
          <p className="text-muted-foreground">Connect with your tenants and track festival payments</p>
        </div>
        <Dialog open={isFestivalDialogOpen} onOpenChange={setIsFestivalDialogOpen}>
          <DialogTrigger asChild>
            <GradientButton>
              <PartyPopper className="w-4 h-4" />
              Collect Money
            </GradientButton>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Festival Money Collection</DialogTitle>
              <DialogDescription>
                Collect money from your tenants for a festival or event.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="festival-name">Festival/Event Name</Label>
                <Input
                  id="festival-name"
                  type="text"
                  placeholder="e.g., Diwali Celebration"
                  value={festivalName}
                  onChange={(e) => setFestivalName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="total-amount">Total Amount</Label>
                <Input
                  id="total-amount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={festivalAmount}
                  onChange={(e) => setFestivalAmount(parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>

              {selectedCommunity && tenants.filter(t => t.property === selectedCommunity.property).length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Auto-Split Calculation:</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Amount: ₹{festivalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Number of Tenants: {tenants.filter(t => t.property === selectedCommunity.property).length}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    Per Tenant: ₹{Math.round(festivalAmount / tenants.filter(t => t.property === selectedCommunity.property).length).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsFestivalDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <GradientButton onClick={handleFestivalCollection} className="flex-1" disabled={!festivalName.trim()}>
                  Send Request
                </GradientButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Communities List */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Community Sidebar */}
        <Card className="p-4 xl:col-span-1">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Your Communities
          </h3>
          <div className="space-y-2">
            {communities.map((community) => (
              <button
                key={community.id}
                onClick={() => {
                  setSelectedCommunityId(community.id);
                  setViewMode('community');
                  setSelectedTenantId(null);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedCommunity?.id === community.id && viewMode === 'community'
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-accent/5 border border-transparent'
                }`}
              >
                <p className="font-medium text-sm mb-1">{community.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {community.memberCount} members
                </p>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Personal Messages Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Personal Messages
            </h3>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Input
                ref={searchInputRef}
                placeholder="Search tenants..."
                value={tenantSearchQuery}
                onChange={(e) => {
                  setTenantSearchQuery(e.target.value);
                  setShowTenantSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowTenantSuggestions(tenantSearchQuery.length > 0)}
                className="pl-8 text-sm"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {tenantSearchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Tenant Suggestions Dropdown */}
              {showTenantSuggestions && (
                <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {tenants
                    .filter(tenant =>
                      tenant.name.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                    )
                    .map(tenant => (
                      <button
                        key={tenant.id}
                        onClick={() => {
                          handleSelectTenant(tenant.id, tenant.name);
                          setTenantSearchQuery('');
                          setShowTenantSuggestions(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-accent/10 transition-colors border-b border-border last:border-0"
                      >
                        <p className="text-sm font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.property} • {tenant.unit}
                        </p>
                      </button>
                    ))}
                  {tenants.filter(tenant =>
                    tenant.name.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No tenants found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Personal Chats List */}
            <div className="space-y-1">
              {personalChats && personalChats.filter(chat => chat.messages.length > 0).length > 0 ? (
                personalChats
                  .filter(chat => chat.messages.length > 0) // Only show chats with messages
                  .sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime())
                  .map(chat => (
                    <button
                      key={chat.tenantId}
                      onClick={() => {
                        setSelectedTenantId(chat.tenantId);
                        setViewMode('personal');
                        markPersonalChatAsRead(chat.tenantId);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                        selectedTenantId === chat.tenantId && viewMode === 'personal'
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-accent/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate flex-1">{chat.tenantName}</p>
                        {chat.unreadCount > 0 && (
                          <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-emerald-500 text-white text-xs font-bold rounded-full px-1.5 shrink-0">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
              ) : (
                <div className="text-center py-4 px-2">
                  <p className="text-xs text-muted-foreground">
                    No conversations yet. Search for a tenant to start chatting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        {selectedCommunity && viewMode === 'community' && (
          <Card className="xl:col-span-2 flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">{selectedCommunity.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="w-3 h-3" />
                {selectedCommunity.memberCount} members
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender_role === 'landlord' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      message.sender_role === 'landlord'
                        ? 'bg-gradient-to-r from-primary to-accent text-white'
                        : 'bg-muted text-foreground'
                    } rounded-2xl px-4 py-2.5`}
                  >
                    {message.type === 'text' ? (
                      <>
                        <p className={`text-xs font-medium mb-1 ${
                          message.sender_role === 'landlord' ? 'text-white/90' : 'text-muted-foreground'
                        }`}>
                          {message.sender}
                        </p>
                       <p className="text-sm">{message.message}</p>

<p className={`text-xs mt-1 ${
  message.sender_role === 'landlord' ? 'text-white/70' : 'text-muted-foreground'
}`}>
  {formatTime(message.created_at)}
</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-medium mb-2 text-white/90">
                          {message.sender}
                        </p>
                        <div className="bg-white/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4" />
                            <p className="font-semibold">Payment Request</p>
                          </div>
                          <p className="text-sm mb-1">{message.content}</p>
                        </div>
                        <p className="text-xs mt-2 text-white/70">
                          {formatTime(message.timestamp)}
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Personal Chat Area */}
        {selectedCommunity && viewMode === 'personal' && selectedPersonalChat && (
          <Card className="xl:col-span-2 flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedPersonalChat.tenantName}</h3>
                  <p className="text-xs text-muted-foreground">Personal Chat</p>
                </div>
              </div>
            </div>

            {/* Personal Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedPersonalChat.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium mb-1">Start a Conversation</p>
                  <p className="text-xs text-muted-foreground px-8">
                    Send a message to {selectedPersonalChat.tenantName} to begin your private conversation
                  </p>
                </div>
              ) : (
                <>
                  {selectedPersonalChat.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.senderRole === 'landlord' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          message.senderRole === 'landlord'
                            ? 'bg-gradient-to-r from-primary to-accent text-white'
                            : 'bg-muted text-foreground'
                        } rounded-2xl px-4 py-2.5`}
                      >
                        <p className={`text-xs font-medium mb-1 ${
                          message.senderRole === 'landlord' ? 'text-white/90' : 'text-muted-foreground'
                        }`}>
                          {message.sender}
                        </p>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderRole === 'landlord' ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message ${selectedPersonalChat.tenantName}...`}
                  value={personalMessageInput}
                  onChange={(e) => setPersonalMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPersonalMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendPersonalMessage}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!personalMessageInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Compose Mode - When tenant is selected from search but no chat exists yet */}
        {selectedCommunity && viewMode === 'personal' && !selectedPersonalChat && selectedTenantForCompose && (
          <Card className="xl:col-span-2 flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedTenantForCompose.name}</h3>
                  <p className="text-xs text-muted-foreground">Personal Chat</p>
                </div>
              </div>
            </div>

            {/* Empty State - New Conversation */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">Start a Conversation</p>
                <p className="text-xs text-muted-foreground px-8">
                  Send a message to {selectedTenantForCompose.name} to begin your private conversation
                </p>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message ${selectedTenantForCompose.name}...`}
                  value={personalMessageInput}
                  onChange={(e) => setPersonalMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPersonalMessage();
                    }
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button 
                  onClick={handleSendPersonalMessage}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!personalMessageInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Festival Payments Panel - GPAY STYLE */}
        {selectedCommunity && (
          <Card className="xl:col-span-1 p-4 h-[600px] overflow-y-auto">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-primary" />
              Festival Payments
            </h3>
            
            {selectedCommunity.festivalPayments && selectedCommunity.festivalPayments.length > 0 ? (
              <div className="space-y-3">
                {selectedCommunity.festivalPayments.map((payment) => {
                  const isExpanded = expandedPaymentId === payment.id;
                  const paidCount = payment.tenantPayments.filter(tp => tp.status === 'paid').length;
                  const totalCount = payment.tenantPayments.length;
                  const totalCollected = payment.tenantPayments
                    .filter(tp => tp.status === 'paid')
                    .reduce((sum, tp) => sum + tp.amount, 0);

                  return (
                    <div key={payment.id} className="border border-border rounded-lg overflow-hidden">
                      {/* Payment Header - Collapsible */}
                      <button
                        onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                        className="w-full p-3 bg-accent/30 hover:bg-accent/40 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">{payment.festivalName}</p>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Total: ₹{payment.totalAmount.toLocaleString()} • Per Tenant: ₹{payment.perTenantAmount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                              style={{ width: `${(paidCount / totalCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-primary">
                            {paidCount}/{totalCount}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Collected: ₹{totalCollected.toLocaleString()}
                        </p>
                      </button>

                      {/* Tenant Payment List - GPay Style */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="divide-y divide-border">
                              {payment.tenantPayments.map((tenantPayment) => (
                                <div key={tenantPayment.tenantId} className="p-3 hover:bg-accent/5 transition-colors">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{tenantPayment.tenantName}</p>
                                      <p className="text-xs text-primary font-semibold mt-0.5">
                                        ₹{tenantPayment.amount.toLocaleString()}
                                      </p>
                                    </div>
                                    
                                    {/* Status Dropdown */}
                                    <div className="relative">
                                      <select
                                        value={tenantPayment.status}
                                        onChange={(e) => handlePaymentStatusChange(
                                          payment.id,
                                          tenantPayment.tenantId,
                                          e.target.value as 'paid' | 'pending' | 'overdue'
                                        )}
                                        className={`appearance-none text-xs font-medium px-2 py-1 pr-6 rounded-md border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                          tenantPayment.status === 'paid'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                            : tenantPayment.status === 'pending'
                                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                                            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                                        }`}
                                      >
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="overdue">Overdue</option>
                                      </select>
                                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                                    </div>
                                  </div>
                                  
                                  {/* Status Icon */}
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    {tenantPayment.status === 'paid' && (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs text-muted-foreground">
                                          {tenantPayment.paidDate && `Paid on ${new Date(tenantPayment.paidDate).toLocaleDateString()}`}
                                        </span>
                                      </>
                                    )}
                                    {tenantPayment.status === 'pending' && (
                                      <>
                                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                        <span className="text-xs text-amber-600 dark:text-amber-400">
                                          Payment pending
                                        </span>
                                      </>
                                    )}
                                    {tenantPayment.status === 'overdue' && (
                                      <>
                                        <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        <span className="text-xs text-red-600 dark:text-red-400">
                                          Payment overdue
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <PartyPopper className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">No Festival Payments</p>
                <p className="text-xs text-muted-foreground">
                  Create a festival collection to see payment tracking here
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}