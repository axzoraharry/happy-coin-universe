
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecureTransferResult {
  success: boolean;
  error?: string;
  pin_verified?: boolean;
  reference_id?: string;
}

export function useSecureTransfer() {
  const [loading, setLoading] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);
  const { toast } = useToast();

  const initiateTransfer = (transferData: {
    recipientId: string;
    amount: string;
    description: string;
  }) => {
    setPendingTransfer(transferData);
    setShowPinInput(true);
  };

  const executeTransfer = async (pin: string) => {
    if (!pendingTransfer) return false;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: rawResult, error } = await supabase.rpc('process_secure_wallet_transfer' as any, {
        sender_id: user.id,
        recipient_id: pendingTransfer.recipientId,
        transfer_amount: parseFloat(pendingTransfer.amount),
        transfer_description: pendingTransfer.description,
        sender_pin: pin
      });

      if (error) throw error;

      const result = rawResult as unknown as SecureTransferResult;

      if (!result.success) {
        toast({
          title: "Transfer Failed",
          description: result.error || "An error occurred during the transfer",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Transfer Successful",
        description: `Transfer completed successfully. Reference: ${result.reference_id}`,
      });

      // Reset state
      setPendingTransfer(null);
      setShowPinInput(false);
      
      return true;
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during the transfer",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelTransfer = () => {
    setPendingTransfer(null);
    setShowPinInput(false);
  };

  return {
    loading,
    showPinInput,
    pendingTransfer,
    initiateTransfer,
    executeTransfer,
    cancelTransfer
  };
}
