import { 
  Horizon, 
  Account, 
  Asset, 
  Operation, 
  TransactionBuilder, 
  Keypair, 
  Networks,
  Memo
} from 'stellar-sdk';

interface StellarConfig {
  networkName: string;
  horizonUrl: string;
  assetCode: string;
  assetIssuer: string | null;
}

interface HappyPaisaAccount {
  id: string;
  userId: string;
  stellarAddress: string;
  hpBalance: number;
  inrEquivalent: number;
  isActive: boolean;
}

interface HPTransaction {
  id: string;
  userId: string;
  stellarTransactionId: string;
  transactionType: 'send' | 'receive' | 'buy_hp' | 'sell_hp' | 'conversion';
  hpAmount: number;
  inrAmount?: number;
  feeHp: number;
  fromAddress?: string;
  toAddress?: string;
  memo?: string;
  status: 'pending' | 'completed' | 'failed';
  stellarLedger?: number;
  createdAt: string;
}

export class StellarService {
  private server: Horizon.Server;
  private config: StellarConfig;

  constructor(config: StellarConfig) {
    this.config = config;
    this.server = new Horizon.Server(config.horizonUrl);
  }

  static async initializeFromSupabase() {
    // This would fetch config from Supabase stellar_config table
    const config: StellarConfig = {
      networkName: 'testnet',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      assetCode: 'HP',
      assetIssuer: null // Will be set when HP asset is issued
    };
    return new StellarService(config);
  }

  async createAccount(): Promise<{ publicKey: string; secretKey: string }> {
    const keypair = Keypair.random();
    
    try {
      // Fund the account on testnet
      if (this.config.networkName === 'testnet') {
        await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
      }
      
      return {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret()
      };
    } catch (error) {
      console.error('Error creating Stellar account:', error);
      throw new Error('Failed to create Stellar account');
    }
  }

  async getAccountBalance(publicKey: string): Promise<number> {
    try {
      const account = await this.server.loadAccount(publicKey);
      
      if (!this.config.assetIssuer) {
        // If no HP asset issuer, return 0
        return 0;
      }

      const hpBalance = account.balances.find(balance => 
        balance.asset_type !== 'native' && 
        'asset_code' in balance &&
        balance.asset_code === this.config.assetCode &&
        'asset_issuer' in balance &&
        balance.asset_issuer === this.config.assetIssuer
      );

      return hpBalance ? parseFloat(hpBalance.balance) : 0;
    } catch (error) {
      console.error('Error getting account balance:', error);
      return 0;
    }
  }

  async sendPayment(params: {
    fromSecretKey: string;
    toPublicKey: string;
    amount: string;
    memo?: string;
  }): Promise<{ transactionId: string; ledger: number }> {
    const { fromSecretKey, toPublicKey, amount, memo } = params;
    
    try {
      const sourceKeypair = Keypair.fromSecret(fromSecretKey);
      const sourceAccount = await this.server.loadAccount(sourceKeypair.publicKey());
      
      if (!this.config.assetIssuer) {
        throw new Error('HP asset not configured');
      }

      const hpAsset = new Asset(this.config.assetCode, this.config.assetIssuer);
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: (await this.server.fetchBaseFee()).toString(),
        networkPassphrase: this.config.networkName === 'testnet' ? Networks.TESTNET : Networks.PUBLIC
      })
        .addOperation(Operation.payment({
          destination: toPublicKey,
          asset: hpAsset,
          amount: amount
        }))
        .setTimeout(30);

      if (memo) {
        transaction.addMemo(Memo.text(memo));
      }

      const builtTransaction = transaction.build();
      builtTransaction.sign(sourceKeypair);
      
      const result = await this.server.submitTransaction(builtTransaction);
      
      return {
        transactionId: result.hash,
        ledger: result.ledger
      };
    } catch (error) {
      console.error('Error sending payment:', error);
      throw new Error('Failed to send payment');
    }
  }

  async getTransactionHistory(publicKey: string, limit = 50): Promise<any[]> {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(publicKey)
        .order('desc')
        .limit(limit)
        .call();
      
      return transactions.records;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  async establishTrustline(secretKey: string): Promise<void> {
    if (!this.config.assetIssuer) {
      throw new Error('HP asset issuer not configured');
    }

    try {
      const keypair = Keypair.fromSecret(secretKey);
      const account = await this.server.loadAccount(keypair.publicKey());
      
      const hpAsset = new Asset(this.config.assetCode, this.config.assetIssuer);
      
      const transaction = new TransactionBuilder(account, {
        fee: await this.server.fetchBaseFee(),
        networkPassphrase: this.config.networkName === 'testnet' ? Networks.TESTNET : Networks.PUBLIC
      })
        .addOperation(Operation.changeTrust({
          asset: hpAsset
        }))
        .setTimeout(30)
        .build();

      transaction.sign(keypair);
      
      await this.server.submitTransaction(transaction);
    } catch (error) {
      console.error('Error establishing trustline:', error);
      throw new Error('Failed to establish trustline');
    }
  }

  async findPaymentPath(params: {
    sourceAsset: Asset;
    destinationAsset: Asset;
    destinationAmount: string;
    destinationAccount: string;
  }) {
    try {
      const paths = await this.server
        .strictReceivePaths(
          params.sourceAsset,
          params.destinationAsset,
          params.destinationAmount
        )
        .destinationAccount(params.destinationAccount)
        .call();
      
      return paths.records;
    } catch (error) {
      console.error('Error finding payment path:', error);
      return [];
    }
  }

  async monitorLedger(callback: (ledger: any) => void) {
    try {
      this.server
        .ledgers()
        .cursor('now')
        .stream({
          onmessage: callback,
          onerror: (error) => {
            console.error('Ledger monitoring error:', error);
          }
        });
    } catch (error) {
      console.error('Error starting ledger monitoring:', error);
    }
  }

  getNetworkPassphrase(): string {
    return this.config.networkName === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
  }

  isTestnet(): boolean {
    return this.config.networkName === 'testnet';
  }
}

export default StellarService;