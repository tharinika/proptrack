import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation error states
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Get the actual stored password for the current user
  const getStoredPassword = (): string | null => {
    // For demo accounts
    if (user?.email === 'landlord@proptrack.com' || user?.email === 'tenant@proptrack.com') {
      return 'demo123'; // Demo account default password
    }

    // For regular signed up accounts
    const savedAccounts = localStorage.getItem('proptrack_accounts');
    if (savedAccounts) {
      const accounts = JSON.parse(savedAccounts);
      const account = accounts.find((acc: any) => acc.email === user?.email);
      return account ? account.password : null;
    }

    return null;
  };

  // Validate current password
  const validateCurrentPassword = (password: string): boolean => {
    const storedPassword = getStoredPassword();
    return password === storedPassword;
  };

  // Validate new password requirements
  const validateNewPassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character.' };
    }
    if (password === formData.currentPassword) {
      return { isValid: false, message: 'New password must be different from current password.' };
    }
    return { isValid: true, message: '' };
  };

  // Handle current password blur
  const handleCurrentPasswordBlur = () => {
    if (formData.currentPassword && !validateCurrentPassword(formData.currentPassword)) {
      setCurrentPasswordError('Current password is incorrect.');
    } else {
      setCurrentPasswordError('');
    }
  };

  // Handle current password change
  const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, currentPassword: value });
    
    // Clear error if corrected
    if (value && validateCurrentPassword(value)) {
      setCurrentPasswordError('');
    }
    
    // Re-validate new password when current password changes
    if (formData.newPassword) {
      const validation = validateNewPassword(formData.newPassword);
      setNewPasswordError(validation.message);
    }
  };

  // Handle new password blur
  const handleNewPasswordBlur = () => {
    if (formData.newPassword) {
      const validation = validateNewPassword(formData.newPassword);
      setNewPasswordError(validation.message);
    }
  };

  // Handle new password change
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, newPassword: value });
    
    if (value) {
      const validation = validateNewPassword(value);
      setNewPasswordError(validation.message);
    } else {
      setNewPasswordError('');
    }
    
    // Re-validate confirm password
    if (formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  // Handle confirm password blur
  const handleConfirmPasswordBlur = () => {
    if (formData.confirmPassword && formData.confirmPassword !== formData.newPassword) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, confirmPassword: value });
    
    if (value && value !== formData.newPassword) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  // Check if password change is valid
  const isPasswordChangeValid = (): boolean => {
    if (!formData.currentPassword && !formData.newPassword && !formData.confirmPassword) {
      return true; // No password change requested
    }

    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      // All password fields must be valid
      if (!validateCurrentPassword(formData.currentPassword)) {
        return false;
      }
      
      const newPasswordValidation = validateNewPassword(formData.newPassword);
      if (!newPasswordValidation.isValid) {
        return false;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    // Validate passwords if changing
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!validateCurrentPassword(formData.currentPassword)) {
        setCurrentPasswordError('Current password is incorrect.');
        return;
      }

      const newPasswordValidation = validateNewPassword(formData.newPassword);
      if (!newPasswordValidation.isValid) {
        setNewPasswordError(newPasswordValidation.message);
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
        return;
      }

      // Update password in localStorage
      const savedAccounts = localStorage.getItem('proptrack_accounts');
      if (savedAccounts) {
        const accounts = JSON.parse(savedAccounts);
        const accountIndex = accounts.findIndex((acc: any) => acc.email === user?.email);
        if (accountIndex !== -1) {
          accounts[accountIndex].password = formData.newPassword;
          localStorage.setItem('proptrack_accounts', JSON.stringify(accounts));
        }
      }
    }

    // In real app, this would update the user profile
    const changedPassword = formData.newPassword && formData.newPassword.length > 0;
    
    toast.success('Profile Updated', {
      description: changedPassword 
        ? 'Your profile and password have been successfully updated'
        : 'Your profile information has been successfully updated'
    });

    onOpenChange(false);
    
    // Reset password fields and errors
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset to original values
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and change your password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-4">
            <h3 className="font-medium mb-4">Change Password</h3>

            {/* Current Password */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleCurrentPasswordChange}
                  onBlur={handleCurrentPasswordBlur}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {currentPasswordError && <p className="text-red-500 text-sm mt-1">{currentPasswordError}</p>}
            </div>

            {/* New Password */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleNewPasswordChange}
                  onBlur={handleNewPasswordBlur}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {newPasswordError && <p className="text-red-500 text-sm mt-1">{newPasswordError}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPasswordError && <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isPasswordChangeValid()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}