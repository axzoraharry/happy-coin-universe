
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, User } from 'lucide-react';

interface RecipientInfo {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

interface RecipientSearchProps {
  onRecipientFound: (recipient: RecipientInfo) => void;
  onRecipientCleared: () => void;
  recipient: RecipientInfo | null;
}

export function RecipientSearch({ onRecipientFound, onRecipientCleared, recipient }: RecipientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  const createMissingProfile = async (email: string) => {
    try {
      console.log('Attempting to create missing profile for:', email);
      
      // First check if user exists in auth system by checking the users table
      const { data: authUser, error: authError } = await supabase
        .from('users')
        .select('user_id, email, full_name')
        .eq('email', email)
        .maybeSingle();

      console.log('Auth user check result:', authUser, authError);

      if (!authUser) {
        console.log('User not found in auth system - they need to register first');
        return null;
      }

      // Create profile record for this user
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user_id,
          email: authUser.email,
          full_name: authUser.full_name || authUser.email,
          referral_code: authUser.user_id.substring(0, 8).toUpperCase()
        })
        .select()
        .single();

      console.log('Profile creation result:', newProfile, profileError);

      if (profileError) {
        console.error('Failed to create profile:', profileError);
        return null;
      }

      return newProfile;
    } catch (error) {
      console.error('Error in createMissingProfile:', error);
      return null;
    }
  };

  const searchRecipient = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter an email or phone number to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      let recipientData = null;
      
      console.log('Searching for recipient:', searchQuery);
      
      if (searchQuery.includes('@')) {
        // Search by email in profiles table first
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone')
          .eq('email', searchQuery)
          .maybeSingle();

        console.log('Profile search result:', profileData, profileError);

        if (profileData) {
          recipientData = profileData;
        } else {
          // If not found in profiles, try case-insensitive search
          const { data: allProfiles, error: allProfilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name, phone');
          
          console.log('All profiles for debugging:', allProfiles);
          
          // Check if there's a case-insensitive match
          const matchingProfile = allProfiles?.find(profile => 
            profile.email?.toLowerCase() === searchQuery.toLowerCase()
          );
          
          if (matchingProfile) {
            recipientData = matchingProfile;
          } else {
            // Try to create missing profile if user exists in auth
            console.log('Attempting to create missing profile...');
            const createdProfile = await createMissingProfile(searchQuery);
            if (createdProfile) {
              recipientData = createdProfile;
              toast({
                title: "Profile Created",
                description: "Created missing profile for existing user",
              });
            }
          }
        }
      } else {
        // Search by phone
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone')
          .eq('phone', searchQuery)
          .maybeSingle();

        console.log('Phone search result:', profileData, profileError);

        if (profileData) {
          recipientData = profileData;
        }
      }

      if (!recipientData) {
        console.log('No recipient found for:', searchQuery);
        toast({
          title: "User Not Found",
          description: "This email address is not registered. The user needs to create an account first before you can send them Happy Coins.",
          variant: "destructive",
        });
        onRecipientCleared();
        return;
      }

      console.log('Found recipient:', recipientData);
      onRecipientFound(recipientData);
      toast({
        title: "Recipient Found",
        description: `Found user: ${recipientData.full_name || recipientData.email}`,
      });
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "An error occurred while searching for the recipient",
        variant: "destructive",
      });
      onRecipientCleared();
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="search">Find Recipient</Label>
      <div className="flex space-x-2">
        <Input
          id="search"
          type="text"
          placeholder="Enter email or phone number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              searchRecipient();
            }
          }}
        />
        <Button 
          type="button"
          onClick={searchRecipient}
          disabled={searching}
          variant="outline"
        >
          <Search className="h-4 w-4 mr-2" />
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Recipient Display */}
      {recipient && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <User className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">
                {recipient.full_name || 'User'}
              </p>
              <p className="text-sm text-green-600">
                {recipient.email}
                {recipient.phone && ` • ${recipient.phone}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
