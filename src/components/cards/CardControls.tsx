
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Shield, 
  Globe, 
  ShoppingCart, 
  Fuel, 
  Utensils,
  Plane,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VirtualCard {
  id: string;
  spend_limit_daily: number;
  spend_limit_monthly: number;
}

interface CardControlsProps {
  card: VirtualCard;
  onUpdateControls: (controls: any) => void;
}

interface MerchantCategory {
  code: string;
  name: string;
  icon: any;
  enabled: boolean;
}

export function CardControls({ card, onUpdateControls }: CardControlsProps) {
  const [dailyLimit, setDailyLimit] = useState(card.spend_limit_daily.toString());
  const [monthlyLimit, setMonthlyLimit] = useState(card.spend_limit_monthly.toString());
  const [onlineTransactions, setOnlineTransactions] = useState(true);
  const [internationalTransactions, setInternationalTransactions] = useState(false);
  const [contactlessPayments, setContactlessPayments] = useState(true);
  const { toast } = useToast();

  const [merchantCategories, setMerchantCategories] = useState<MerchantCategory[]>([
    { code: 'grocery', name: 'Grocery Stores', icon: ShoppingCart, enabled: true },
    { code: 'fuel', name: 'Fuel Stations', icon: Fuel, enabled: true },
    { code: 'restaurants', name: 'Restaurants', icon: Utensils, enabled: true },
    { code: 'travel', name: 'Travel & Airlines', icon: Plane, enabled: false },
  ]);

  const handleSaveControls = () => {
    const controls = {
      spend_limit_daily: parseFloat(dailyLimit),
      spend_limit_monthly: parseFloat(monthlyLimit),
      online_transactions: onlineTransactions,
      international_transactions: internationalTransactions,
      contactless_payments: contactlessPayments,
      merchant_categories: merchantCategories.reduce((acc, cat) => {
        acc[cat.code] = cat.enabled;
        return acc;
      }, {} as Record<string, boolean>)
    };

    onUpdateControls(controls);
    
    toast({
      title: "Controls Updated",
      description: "Your card controls have been successfully updated",
    });
  };

  const toggleMerchantCategory = (code: string) => {
    setMerchantCategories(prev => 
      prev.map(cat => 
        cat.code === code ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Spending Limits
          </CardTitle>
          <CardDescription>
            Set daily and monthly spending limits for your virtual card
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="daily-limit">Daily Limit (₹)</Label>
              <Input
                id="daily-limit"
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="5000"
              />
              <p className="text-xs text-muted-foreground">
                ≈ {(parseFloat(dailyLimit) / 1000 || 0).toFixed(2)} Happy Coins
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthly-limit">Monthly Limit (₹)</Label>
              <Input
                id="monthly-limit"
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="50000"
              />
              <p className="text-xs text-muted-foreground">
                ≈ {(parseFloat(monthlyLimit) / 1000 || 0).toFixed(2)} Happy Coins
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Transaction Controls
          </CardTitle>
          <CardDescription>
            Control where and how your card can be used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="online-transactions">Online Transactions</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow e-commerce and online purchases
                </p>
              </div>
              <Switch
                id="online-transactions"
                checked={onlineTransactions}
                onCheckedChange={setOnlineTransactions}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  <Label htmlFor="international-transactions">International Transactions</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow transactions outside India
                </p>
              </div>
              <Switch
                id="international-transactions"
                checked={internationalTransactions}
                onCheckedChange={setInternationalTransactions}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <Label htmlFor="contactless-payments">Contactless Payments</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable tap-to-pay and mobile wallet payments
                </p>
              </div>
              <Switch
                id="contactless-payments"
                checked={contactlessPayments}
                onCheckedChange={setContactlessPayments}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Merchant Categories
          </CardTitle>
          <CardDescription>
            Control which types of merchants can charge your card
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {merchantCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor={`merchant-${category.code}`}>{category.name}</Label>
                      <p className="text-sm text-muted-foreground">
                        {category.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={`merchant-${category.code}`}
                    checked={category.enabled}
                    onCheckedChange={() => toggleMerchantCategory(category.code)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Controls Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveControls} className="bg-gradient-to-r from-primary to-blue-600">
          <Save className="h-4 w-4 mr-2" />
          Save Controls
        </Button>
      </div>
    </div>
  );
}
