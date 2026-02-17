"use client";

import { useEffect, useState, useRef } from "react";
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Divider,
} from "@heroui/react";
import { Upload, Save, User } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  type Profile,
} from "@/lib/supabase/profile";

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        setLoading(true);
        const data = await getProfile(user.id);

        if (data) {
          setProfile(data);
          setUsername(data.username || "");
          setFullName(data.full_name || "");
          setWebsite(data.website || "");
          setAvatarUrl(data.avatar_url);
        }
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile({
        id: user.id,
        username,
        full_name: fullName,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    setLoading(true);
    try {
      const file = event.target.files[0];
      const publicUrl = await uploadAvatar(file, user.id);

      setAvatarUrl(publicUrl);
      await updateProfile({ id: user.id, avatar_url: publicUrl }); // Auto save avatar
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-default-500">
          Manage your profile and account preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar / Navigation (Optional, could be tabs) */}
        <Card className="h-fit">
          <CardBody className="p-4 space-y-2">
            <Button
              fullWidth
              className="justify-start"
              color="primary"
              startContent={<User size={18} />}
              variant="flat"
            >
              Profile
            </Button>
            {/* Add more settings tabs later */}
          </CardBody>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
              <h2 className="text-xl font-semibold">Public Profile</h2>
              <p className="text-small text-default-500">
                This information will be displayed publicly.
              </p>
            </CardHeader>
            <Divider className="my-4" />
            <CardBody className="px-6 pb-6 space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar
                  isBordered
                  className="w-24 h-24 text-large"
                  src={avatarUrl || user?.user_metadata?.avatar_url}
                />
                <div className="space-y-2">
                  <Button
                    isLoading={loading}
                    startContent={<Upload size={18} />}
                    variant="flat"
                    onPress={() => fileInputRef.current?.click()}
                  >
                    Change Avatar
                  </Button>
                  <p className="text-tiny text-default-400">
                    JPG, GIF or PNG. 1MB max.
                  </p>
                  <input
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    type="file"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>

              <Divider />

              {/* Form Fields */}
              <div className="space-y-4">
                <Input
                  description="Your unique handle on the platform."
                  label="Username"
                  placeholder="johndoe"
                  value={username}
                  variant="bordered"
                  onValueChange={setUsername}
                />
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={fullName}
                  variant="bordered"
                  onValueChange={setFullName}
                />
                <Input
                  label="Website"
                  placeholder="https://example.com"
                  startContent={
                    <span className="text-default-400 text-small">
                      https://
                    </span>
                  }
                  value={website}
                  variant="bordered"
                  onValueChange={setWebsite}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  color="primary"
                  isLoading={loading}
                  startContent={<Save size={18} />}
                  onPress={handleUpdateProfile}
                >
                  Save Changes
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
