
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, CheckCircle, XCircle, Lock } from 'lucide-react';
import { SecurePinInput } from '../wallet/SecurePinInput';
import { supabase } from '@/integrations/supabase/client';

interface PaymentWidgetProps {
  apiKey: string;
  amount: number;
  orderId: string;
  description?: string;
  userEmail?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark';
  compact?: boolean;
}

interface PaymentResult {
  success: boolean;
  payment_request_id?: string;
  transaction_id?: string;
  reference_id?: string;
  pin_verified?: boolean;
  pin_required?: boolean;
  error?: string;
}

export function PaymentWidget({
  apiKey,
  amount,
  orderId,
  description = 'Payment',
  userEmail = '',
  onSuccess,
  onError,
  theme = 'light',
  compact = false
}: PaymentWidgetProps) {
  const [email, setEmail] = useState(userEmail);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'pin_required'>('idle');
  const [message, setMessage] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  const processPayment = async (pin?: string) => {
    if (!email.trim()) {
      setStatus('error');
      setMessage('Email is required');
      onError?.('Email is required');
      return;
    }

    setProcessing(true);
    setStatus('processing');
    setMessage('Processing payment...');

    try {
      const requestBody: any = {
        external_order_id: orderId,
        user_email: email,
        amount: amount,
        description: description,
      };

      // Include PIN if provided
      if (pin) {
        requestBody.user_pin = pin;
      }

      console.log('Making payment request to wallet-payment edge function');

      // Use Supabase Edge Function instead of API route
      const { data, error } = await supabase.functions.invoke('wallet-payment', {
        body: requestBody,
        headers: {
          'x-api-key': apiKey,
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Payment processing failed');
      }

      const result: PaymentResult = data;

      if (result.success) {
        setStatus('success');
        setMessage('Payment completed successfully!');
        setShowPinInput(false);
        onSuccess?.(result);
      } else if (result.pin_required) {
        setStatus('pin_required');
        setMessage('PIN verification required');
        setShowPinInput(true);
        setProcessing(false);
        return;
      } else {
        setStatus('error');
        setMessage(result.error || 'Payment failed');
        setShowPinInput(false);
        onError?.(result.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setStatus('error');
      setMessage(error.message || 'Network error occurred');
      setShowPinInput(false);
      onError?.(error.message || 'Network error occurred');
    } finally {
      if (status !== 'pin_required') {
        setProcessing(false);
      }
    }
  };

  const handlePinSubmit = async (pin: string) => {
    await processPayment(pin);
  };

  const handlePinCancel = () => {
    setShowPinInput(false);
    setStatus('idle');
    setMessage('');
    setProcessing(false);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pin_required':
        return <Lock className="h-4 w-4 text-blue-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-200';

  // Show PIN input when required
  if (showPinInput) {
    return (
      <div className={`p-4 rounded-lg border ${themeClasses} max-w-sm`}>
        <SecurePinInput
          onPinEntered={handlePinSubmit}
          onCancel={handlePinCancel}
          isVerifying={processing}
          title="Verify Payment"
          description="Enter your 4-digit PIN to complete the payment"
        />
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`p-4 rounded-lg border ${themeClasses} max-w-sm`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Pay with HappyCoins</span>
            <Badge variant="outline">{amount} HC</Badge>
          </div>
          
          {!userEmail && (
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={processing || status === 'success'}
            />
          )}
          
          <Button
            onClick={() => processPayment()}
            disabled={processing || status === 'success'}
            className="w-full"
          >
            {getStatusIcon()}
            <span className="ml-2">
              {processing ? 'Processing...' : status === 'success' ? 'Paid' : 'Pay Now'}
            </span>
          </Button>
          
          {message && (
            <p className={`text-xs ${status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`max-w-md ${themeClasses}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>HappyCoins Payment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Amount:</span>
            <Badge variant="outline" className="text-lg">{amount} HC</Badge>
          </div>
          <div className="flex justify-between">
            <span>Description:</span>
            <span className="text-sm text-muted-foreground">{description}</span>
          </div>
          <div className="flex justify-between">
            <span>Order ID:</span>
            <span className="text-sm font-mono">{orderId}</span>
          </div>
        </div>

        {!userEmail && (
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={processing || status === 'success'}
            />
          </div>
        )}

        <Button
          onClick={() => processPayment()}
          disabled={processing || status === 'success'}
          className="w-full"
        >
          {getStatusIcon()}
          <span className="ml-2">
            {processing ? 'Processing Payment...' : status === 'success' ? 'Payment Complete' : `Pay ${amount} HC`}
          </span>
        </Button>

        {message && (
          <div className={`p-3 rounded text-sm ${
            status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            status === 'pin_required' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
