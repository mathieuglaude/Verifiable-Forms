import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Building, Globe, Camera, Save, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ImageCropper from "@/components/ImageCropper";

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, refetch } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data with user data from API
  const [userProfile, setUserProfile] = useState({
    firstName: user?.firstName || "John",
    lastName: user?.lastName || "Doe",
    email: user?.email || "john.doe@example.com",
    organization: user?.organization || "Demo Organization",
    title: user?.jobTitle || "Product Manager",
    phone: user?.phone || "+1 (555) 123-4567",
    linkedinUrl: user?.linkedinProfile || "https://linkedin.com/in/johndoe",
    website: user?.website || "https://johndoe.com",
    bio: user?.bio || "Experienced product manager passionate about digital identity and verifiable credentials. Leading innovation in form automation and user experience.",
    profileImage: user?.profileImage || null,
    location: user?.location || "Vancouver, BC, Canada",
    timezone: user?.timezone || "Pacific Standard Time (PST)",
    language: "English",
    emailNotifications: true,
    marketingEmails: false
  });

  // Update mutation for profile changes
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/auth/user', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Sync form data when user data loads from API
  useEffect(() => {
    if (user && !isLoading) {
      setUserProfile({
        firstName: user.firstName || "John",
        lastName: user.lastName || "Doe",
        email: user.email || "john.doe@example.com",
        organization: user.organization || "Demo Organization",
        title: user.jobTitle || "Product Manager",
        phone: user.phone || "+1 (555) 123-4567",
        linkedinUrl: user.linkedinProfile || "https://linkedin.com/in/johndoe",
        website: user.website || "https://johndoe.com",
        bio: user.bio || "Experienced product manager passionate about digital identity and verifiable credentials.",
        profileImage: user.profileImage || null,
        location: user.location || "Vancouver, BC, Canada",
        timezone: user.timezone || "Pacific Standard Time (PST)",
        language: "English",
        emailNotifications: true,
        marketingEmails: false
      });
    }
  }, [user, isLoading]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      phone: userProfile.phone,
      organization: userProfile.organization,
      jobTitle: userProfile.title,
      linkedinProfile: userProfile.linkedinUrl,
      website: userProfile.website,
      bio: userProfile.bio,
      profileImage: userProfile.profileImage,
      location: userProfile.location,
      timezone: userProfile.timezone
    });
    setHasChanges(false);
  };

  const handleCancel = () => {
    // Reset to original values from API
    if (user) {
      setUserProfile({
        firstName: user.firstName || "John",
        lastName: user.lastName || "Doe",
        email: user.email || "john.doe@example.com",
        organization: user.organization || "Demo Organization",
        title: user.jobTitle || "Product Manager",
        phone: user.phone || "+1 (555) 123-4567",
        linkedinUrl: user.linkedinProfile || "https://linkedin.com/in/johndoe",
        website: user.website || "https://johndoe.com",
        bio: user.bio || "Experienced product manager passionate about digital identity and verifiable credentials.",
        profileImage: user.profileImage || null,
        location: user.location || "Vancouver, BC, Canada",
        timezone: user.timezone || "Pacific Standard Time (PST)",
        language: "English",
        emailNotifications: true,
        marketingEmails: false
      });
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setPendingImage(imageData);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageCrop = (croppedImage: string) => {
    setUserProfile(prev => ({ ...prev, profileImage: croppedImage }));
    
    // Immediately save the profile picture
    updateProfileMutation.mutate({
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      phone: userProfile.phone,
      organization: userProfile.organization,
      jobTitle: userProfile.title,
      linkedinProfile: userProfile.linkedinUrl,
      website: userProfile.website,
      bio: userProfile.bio,
      profileImage: croppedImage,
      location: userProfile.location,
      timezone: userProfile.timezone
    });
    
    setIsCropperOpen(false);
    setPendingImage(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your profile and account preferences</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your public profile information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userProfile.profileImage || ""} alt={`${userProfile.firstName} ${userProfile.lastName}`} />
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-xl">
                    {getInitials(userProfile.firstName, userProfile.lastName)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {userProfile.firstName} {userProfile.lastName}
                </h3>
                <p className="text-gray-600">{userProfile.title} at {userProfile.organization}</p>
                <p className="text-sm text-gray-500 mt-1">{userProfile.location}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">Form Builder User</Badge>
                  <Badge variant="outline">Verified Account</Badge>
                  {user?.role === 'super_admin' && (
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                      Super Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={userProfile.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={userProfile.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={userProfile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>
              Your work details and professional profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="organization"
                    value={userProfile.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={userProfile.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <Input
                  id="linkedinUrl"
                  value={userProfile.linkedinUrl}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    value={userProfile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={userProfile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!isEditing}
                placeholder="Tell us about yourself and your work..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Preferences</CardTitle>
            <CardDescription>
              Your location settings and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={userProfile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                  placeholder="City, Province/State, Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={userProfile.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Account Activity</CardTitle>
            <CardDescription>
              Overview of your form builder usage and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">2</div>
                <div className="text-sm text-gray-600">Forms Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Form Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">4</div>
                <div className="text-sm text-gray-600">Community Forms Viewed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Image Cropper Modal */}
      {pendingImage && (
        <ImageCropper
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setPendingImage(null);
          }}
          imageSrc={pendingImage}
          onCrop={handleImageCrop}
        />
      )}
    </div>
  );
}