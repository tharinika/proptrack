import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar as CalendarIcon, DollarSign, Wrench, PartyPopper } from 'lucide-react';

const upcomingEvents = [
  {
    id: '1',
    title: 'Rent Payment Due',
    date: '2026-01-15',
    type: 'payment' as const,
    description: 'Monthly rent of $1,200',
  },
  {
    id: '2',
    title: 'Water Supply Maintenance',
    date: '2026-01-15',
    type: 'maintenance' as const,
    description: 'Water supply will be temporarily shut off from 9 AM to 2 PM',
  },
  {
    id: '3',
    title: 'Diwali Festival Celebration',
    date: '2026-01-24',
    type: 'festival' as const,
    description: 'Community celebration in the main hall',
  },
  {
    id: '4',
    title: 'Rent Payment Due',
    date: '2026-02-15',
    type: 'payment' as const,
    description: 'Monthly rent of $1,200',
  },
];

export function CalendarView() {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="w-5 h-5 text-primary" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-orange-500" />;
      case 'festival':
        return <PartyPopper className="w-5 h-5 text-purple-500" />;
      default:
        return <CalendarIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getEventBadge = (type: string) => {
    const config = {
      payment: { label: 'Payment', className: 'bg-primary/10 text-primary border-primary/20' },
      maintenance: { label: 'Maintenance', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
      festival: { label: 'Festival', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' }
    };
    const { label, className } = config[type as keyof typeof config] || { label: 'Event', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const groupEventsByMonth = () => {
    const grouped: { [key: string]: typeof upcomingEvents } = {};
    upcomingEvents.forEach(event => {
      const monthYear = new Date(event.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByMonth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Calendar</h2>
        <p className="text-muted-foreground">View upcoming rent dates and events</p>
      </div>

      {/* Upcoming Events */}
      {Object.entries(groupedEvents).map(([monthYear, events]) => (
        <div key={monthYear}>
          <h3 className="font-semibold mb-4 text-lg">{monthYear}</h3>
          <div className="space-y-3">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              const today = new Date();
              const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isUpcoming = daysUntil >= 0 && daysUntil <= 7;

              return (
                <Card 
                  key={event.id}
                  className={`p-6 hover:shadow-lg transition-shadow ${
                    isUpcoming ? 'border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold mb-1">{event.title}</h3>
                          {getEventBadge(event.type)}
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          {isUpcoming && daysUntil === 0 && (
                            <span className="text-xs text-primary font-medium">Today</span>
                          )}
                          {isUpcoming && daysUntil > 0 && (
                            <span className="text-xs text-orange-500 font-medium">
                              {daysUntil} {daysUntil === 1 ? 'day' : 'days'} away
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
