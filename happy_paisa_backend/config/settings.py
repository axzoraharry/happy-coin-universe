# Polkadot Node Configuration
POLKADOT_NODE_URL = "wss://westend-rpc.polkadot.io" # For Westend testnet
# POLKADOT_NODE_URL = "ws://127.0.0.1:9944" # For a local node

# Happy Paisa Token Configuration (on Asset Hub)
# This ID is determined AFTER creating the asset on the target Asset Hub instance.
# For Westend Asset Hub, you would create an asset and get an ID.
# For local AssetHub (e.g. via Zombienet), you'd also create it and get an ID.
HAPPY_PAISA_ASSET_ID = 0 # Placeholder: Replace with actual Asset ID
HAPPY_PAISA_ASSET_NAME = "Happy Paisa"
HAPPY_PAISA_ASSET_SYMBOL = "HPC"
HAPPY_PAISA_ASSET_DECIMALS = 12 # Standard for many Substrate assets

# Backend Admin Seed for issuing tokens (SHOULD BE STORED SECURELY, e.g., GCP Secret Manager)
# This is a placeholder and insecure. For development only.
# Example: A randomly generated seed.
BACKEND_ADMIN_SEED = "//Alice" # Default development seed, replace with a secure one for testing.

# Exchange Rate
HAPPY_PAISA_TO_INR_EXCHANGE_RATE = 1000
