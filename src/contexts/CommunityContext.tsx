import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProperties } from './PropertiesContext';
import { useAuth } from './AuthContext';
import { mockTenants, mockCommunityMessages } from '../data/mockData';

interface Message {
  id: string;
  sender: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  type: 'text' | 'payment-request';
  paymentAmount?: number;
  festivalPaymentId?: string; // Link to festival payment
}

interface FestivalPayment {
  id: string;
  festivalName: string;
  totalAmount: number;
  perTenantAmount: number;
  createdDate: string;
  tenantPayments: {
    tenantId: string;
    tenantName: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    paidDate?: string;
  }[];
}

interface PersonalMessage {
  id: string;
  sender: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface PersonalChat {
  tenantId: string;
  tenantName: string;
  messages: PersonalMessage[];
  unreadCount: number; // Unread messages count
  lastMessageTimestamp: string; // For sorting chats
}

interface Community {
  id: string;
  name: string;
  property: string;
  memberCount: number;
  members: string[]; // Array of tenant names
  messages: Message[];
  festivalPayments: FestivalPayment[]; // Track all festival payments
}

interface CommunityContextType {
  communities: Community[];
  personalChats: PersonalChat[]; // Global personal chats, not tied to communities
  addMessage: (communityId: string, message: Message) => void;
  addTenantToCommunity: (propertyName: string, tenantName: string) => void;
  removeTenantFromCommunity: (propertyName: string, tenantName: string) => void;
  updateTenantInCommunity: (oldPropertyName: string, newPropertyName: string, oldTenantName: string, newTenantName: string) => void;
  createFestivalPayment: (communityId: string, festivalName: string, totalAmount: number, tenants: any[]) => void;
  updateFestivalPaymentStatus: (communityId: string, festivalPaymentId: string, tenantId: string, status: 'paid' | 'pending' | 'overdue') => void;
  addPersonalMessage: (tenantId: string, message: PersonalMessage) => void;
  createPersonalChat: (tenantId: string, tenantName: string) => void;
  markPersonalChatAsRead: (tenantId: string) => void;
  getLandlordChatForTenant: (tenantId: string, landlordName: string) => PersonalChat | null;
  addTenantLandlordMessage: (tenantId: string, landlordName: string, message: PersonalMessage) => void;
  getTenantPropertyCommunity: (propertyName: string) => Community | null;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { properties } = useProperties();
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  
  // Initialize personal chats - only show sample data for demo users
  const initialPersonalChats: PersonalChat[] = user?.isDemo ? [
    // Sample personal chats for demonstration
    {
      tenantId: 'tenant-1',
      tenantName: 'Sarah Johnson',
      messages: [
        {
          id: 'pm-1',
          sender: 'John Anderson',
          senderRole: 'landlord',
          content: 'Hi Sarah, just a reminder about the rent payment for this month.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          isRead: true
        },
        {
          id: 'pm-2',
          sender: 'Sarah Johnson',
          senderRole: 'tenant',
          content: 'Hello! I will make the payment by tomorrow. Thanks for the reminder.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          isRead: false
        },
        {
          id: 'pm-3',
          sender: 'Sarah Johnson',
          senderRole: 'tenant',
          content: 'Just completed the payment. Please check.',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          isRead: false
        }
      ],
      unreadCount: 2,
      lastMessageTimestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      tenantId: 'tenant-2',
      tenantName: 'Michael Chen',
      messages: [
        {
          id: 'pm-4',
          sender: 'John Anderson',
          senderRole: 'landlord',
          content: 'Hi Michael, hope you are settling in well!',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          isRead: true
        },
        {
          id: 'pm-5',
          sender: 'Michael Chen',
          senderRole: 'tenant',
          content: 'Thank you! Everything is great so far.',
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
          isRead: true
        }
      ],
      unreadCount: 0,
      lastMessageTimestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    }
  ] : []; // Empty array for new landlords
  
  const [personalChats, setPersonalChats] = useState<PersonalChat[]>(initialPersonalChats);

  // Auto-generate and sync communities from properties
  useEffect(() => {
    const generatedCommunities: Community[] = properties.map(property => {
      // Check if community already exists (to preserve messages and members)
      const existingCommunity = communities.find(c => c.property === property.name);
      
      // Build member list from property's occupied units
      const members: string[] = [];
      property.units.forEach(unit => {
        if (unit.status === 'occupied' && unit.tenant) {
          members.push(unit.tenant);
        }
      });
      
      // Use sample messages from mockData ONLY for demo users
      const sampleMessages = user?.isDemo 
        ? mockCommunityMessages[property.name as keyof typeof mockCommunityMessages]
        : undefined;
      
      return {
        id: property.id,
        name: `${property.name} Community`,
        property: property.name,
        memberCount: members.length + 1, // +1 for landlord
        members: members,
        messages: existingCommunity?.messages || sampleMessages || [
          {
            id: `welcome-${property.id}`,
            sender: user?.name || 'John Anderson',
            senderRole: 'landlord' as const,
            content: `Welcome to ${property.name} Community! Feel free to share any announcements or concerns here.`,
            timestamp: new Date().toISOString(),
            type: 'text' as const
          }
        ],
        festivalPayments: existingCommunity?.festivalPayments || []
      };
    });
    
    setCommunities(generatedCommunities);
  }, [properties, user]);

  const addMessage = (communityId: string, message: Message) => {
    setCommunities(prev => 
      prev.map(community => 
        community.id === communityId
          ? { ...community, messages: [...community.messages, message] }
          : community
      )
    );
  };

  const addTenantToCommunity = (propertyName: string, tenantName: string) => {
    setCommunities(prev => 
      prev.map(community => {
        if (community.property === propertyName) {
          // Check if tenant already exists
          if (community.members.includes(tenantName)) {
            return community;
          }
          
          // Add tenant to members
          const updatedMembers = [...community.members, tenantName];
          
          // Create a welcome message for the new tenant
          const welcomeMessage: Message = {
            id: `tenant-join-${Date.now()}`,
            sender: user?.name || 'Landlord',
            senderRole: 'landlord',
            content: `Welcome ${tenantName} to ${community.name}! 🎉`,
            timestamp: new Date().toISOString(),
            type: 'text'
          };
          
          return {
            ...community,
            members: updatedMembers,
            memberCount: updatedMembers.length + 1, // +1 for landlord
            messages: [...community.messages, welcomeMessage]
          };
        }
        return community;
      })
    );
  };

  const removeTenantFromCommunity = (propertyName: string, tenantName: string) => {
    setCommunities(prev => 
      prev.map(community => {
        if (community.property === propertyName) {
          const updatedMembers = community.members.filter(m => m !== tenantName);
          return {
            ...community,
            members: updatedMembers,
            memberCount: updatedMembers.length + 1 // +1 for landlord
          };
        }
        return community;
      })
    );
  };

  const updateTenantInCommunity = (
    oldPropertyName: string, 
    newPropertyName: string, 
    oldTenantName: string, 
    newTenantName: string
  ) => {
    setCommunities(prev => 
      prev.map(community => {
        // Remove from old property community
        if (community.property === oldPropertyName) {
          const updatedMembers = community.members.filter(m => m !== oldTenantName);
          return {
            ...community,
            members: updatedMembers,
            memberCount: updatedMembers.length + 1
          };
        }
        
        // Add to new property community (if property changed)
        if (community.property === newPropertyName && oldPropertyName !== newPropertyName) {
          const updatedMembers = [...community.members, newTenantName];
          
          const welcomeMessage: Message = {
            id: `tenant-join-${Date.now()}`,
            sender: user?.name || 'Landlord',
            senderRole: 'landlord',
            content: `Welcome ${newTenantName} to ${community.name}! 🎉`,
            timestamp: new Date().toISOString(),
            type: 'text'
          };
          
          return {
            ...community,
            members: updatedMembers,
            memberCount: updatedMembers.length + 1,
            messages: [...community.messages, welcomeMessage]
          };
        }
        
        // Update tenant name in same community (if only name changed)
        if (community.property === newPropertyName && oldPropertyName === newPropertyName && oldTenantName !== newTenantName) {
          const updatedMembers = community.members.map(m => m === oldTenantName ? newTenantName : m);
          return {
            ...community,
            members: updatedMembers
          };
        }
        
        return community;
      })
    );
  };

  const createFestivalPayment = (communityId: string, festivalName: string, totalAmount: number, tenants: any[]) => {
    setCommunities(prev => 
      prev.map(community => {
        if (community.id === communityId) {
          const perTenantAmount = Math.round(totalAmount / tenants.length);
          const tenantPayments = tenants.map(tenant => ({
            tenantId: tenant.id,
            tenantName: tenant.name,
            amount: perTenantAmount,
            status: 'pending' as const
          }));
          
          const newFestivalPayment: FestivalPayment = {
            id: `festival-payment-${Date.now()}`,
            festivalName: festivalName,
            totalAmount: totalAmount,
            perTenantAmount: perTenantAmount,
            createdDate: new Date().toISOString(),
            tenantPayments: tenantPayments
          };
          
          return {
            ...community,
            festivalPayments: [...(community.festivalPayments || []), newFestivalPayment]
          };
        }
        return community;
      })
    );
  };

  const updateFestivalPaymentStatus = (communityId: string, festivalPaymentId: string, tenantId: string, status: 'paid' | 'pending' | 'overdue') => {
    setCommunities(prev => 
      prev.map(community => {
        if (community.id === communityId) {
          const updatedFestivalPayments = community.festivalPayments.map(payment => {
            if (payment.id === festivalPaymentId) {
              const updatedTenantPayments = payment.tenantPayments.map(tenantPayment => {
                if (tenantPayment.tenantId === tenantId) {
                  return {
                    ...tenantPayment,
                    status: status,
                    paidDate: status === 'paid' ? new Date().toISOString() : undefined
                  };
                }
                return tenantPayment;
              });
              
              return {
                ...payment,
                tenantPayments: updatedTenantPayments
              };
            }
            return payment;
          });
          
          return {
            ...community,
            festivalPayments: updatedFestivalPayments
          };
        }
        return community;
      })
    );
  };

  const addPersonalMessage = (tenantId: string, message: PersonalMessage) => {
    setPersonalChats(prev => {
      const existingChat = prev.find(chat => chat.tenantId === tenantId);
      
      if (existingChat) {
        // Update existing chat
        return prev.map(chat => {
          if (chat.tenantId === tenantId) {
            const newUnreadCount = message.senderRole === 'tenant' 
              ? chat.unreadCount + 1 
              : chat.unreadCount;
            
            return {
              ...chat,
              messages: [...chat.messages, message],
              unreadCount: newUnreadCount,
              lastMessageTimestamp: message.timestamp
            };
          }
          return chat;
        });
      }
      
      // If chat doesn't exist, this shouldn't happen, but handle it gracefully
      return prev;
    });
  };

  const createPersonalChat = (tenantId: string, tenantName: string) => {
    setPersonalChats(prev => {
      // Check if chat already exists
      const existingChat = prev.find(chat => chat.tenantId === tenantId);
      
      if (existingChat) {
        // Chat already exists, don't create duplicate
        return prev;
      }
      
      // Create new chat
      const newChat: PersonalChat = {
        tenantId: tenantId,
        tenantName: tenantName,
        messages: [],
        unreadCount: 0,
        lastMessageTimestamp: new Date().toISOString()
      };
      
      return [...prev, newChat];
    });
  };

  const markPersonalChatAsRead = (tenantId: string) => {
    setPersonalChats(prev => 
      prev.map(chat => {
        if (chat.tenantId === tenantId) {
          // Mark all messages as read
          return {
            ...chat,
            messages: chat.messages.map(msg => ({ ...msg, isRead: true })),
            unreadCount: 0
          };
        }
        return chat;
      })
    );
  };

  const getLandlordChatForTenant = (tenantId: string, landlordName: string) => {
    const chat = personalChats.find(chat => chat.tenantId === tenantId);
    if (chat) {
      const landlordMessage = chat.messages.find(msg => msg.sender === landlordName && msg.senderRole === 'landlord');
      if (landlordMessage) {
        return chat;
      }
    }
    return null;
  };

  const addTenantLandlordMessage = (tenantId: string, landlordName: string, message: PersonalMessage) => {
    setPersonalChats(prev => {
      const existingChat = prev.find(chat => chat.tenantId === tenantId);
      
      if (existingChat) {
        // Update existing chat
        return prev.map(chat => {
          if (chat.tenantId === tenantId) {
            const newUnreadCount = message.senderRole === 'tenant' 
              ? chat.unreadCount + 1 
              : chat.unreadCount;
            
            return {
              ...chat,
              messages: [...chat.messages, message],
              unreadCount: newUnreadCount,
              lastMessageTimestamp: message.timestamp
            };
          }
          return chat;
        });
      }
      
      // If chat doesn't exist, create a new one
      const newChat: PersonalChat = {
        tenantId: tenantId,
        tenantName: message.sender,
        messages: [message],
        unreadCount: message.senderRole === 'tenant' ? 1 : 0,
        lastMessageTimestamp: message.timestamp
      };
      
      return [...prev, newChat];
    });
  };

  const getTenantPropertyCommunity = (propertyName: string) => {
    return communities.find(community => community.property === propertyName) || null;
  };

  return (
    <CommunityContext.Provider value={{ 
      communities, 
      personalChats,
      addMessage, 
      addTenantToCommunity,
      removeTenantFromCommunity,
      updateTenantInCommunity,
      createFestivalPayment,
      updateFestivalPaymentStatus,
      addPersonalMessage,
      createPersonalChat,
      markPersonalChatAsRead,
      getLandlordChatForTenant,
      addTenantLandlordMessage,
      getTenantPropertyCommunity
    }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}