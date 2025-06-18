
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, Shield, AlertTriangle } from 'lucide-react';
import { secureApi } from '@/lib/secureApi';
import { transferRequestSchema } from '@/lib/validation';
import { SecurePinInput } from '../wallet/SecurePinInput';

export function SecureTransferForm() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = () => {
    try {
      transferRequestSchema.parse({
        recipientEmail,
        amount: parseFloat(amount),
        description: description || undefined
      });
      setValidationErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        errors[err.path[0]] = err.message;
      });
      setValidationErrors(errors);
      return false;
    }
  };

  const handleTransfer = async (pin?: string) => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before proceeding",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await secureApi.secureTransfer({
        recipientEmail,
        amount: parseFloat(amount),
        description: description || undefined,
        pin
      });

      toast({
        title: "Transfer Successful",
        description: `$${amount} sent to ${recipientEmail}. Reference: ${result.reference_id}`,
      });

      // Reset form
      setRecipientEmail('');
      setAmount('');
      setDescription('');
      setShowPinInput(false);
      
      // Refresh page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Transfer error:', error);
      
      // Check if PIN is required
      if (error.message?.includes('PIN') && !pin) {
        setShowPinInput(true);
        setLoading(false);
        return;
      }
      
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during the transfer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = (pin: string) => {
    handleTransfer(pin);
  };

  const handlePinCancel = () => {
    setShowPinInput(false);
    setLoading(false);
  };

  if (showPinInput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Secure Transfer Verification</span>
          </CardTitle>
          <CardDescription>
            Enter your 4-digit PIN to authorize the transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SecurePinInput
            onPinEntered={handlePinSubmit}
            onCancel={handlePinCancel}
            isVerifying={loading}
            title="Authorize Transfer"
            description={`Confirm transfer of $${amount} to ${recipientEmail}`}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Secure Money Transfer</span>
          <Shield className="h-4 w-4 text-green-600" />
        </CardTitle>
        <CardDescription>
          Transfer money securely with enhanced validation and rate limiting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleTransfer(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Email</Label>
            <Input
              id="recipient"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className={validationErrors.recipientEmail ? 'border-red-500' : ''}
              required
            />
            {validationErrors.recipientEmail && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {validationErrors.recipientEmail}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (max $10,000)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              max="10000"
              step="0.01"
              className={validationErrors.amount ? 'border-red-500' : ''}
              required
            />
            {validationErrors.amount && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {validationErrors.amount}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional, max 500 characters)</Label>
            <Textarea
              id="description"
              placeholder="What's this transfer for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className={validationErrors.description ? 'border-red-500' : ''}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
            {validationErrors.description && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {validationErrors.description}
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Security Features:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Rate limiting: 5 transfers per 5 minutes</li>
                  <li>Input validation and sanitization</li>
                  <li>PIN verification for secure transfers</li>
                  <li>Daily transfer limits apply</li>
                </ul>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Processing Secure Transfer...' : 'Send Money Securely'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
