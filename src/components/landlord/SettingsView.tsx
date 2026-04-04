import React from 'react';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Bell, Lock, User } from 'lucide-react';

export function SettingsView() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
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
              <Label htmlFor="payment-notifications">Payment Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified when payments are received</p>
            </div>
            <Switch id="payment-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="maintenance-notifications">Maintenance Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified of new maintenance requests</p>
            </div>
            <Switch id="maintenance-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="lease-notifications">Lease Expiry Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified 60 days before lease expires</p>
            </div>
            <Switch id="lease-notifications" defaultChecked />
          </div>
        </div>
      </Card>

      {/* Account Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Account</h3>
            <p className="text-sm text-muted-foreground">Manage your account settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground mt-1">landlord@proptrack.com</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <Label>Role</Label>
            <p className="text-sm text-muted-foreground mt-1">Administrator</p>
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
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Switch id="two-factor" />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="session-timeout">Auto Logout</Label>
              <p className="text-sm text-muted-foreground">Automatically log out after 30 minutes</p>
            </div>
            <Switch id="session-timeout" defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );
}
