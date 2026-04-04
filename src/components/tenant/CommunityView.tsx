import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useCommunity } from '../../contexts/CommunityContext';
import { MessageCircle, Send, Users, PartyPopper, Building2, Mail, Calendar, AlertCircle, User } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from "../../lib/supabase"


interface Message {
  id: string;
  sender: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  type: 'text' | 'payment-request';
  paymentAmount?: number;
}

interface PersonalMessage {
  id: string;
  sender: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  isRead: boolean;
}

type ViewMode = 'community' | 'personal';

export function TenantCommunityView() {
  const { user } = useAuth();
  const { communities, addMessage } = useCommunity();
  
  const [viewMode, setViewMode] = useState<ViewMode>('community');
  const [newMessage, setNewMessage] = useState('');
  const [personalChatMessages, setPersonalChatMessages] = useState<PersonalMessage[]>([]);
  const [messages, setMessages] = useState<any[]>([])
const [propertyId, setPropertyId] = useState("")

useEffect(() => {
  async function loadProperty() {
    const user = (await supabase.auth.getUser()).data.user

    const { data } = await supabase
      .from("tenant_property")
      .select("property_id")
      .eq("tenant_id", user?.id)
      .single()

    setPropertyId(data.property_id)
  }

  loadProperty()
}, [])

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

const fetchMessages = async () => {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("property_id", propertyId)

  setMessages(data || [])
}

const sendMessage = async (text: string) => {
  const user = (await supabase.auth.getUser()).data.user

  await supabase.from("messages").insert({
    property_id: propertyId,
    sender_id: user?.id,
    message: text
  })
}
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [communities, personalChatMessages, viewMode]);

  // ============================================================================
  // TENANT DATA - Same source as Dashboard (Mock Data)
  // ============================================================================
  
  // This matches TenantOverview.tsx data structure
  const tenantData = {
    property: 'Greenwood Apartments',
    unit: 'A-101',
    landlordName: 'John Anderson', // In real app, from auth context
  };

  // ============================================================================
  // LOAD COMMUNITY - Based on tenant's property from dashboard context
  // Database Query: GET /api/community/{propertyId}
  // Returns: { propertyId, propertyName, memberCount, landlord: { id, name } }
  // memberCount = COUNT(tenants WHERE property_id = propertyId) + 1 (landlord)
  // ============================================================================
  
  // Find tenant's property community (same data source as dashboard)
  const tenantCommunity = communities.find(c => c.property === tenantData.property);

  // Get landlord name from community messages
  const landlordName = tenantCommunity?.messages.find(m => m.senderRole === 'landlord')?.sender || tenantData.landlordName;

  // ============================================================================
  // REAL-TIME WEBSOCKET SETUP
  // Room: property_{propertyId}
  // Both landlord and tenant join same room for instant message sync
  // ============================================================================
  
  // In real app with Socket.IO:
  // useEffect(() => {
  //   if (tenantCommunity) {
  //     // Join property room: property_{propertyId}
  //     socket.emit("join_room", `property_${tenantCommunity.id}`);
  //     
  //     // Listen for incoming messages
  //     socket.on("receive_message", (data) => {
  //       // Update chat UI with new message
  //       addMessage(tenantCommunity.id, data.message);
  //     });
  //     
  //     return () => {
  //       socket.off("receive_message");
  //       socket.emit("leave_room", `property_${tenantCommunity.id}`);
  //     };
  //   }
  // }, [tenantCommunity?.id]);

  // ============================================================================
  // INITIALIZE PRIVATE CHAT - Auto-create welcome message
  // Room: private_landlord_{landlordId}_tenant_{tenantId}
  // ============================================================================
  
  useEffect(() => {
    if (landlordName && personalChatMessages.length === 0) {
      setPersonalChatMessages([
        {
          id: 'private-welcome-1',
          sender: landlordName,
          senderRole: 'landlord',
          content: 'Hi! Feel free to reach out to me directly here if you have any private questions or concerns.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true
        }
      ]);
    }
  }, [landlordName]);

  // ============================================================================
  // MESSAGE HANDLING - Real-time sync via context
  // ============================================================================
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    if (viewMode === 'community') {
      if (!tenantCommunity) return;

      // Property Community Chat - Room: property_room_{propertyId}
      const message: Message = {
        id: `msg-${Date.now()}`,
        sender: user?.name || 'Tenant',
        senderRole: 'tenant',
        content: newMessage,
        timestamp: new Date().toISOString(),
        type: 'text'
      };

      // Real-time broadcast to property_room_{propertyId}
      addMessage(tenantCommunity.id, message);
    } else {
      // Private Landlord Chat - Room: private_landlord_{landlordId}_tenant_{tenantId}
      const message: PersonalMessage = {
        id: `private-msg-${Date.now()}`,
        sender: user?.name || 'Tenant',
        senderRole: 'tenant',
        content: newMessage,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      // Add to local state (simulates real-time sync)
      setPersonalChatMessages(prev => [...prev, message]);
      
      // In real app: socket.emit("send_message", { room: private_landlord_{landlordId}_tenant_{tenantId}, message })
    }

    setNewMessage('');
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

  // ============================================================================
  // RENDER MAIN UI - Always renders (property exists from dashboard)
  // ============================================================================
  
  const activeMessages = viewMode === 'community' 
    ? (tenantCommunity?.messages || [])
    : personalChatMessages;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Community</h2>
        <p className="text-muted-foreground">Connect with your landlord and community</p>
      </div>

      {/* 3-Column Layout - Mirrors Landlord Community Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ========================================================================
            LEFT SIDEBAR - Mirrors Landlord Layout
        ======================================================================== */}
        <Card className="p-4 xl:col-span-1">
          {/* Your Communities Section */}
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Your Communities
          </h3>
          <div className="space-y-2">
            {/* Single Property Community (Tenant's Assigned Property) */}
            <button
              onClick={() => setViewMode('community')}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                viewMode === 'community'
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-accent/5 border border-transparent'
              }`}
            >
              <p className="font-medium text-sm mb-1">{tenantCommunity?.name || `${tenantData.property} Community`}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {tenantCommunity?.memberCount || 1} members
              </p>
            </button>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Direct Messages Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Direct Messages
            </h3>

            {/* Landlord Private Chat */}
            <div className="space-y-1">
              <button
                onClick={() => setViewMode('personal')}
                className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                  viewMode === 'personal'
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-accent/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">Landlord – {landlordName}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* ========================================================================
            CENTER PANEL - Chat Interface
        ======================================================================== */}
        <Card className="xl:col-span-2 flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-border">
            {viewMode === 'community' ? (
              <>
                <h3 className="font-semibold">{tenantCommunity?.name || `${tenantData.property} Community`}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3" />
                  {tenantCommunity?.memberCount || 1} members
                </p>
                <p className="text-xs font-medium text-primary mt-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Landlord: {landlordName}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{landlordName}</h3>
                    <p className="text-xs text-muted-foreground">Private Chat</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">No Messages Yet</p>
                <p className="text-xs text-muted-foreground px-8">
                  {viewMode === 'community' 
                    ? 'Start the conversation with your community'
                    : 'Start a private conversation with your landlord'}
                </p>
              </div>
            ) : (
              <>
                {activeMessages.map((message) => (
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
                      {viewMode === 'community' && 'type' in message && message.type === 'payment-request' ? (
                        <>
                          <p className="text-xs font-medium mb-2 text-white/90">
                            {message.sender}
                          </p>
                          <div className="bg-white/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <PartyPopper className="w-4 h-4" />
                              <p className="font-semibold">Payment Request</p>
                            </div>
                            <p className="text-sm mb-1">{message.content}</p>
                            {message.paymentAmount && (
                              <p className="text-sm font-bold mt-2">
                                Amount: ₹{message.paymentAmount.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <p className="text-xs mt-2 text-white/70">
                            {formatTime(message.timestamp)}
                          </p>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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
                placeholder={viewMode === 'community' ? 'Type a message...' : `Message ${landlordName}...`}
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

        {/* ========================================================================
            RIGHT PANEL - Property/Landlord Information
        ======================================================================== */}
        <Card className="xl:col-span-1 p-4 h-[600px] overflow-y-auto">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {viewMode === 'community' ? 'Community Information' : 'Landlord Information'}
          </h3>
          
          <div className="space-y-4">
            {/* Property Name */}
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Property</p>
              <p className="font-medium text-sm">{tenantData.property}</p>
            </div>

            {/* Unit Number */}
            <div className="p-3 bg-accent/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Your Unit</p>
              <p className="font-medium text-sm">Unit {tenantData.unit}</p>
            </div>

            {/* Landlord Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Landlord</p>
              </div>
              <p className="text-sm font-medium">{landlordName}</p>
            </div>

            {/* Contact */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-3 h-3 text-blue-500" />
                <p className="text-xs text-blue-500 font-medium">Contact</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {viewMode === 'personal' ? 'Private chat active' : 'Use direct messages for private matters'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-4" />

            {/* Upcoming Events - Only in Community Mode */}
            {viewMode === 'community' && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-primary" />
                  Upcoming Events
                </h4>
                
                {tenantCommunity?.festivalPayments && tenantCommunity.festivalPayments.length > 0 ? (
                  <div className="space-y-2">
                    {tenantCommunity.festivalPayments.slice(0, 3).map((payment) => {
                      const tenantPayment = payment.tenantPayments.find(
                        tp => tp.tenantName === user?.name
                      );
                      
                      return (
                        <div
                          key={payment.id}
                          className="p-3 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <PartyPopper className="w-4 h-4 text-primary" />
                              <p className="font-medium text-sm">{payment.festivalName}</p>
                            </div>
                            {tenantPayment && (
                              <div
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  tenantPayment.status === 'paid'
                                    ? 'bg-green-500/10 text-green-500'
                                    : tenantPayment.status === 'pending'
                                    ? 'bg-orange-500/10 text-orange-500'
                                    : 'bg-red-500/10 text-red-500'
                                }`}
                              >
                                {tenantPayment.status === 'paid'
                                  ? 'Paid'
                                  : tenantPayment.status === 'pending'
                                  ? 'Pending'
                                  : 'Overdue'}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Amount: ₹{payment.perTenantAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 px-3">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">No upcoming events</p>
                  </div>
                )}
              </div>
            )}

            {/* Important Notices */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Important Notices
              </h4>
              
              <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {viewMode === 'community' 
                    ? 'Check the community chat regularly for important updates from your landlord.'
                    : 'Use this private channel for personal matters with your landlord. Messages are confidential.'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}