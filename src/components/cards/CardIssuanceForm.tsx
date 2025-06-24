
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Shield, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  X,
  Upload,
  User,
  Phone,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CardIssuanceFormProps {
  onIssue: (cardData: any) => void;
  onCancel: () => void;
}

export function CardIssuanceForm({ onIssue, onCancel }: CardIssuanceFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    pin_code: '',
    daily_limit: '5000',
    monthly_limit: '50000',
    initial_load: '1000',
    kyc_verified: false,
    terms_accepted: false,
    privacy_accepted: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.full_name && formData.phone && formData.address && formData.pin_code;
      case 2:
        return formData.daily_limit && formData.monthly_limit && formData.initial_load;
      case 3:
        return formData.kyc_verified && formData.terms_accepted && formData.privacy_accepted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast({
        title: "Requirements Not Met",
        description: "Please complete all requirements before submitting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      onIssue(formData);
    } catch (error) {
      toast({
        title: "Issuance Failed",
        description: "There was an error processing your card request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Personal Information", description: "Basic details and address" },
    { number: 2, title: "Card Settings", description: "Limits and initial funding" },
    { number: 3, title: "Verification & Terms", description: "KYC and agreements" }
  ];

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Issue Virtual Debit Card
          </DialogTitle>
          <DialogDescription>
            Follow these steps to get your virtual debit card linked to Happy Paisa
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                currentStep >= step.number 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > step.number ? <CheckCircle className="h-4 w-4" /> : step.number}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Provide your basic information as per your ID documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name as per ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Complete address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin_code">PIN Code *</Label>
                  <Input
                    id="pin_code"
                    value={formData.pin_code}
                    onChange={(e) => handleInputChange('pin_code', e.target.value)}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Card Settings
                </CardTitle>
                <CardDescription>
                  Set up spending limits and initial funding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="daily_limit">Daily Limit (₹) *</Label>
                    <Input
                      id="daily_limit"
                      type="number"
                      value={formData.daily_limit}
                      onChange={(e) => handleInputChange('daily_limit', e.target.value)}
                      placeholder="5000"
                    />
                    <p className="text-xs text-muted-foreground">
                      ≈ {(parseFloat(formData.daily_limit) / 1000 || 0).toFixed(2)} Happy Coins
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_limit">Monthly Limit (₹) *</Label>
                    <Input
                      id="monthly_limit"
                      type="number"
                      value={formData.monthly_limit}
                      onChange={(e) => handleInputChange('monthly_limit', e.target.value)}
                      placeholder="50000"
                    />
                    <p className="text-xs text-muted-foreground">
                      ≈ {(parseFloat(formData.monthly_limit) / 1000 || 0).toFixed(2)} Happy Coins
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial_load">Initial Load Amount (₹) *</Label>
                  <Input
                    id="initial_load"
                    type="number"
                    value={formData.initial_load}
                    onChange={(e) => handleInputChange('initial_load', e.target.value)}
                    placeholder="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    This amount will be deducted from your Happy Paisa balance
                  </p>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Spending limits can be modified after card issuance. Initial load requires sufficient Happy Paisa balance.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    KYC Verification
                  </CardTitle>
                  <CardDescription>
                    Complete KYC as required by RBI regulations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Full KYC verification is mandatory for virtual card issuance as per RBI PPI guidelines. 
                      This process will be handled by our regulated partner.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="kyc_verified"
                      checked={formData.kyc_verified}
                      onCheckedChange={(checked) => handleInputChange('kyc_verified', checked as boolean)}
                    />
                    <Label htmlFor="kyc_verified" className="text-sm">
                      I understand that KYC verification will be required and I agree to provide necessary documents *
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms_accepted"
                      checked={formData.terms_accepted}
                      onCheckedChange={(checked) => handleInputChange('terms_accepted', checked as boolean)}
                    />
                    <Label htmlFor="terms_accepted" className="text-sm">
                      I agree to the Virtual Card Terms & Conditions and understand the fees and charges *
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="privacy_accepted"
                      checked={formData.privacy_accepted}
                      onCheckedChange={(checked) => handleInputChange('privacy_accepted', checked as boolean)}
                    />
                    <Label htmlFor="privacy_accepted" className="text-sm">
                      I consent to sharing my data with our banking partner for card issuance and management *
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>

          <div className="space-x-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
                Previous
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Processing...' : 'Issue Card'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
