
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, roleLabels } from "@/types/permissions";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Check for invitation parameters
  const isInvite = searchParams.get('invite') === 'true';
  const inviteRole = searchParams.get('role') as UserRole;
  const inviteEmail = searchParams.get('email');

  useEffect(() => {
    if (isInvite && inviteEmail) {
      setEmail(decodeURIComponent(inviteEmail));
    }
  }, [isInvite, inviteEmail]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: "Welcome back",
        description: "You have been successfully logged in"
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Sign up with role metadata if this is an invitation
      const signUpData: any = {
        email,
        password,
      };

      // Add role to user metadata if this is an invitation signup
      if (isInvite && inviteRole) {
        signUpData.options = {
          data: {
            role: inviteRole
          }
        };
      }

      const { error } = await supabase.auth.signUp(signUpData);
      
      if (error) throw error;
      
      const successMessage = isInvite 
        ? `Account created with ${roleLabels[inviteRole]} role. Please check your email for confirmation.`
        : "Please check your email for confirmation instructions.";
      
      toast({
        title: "Account created",
        description: successMessage
      });
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-purple-600">Nihar Creation</h1>
          <p className="text-muted-foreground">Manufacturing Management System</p>
        </div>
        
        <Card>
          {isInvite && inviteRole && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>You've been invited!</strong> You're signing up with {roleLabels[inviteRole]} role.
                  </p>
                </div>
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle>{isInvite ? 'Complete Your Invitation' : 'Account Access'}</CardTitle>
            <CardDescription>
              {isInvite 
                ? 'Create your account to join the team' 
                : 'Sign in to your account or create a new one'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={isInvite ? "signup" : "signin"}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">
                  {isInvite ? 'Complete Invitation' : 'Create Account'}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input
                      id="email-signin"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin">Password</Label>
                    <Input
                      id="password-signin"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            Secure access to your manufacturing operations
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
