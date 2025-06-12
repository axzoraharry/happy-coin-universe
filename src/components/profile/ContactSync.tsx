
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, UserPlus, Link2, Copy } from 'lucide-react';

interface Contact {
  id: string;
  email: string;
  full_name: string;
  is_user: boolean;
}

interface Profile {
  referral_code: string;
}

export function ContactSync() {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter an email address to search",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      let contacts: Contact[] = [];
      
      console.log('Searching for users with email:', searchEmail);
      
      // First try exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', searchEmail)
        .maybeSingle();

      console.log('Exact match result:', exactMatch, exactError);

      if (exactMatch) {
        contacts = [{
          ...exactMatch,
          is_user: true
        }];
      } else {
        // If no exact match, try case-insensitive search
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name');
        
        console.log('All profiles for case-insensitive search:', allProfiles?.length, allProfilesError);
        
        if (allProfiles && !allProfilesError) {
          const matchingProfiles = allProfiles.filter(profile => 
            profile.email?.toLowerCase() === searchEmail.toLowerCase()
          );
          
          console.log('Case-insensitive matches found:', matchingProfiles.length);
          
          contacts = matchingProfiles.map(profile => ({
            ...profile,
            is_user: true
          }));
        }
        
        // If still no results, try partial match for broader search
        if (contacts.length === 0) {
          const { data: partialMatches, error: partialError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .ilike('email', `%${searchEmail}%`)
            .limit(10);

          console.log('Partial match results:', partialMatches?.length, partialError);

          if (partialMatches && !partialError) {
            contacts = partialMatches.map(user => ({
              ...user,
              is_user: true
            }));
          }
        }
      }

      console.log('Final search results:', contacts);
      setSearchResults(contacts);

      if (contacts.length === 0) {
        toast({
          title: "No Users Found",
          description: "No users found with that email address. You can invite them using the invite link below.",
        });
      }
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = (email?: string) => {
    if (!userProfile?.referral_code) return '';
    
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/?ref=${userProfile.referral_code}`;
    
    if (email) {
      return `${inviteUrl}&email=${encodeURIComponent(email)}`;
    }
    
    return inviteUrl;
  };

  const copyInviteLink = async (email?: string) => {
    const inviteLink = generateInviteLink(email);
    
    if (!inviteLink) {
      toast({
        title: "Error",
        description: "Unable to generate invite link. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Invite Link Copied!",
        description: email 
          ? `Invite link for ${email} copied to clipboard`
          : "Invite link copied to clipboard. Share it with friends to earn bonus coins!",
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Invite Link Copied!",
        description: email 
          ? `Invite link for ${email} copied to clipboard`
          : "Invite link copied to clipboard. Share it with friends to earn bonus coins!",
      });
    }
  };

  const shareViaEmail = (email: string) => {
    const inviteLink = generateInviteLink(email);
    const subject = encodeURIComponent("Join me on this awesome digital wallet app!");
    const body = encodeURIComponent(
      `Hi!\n\nI'm using this great digital wallet app and thought you might like it too. ` +
      `You'll get bonus coins when you sign up using my referral link:\n\n${inviteLink}\n\n` +
      `Check it out!`
    );
    
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Find Friends</span>
          </CardTitle>
          <CardDescription>
            Search for existing users by email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="searchEmail">Email Address</Label>
              <Input
                id="searchEmail"
                type="email"
                placeholder="Enter email address to search"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchUsers} disabled={loading || !searchEmail.trim()}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Search Results</h4>
              {searchResults.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {contact.full_name?.charAt(0) || contact.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{contact.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
                  {contact.is_user && (
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchEmail && searchResults.length === 0 && !loading && (
            <div className="text-center py-4 space-y-3">
              <p className="text-muted-foreground">No users found with that email address.</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyInviteLink(searchEmail)}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy Invite Link
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => shareViaEmail(searchEmail)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Email Invite
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Invite Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link2 className="h-5 w-5" />
            <span>Your Invite Link</span>
          </CardTitle>
          <CardDescription>
            Share this link with friends to earn bonus coins when they sign up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Input
              value={generateInviteLink()}
              readOnly
              className="bg-transparent border-none flex-1"
            />
            <Button
              size="sm"
              onClick={() => copyInviteLink()}
              disabled={!userProfile?.referral_code}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {userProfile?.referral_code && (
            <p className="text-sm text-muted-foreground">
              Your referral code: <strong>{userProfile.referral_code}</strong>
            </p>
          )}
          {!userProfile?.referral_code && (
            <p className="text-sm text-muted-foreground">
              Loading your referral code...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
