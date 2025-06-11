
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
      
      // First try to search in profiles table
      if (searchQuery.includes('@')) {
        // Search by email
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone')
          .eq('email', searchQuery)
          .maybeSingle();

        if (profileData) {
          recipientData = profileData;
        } else {
          console.log('User not found in profiles table, this might be a sync issue');
        }
      } else {
        // Search by phone
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone')
          .eq('phone', searchQuery)
          .maybeSingle();

        if (profileData) {
          recipientData = profileData;
        }
      }

      if (!recipientData) {
        toast({
          title: "Recipient Not Found",
          description: "No user found with that email or phone number. Make sure the user has registered an account.",
          variant: "destructive",
        });
        onRecipientCleared();
        return;
      }

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
