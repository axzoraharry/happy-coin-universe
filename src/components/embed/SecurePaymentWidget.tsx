
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, CheckCircle, XCircle, Lock, Shield } from 'lucide-react';
import { SecurePinInput } from '../wallet/SecurePinInput';
import { secureApi } from '@/lib/secureApi';
import { paymentRequestSchema, sanitizeInput } from '@/lib/validation';

interface SecurePaymentWidgetProps {
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

export function SecurePaymentWidget({
  apiKey,
  amount,
  orderId,
  description = 'Payment',
  userEmail = '',
  onSuccess,
  onError,
  theme = 'light',
  compact = false
}: SecurePaymentWidgetProps) {
  const [email, setEmail] = useState(userEmail);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'pin_required'>('idle');
  const [message, setMessage] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);

  useEffect(() => {
    validateApiKey();
  }, [apiKey]);

  const validateApiKey = async () => {
    try {
      const isValid = await secureApi.validateApiKey(apiKey);
      setIsApiKeyValid(isValid);
      if (!isValid) {
        setStatus('error');
        setMessage('Invalid API key format');
        onError?.('Invalid API key format');
      }
    } catch (error) {
      setIsApiKeyValid(false);
      setStatus('error');
      setMessage('API key validation failed');
      onError?.('API key validation failed');
    }
  };

  const validateInput = () => {
    try {
      paymentRequestSchema.parse({
        external_order_id: sanitizeInput(orderId),
        user_email: sanitizeInput(email),
        amount: amount,
        description: description ? sanitizeInput(description) : undefined
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

  const processPayment = async (pin?: string) => {
    if (!isApiKeyValid) {
      setStatus('error');
      setMessage('Invalid API key');
      onError?.('Invalid API key');
      return;
    }

    if (!validateInput()) {
      setStatus('error');
      setMessage('Please check your input and try again');
      onError?.('Validation failed');
      return;
    }

    setProcessing(true);
    setStatus('processing');
    setMessage('Processing secure payment...');

    try {
      const result = await secureApi.secureExternalPayment({
        apiKey,
        external_order_id: sanitizeInput(orderId),
        user_email: sanitizeInput(email),
        amount,
        description: description ? sanitizeInput(description) : undefined,
        user_pin: pin
      });

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
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setStatus('error');
      setMessage(error.message || 'Payment processing failed');
      setShowPinInput(false);
      onError?.(error.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
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
            <span className="font-medium flex items-center">
              <Shield className="h-4 w-4 mr-1 text-green-600" />
              Secure Payment
            </span>
            <Badge variant="outline">{amount} HC</Badge>
          </div>
          
          {!userEmail && (
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={processing || status === 'success'}
                className={validationErrors.user_email ? 'border-red-500' : ''}
              />
              {validationErrors.user_email && (
                <p className="text-xs text-red-600">{validationErrors.user_email}</p>
              )}
            </div>
          )}
          
          <Button
            onClick={() => processPayment()}
            disabled={processing || status === 'success' || !isApiKeyValid}
            className="w-full"
          >
            {getStatusIcon()}
            <span className="ml-2">
              {status === 'success' ? 'Payment Complete' : processing ? 'Processing...' : 'Pay Securely'}
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
          <span>Secure HappyCoins Payment</span>
          <Shield className="h-4 w-4 text-green-600" />
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
              className={validationErrors.user_email ? 'border-red-500' : ''}
            />
            {validationErrors.user_email && (
              <p className="text-sm text-red-600">{validationErrors.user_email}</p>
            )}
          </div>
        )}

        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Security Features:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>API key validation</li>
                <li>Input sanitization</li>
                <li>Rate limiting protection</li>
                <li>PIN verification when required</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={() => processPayment()}
          disabled={processing || status === 'success' || !isApiKeyValid}
          className="w-full"
        >
          {getStatusIcon()}
          <span className="ml-2">
            {status === 'success' ? 'Payment Complete' : processing ? 'Processing Secure Payment...' : `Pay ${amount} HC Securely`}
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
