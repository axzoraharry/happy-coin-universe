
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Eye, 
  EyeOff, 
  RefreshCw,
  CreditCard,
  Server
} from 'lucide-react';

interface WalletHeaderProps {
  balanceVisible: boolean;
  loading: boolean;
  isServiceAvailable: boolean;
  onToggleVisibility: () => void;
  onRefresh: () => void;
}

export function WalletHeader({ 
  balanceVisible, 
  loading, 
  isServiceAvailable, 
  onToggleVisibility, 
  onRefresh 
}: WalletHeaderProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-xl">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            My Financial Hub
          </h2>
          <p className="text-muted-foreground text-lg">
            Complete overview of your digital wallet ecosystem
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleVisibility}
            className="hover:bg-muted/50 transition-all duration-200"
          >
            {balanceVisible ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {balanceVisible ? 'Hide' : 'Show'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="hover:bg-primary/5 hover:border-primary/20 transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Service Status with Animation */}
      <div className="flex flex-wrap gap-3">
        <Badge 
          variant="default" 
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20 text-green-700 hover:scale-105 transition-transform duration-200"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <CreditCard className="h-3 w-3" />
          Traditional Wallet Active
        </Badge>
        <Badge 
          variant={isServiceAvailable ? "default" : "destructive"}
          className={`flex items-center gap-2 px-4 py-2 hover:scale-105 transition-transform duration-200 ${
            isServiceAvailable 
              ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20 text-blue-700' 
              : 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/20'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isServiceAvailable ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
          <Server className="h-3 w-3" />
          Happy Paisa Ledger {isServiceAvailable ? "Online" : "Offline"}
        </Badge>
      </div>
    </div>
  );
}
