
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, UserPlus } from 'lucide-react';

interface Contact {
  id: string;
  email: string;
  full_name: string;
  is_user: boolean;
}

export function ContactSync() {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
          description: "No users found with that email address. Make sure the user has registered an account.",
          variant: "destructive",
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

  const inviteUser = async (email: string) => {
    try {
      // In a real app, this would send an invitation email
      // For now, we'll just show a success message
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${email}`,
      });
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  return (
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
          <div className="text-center py-4">
            <p className="text-muted-foreground">No users found with that email address.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => inviteUser(searchEmail)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite {searchEmail}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
