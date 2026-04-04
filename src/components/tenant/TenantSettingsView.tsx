import React from 'react';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Moon, Sun, Bell, Lock, User } from 'lucide-react';

export function TenantSettingsView() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Settings</h2>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      {/* Theme Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            {theme === 'dark' ? <Moon className="w-6 h-6 text-primary" /> : <Sun className="w-6 h-6 text-primary" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Appearance</h3>
            <p className="text-sm text-muted-foreground">Customize how PropTrack looks</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="theme-toggle" className="cursor-pointer">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                {theme === 'dark' ? 'Dark theme is enabled' : 'Light theme is enabled'}
              </p>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="rent-reminders">Rent Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified 3 days before rent is due</p>
            </div>
            <Switch id="rent-reminders" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="maintenance-updates">Maintenance Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified of maintenance request updates</p>
            </div>
            <Switch id="maintenance-updates" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="community-updates">Community Announcements</Label>
              <p className="text-sm text-muted-foreground">Get notified of new announcements</p>
            </div>
            <Switch id="community-updates" defaultChecked />
          </div>
        </div>
      </Card>

      {/* Profile Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Profile</h3>
            <p className="text-sm text-muted-foreground">Your account information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label>Name</Label>
            <p className="text-sm text-muted-foreground mt-1">{user?.name}</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <Label>Unit</Label>
            <p className="text-sm text-muted-foreground mt-1">A-101, Greenwood Apartments</p>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Security</h3>
            <p className="text-sm text-muted-foreground">Manage your security preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label>Password</Label>
            <p className="text-sm text-muted-foreground mt-1">••••••••</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
