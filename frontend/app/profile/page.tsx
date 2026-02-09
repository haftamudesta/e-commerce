"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProfileUpdateFormData,
  profileUpdateSchema,
} from "../../lib/validation";
import { userAPI } from "../../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "../../hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, User, Mail, KeyRound, Shield } from "lucide-react";
import DeleteAccountDialog from "../../components/profile/DeleteAccountDialog";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
    },
  });

  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      setIsUpdating(true);

      // Filter out empty values
      const updateData: any = {};
      if (data.username && data.username !== user?.username) {
        updateData.username = data.username;
      }
      if (data.email && data.email !== user?.email) {
        updateData.email = data.email;
      }
      if (data.newPassword) {
        updateData.current_password = data.currentPassword;
        updateData.new_password = data.newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to your profile.",
        });
        return;
      }

      const response = await userAPI.updateProfile(updateData);
      updateUser(response.data);

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      });

      form.reset({
        username: response.data.username,
        email: response.data.email,
        currentPassword: "",
        newPassword: "",
      });
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.errors) {
        errorData.errors.forEach((err: string) => {
          toast({
            title: "Error",
            description: err,
            variant: "destructive",
          });
        });
      } else {
        toast({
          title: "Error",
          description: errorData?.detail || "Failed to update profile",
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account information and security settings
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Info Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Username
                </div>
                <div className="text-lg font-semibold">{user.username}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Email
                </div>
                <div className="text-lg font-semibold">{user.email}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Role
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-lg font-semibold capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Form Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Update Profile</CardTitle>
              <CardDescription>
                Make changes to your account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter new username"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            3-50 characters, letters, numbers, and underscores
                            only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter new email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <KeyRound className="h-5 w-5" />
                      Change Password
                    </h3>

                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter current password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter new password"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 8 characters with uppercase, lowercase, and
                            numbers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="submit"
                      disabled={isUpdating || !form.formState.isDirty}
                    >
                      {isUpdating ? "Updating..." : "Update Profile"}
                    </Button>

                    <DeleteAccountDialog />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
