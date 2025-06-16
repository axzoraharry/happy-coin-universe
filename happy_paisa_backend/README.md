# Happy Paisa Backend

## Project Overview
This project implements the backend service for "Happy Paisa," a virtual currency envisioned for the "Happy Cricket Civilization."
It provides core logic for managing user balances (award, deduct, query) and will serve as the interface for interacting with the Polkadot network where Happy Paisa tokens are to be defined and transacted.

**Important Note on Regulatory Implications:** The original project specification for Happy Paisa includes a fixed exchange rate to INR and potential cash-out features. These present significant regulatory challenges in India. This backend implementation will include the fixed exchange rate for *internal display and accounting purposes only*. Any features related to real-world value exchange or cash-out are explicitly out of scope for this technical build until all regulatory and legal implications are fully addressed and cleared by experts.

## Project Structure
The project is organized as follows:

-   `happy_paisa_backend/`
    ├── `app/`: Contains the FastAPI application, including API endpoint definitions (`main.py`).
    ├── `core/`: Implements the core business logic for Happy Paisa (e.g., `services.py` for balance management).
    ├── `polkadot/`: Houses modules for interacting with the Polkadot network (e.g., `utils.py` for connection and transaction placeholders).
    ├── `config/`: Stores configuration files (e.g., `settings.py`).
    ├── `tests/`: Intended for unit and integration tests (currently contains placeholders).
    └── `README.md`: This file.

## Setup and Running

### Prerequisites
-   Python 3.8+
-   Pip (Python package installer)
-   Virtual environment tool (e.g., `venv`)

### Installation
1.  **Clone the repository (if applicable).**

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    A `requirements.txt` file will be added later. For now, the primary dependencies are FastAPI and Uvicorn.
    ```bash
    pip install fastapi uvicorn[standard] python-substrate-interface
    ```
    *(Note: `python-substrate-interface` is used for Polkadot interactions; other libraries may be added as the project evolves).*

### Running the Application
The FastAPI application can be run locally using Uvicorn:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
-   `--reload`: Enables auto-reloading when code changes (useful for development).
-   The application will be available at `http://127.0.0.1:8000`.
-   API documentation (Swagger UI) will be available at `http://127.0.0.1:8000/docs`.
-   Alternative API documentation (ReDoc) will be available at `http://127.0.0.1:8000/redoc`.

## API Endpoints
The following API endpoints are currently available:

*   **`POST /award`**: Awards Happy Paisa to a user.
    *   Request Body: `{"user_id": "string", "amount": float}`
    *   Response: `{"success": true, "user_id": "string", "new_balance": float}` or error.
*   **`POST /deduct`**: Deducts Happy Paisa from a user.
    *   Request Body: `{"user_id": "string", "amount": float}`
    *   Response: `{"success": true, "user_id": "string", "new_balance": float}` or error.
*   **`GET /balance/{user_id}`**: Retrieves a user's Happy Paisa balance and its INR equivalent.
    *   Response: `{"success": true, "user_id": "string", "happy_paisa_balance": float, "inr_equivalent": float}`.

## Key Design Decisions

### HappyPaisa Token Definition

#### Chosen Approach
`HappyPaisa` will be implemented as a fungible asset on the Polkadot Asset Hub, the system parachain for assets on Polkadot.

#### Rationale
Asset Hub is specifically designed for creating and managing assets efficiently within the Polkadot ecosystem. This approach offers several advantages:
*   **Lower Transaction Fees:** Compared to executing similar operations on the Polkadot Relay Chain or a custom parachain.
*   **Lower Deposit Requirements:** Creating an asset on Asset Hub typically requires a smaller existential deposit than securing a parachain slot.
*   **Leveraging Shared Security:** `HappyPaisa` will benefit from Polkadot's shared security model without the need to manage its own validator set.
*   **Simplicity:** It avoids the significant complexity and cost associated with developing, deploying, and maintaining a dedicated parachain, which is not necessary for `HappyPaisa`'s current requirements.

#### Key Features of Asset Hub to be Used
The following features of Asset Hub will be utilized for `HappyPaisa`:
*   **Creation:** Defining `HappyPaisa` with a specific name (e.g., Happy Paisa Coin), symbol (e.g., HPC), and a set number of decimals.
*   **Issuance (Minting) and Burning:** Controlling the total supply of `HappyPaisa` tokens by creating new tokens or destroying existing ones based on the project's logic.
*   **Transferring Tokens:** Enabling users to send and receive `HappyPaisa` tokens between their accounts on Asset Hub.
*   **Admin Account:** Potentially setting an 'Admin' account that can perform privileged operations, such as minting or freezing assets, if required by the business logic.
*   **Sufficient Asset:** Consideration will be given to making `HappyPaisa` a 'sufficient' asset. This means that users might be able to pay transaction fees on Asset Hub using `HappyPaisa` itself, or at least use it to meet the existential deposit requirements for their accounts, simplifying user onboarding and experience.

#### Alternative Considered (and why it's not preferred)
The option of developing a dedicated parachain specifically for `HappyPaisa` was considered. However, this approach is deemed overly complex and resource-intensive for the current scope and requirements of the token. Asset Hub provides all the necessary functionality with greater efficiency and lower overhead.

#### Next Steps for Token Implementation
The actual creation and registration of the `HappyPaisa` token on a Polkadot Asset Hub will occur once the backend logic for managing its supply, distribution, and any related business rules is further developed. Initial deployment and testing will target a Polkadot testnet, such as Westend's Asset Hub, before considering a mainnet launch.

### Secure Wallet Management

#### Importance
The Happy Paisa backend will manage an administrative Polkadot account (funded by a seed/private key) that may have privileged operations, such as minting/issuing Happy Paisa tokens or managing certain aspects of the token on Asset Hub. Protecting this private key is paramount to the security and integrity of the Happy Paisa currency.

#### Recommended Solutions

1.  **Google Cloud Secret Manager (Recommended for GCP Deployments):**
    *   **Benefits:** Provides a centralized, secure way to store and manage secrets like API keys, passwords, and cryptographic keys. Secrets are encrypted at rest and in transit. Offers fine-grained access control through IAM, versioning of secrets, and audit logging.
    *   **Usage:** The backend service (e.g., running on Cloud Run, GKE, or Compute Engine) would be granted IAM permission to access the specific secret containing the Polkadot admin seed. The application fetches the seed at startup or when needed.

2.  **Hardware Security Module (HSM):**
    *   **Benefits:** Offers the highest level of security by storing cryptographic keys in a dedicated, tamper-resistant hardware device. Operations involving the key (like signing transactions) can happen within the HSM itself.
    *   **Considerations:** Typically more complex and costly to set up and manage compared to cloud-based secret managers. May be considered for very high-value applications or stringent regulatory requirements.

#### Strategy for Happy Paisa Backend

*   For the initial cloud-based deployment (assumed to be on Google Cloud as per the original issue document), **Google Cloud Secret Manager is the recommended approach** for storing the `BACKEND_ADMIN_SEED`.
*   The actual seed/private key **must not** be hardcoded in the application source code, committed to version control, or stored directly in environment variables on compute instances in staging or production environments.
*   The application will require code to integrate with the GCP Secret Manager client libraries to fetch the seed at runtime.

#### Current Placeholder (Development Only)

*   The `config/settings.py` file currently contains a placeholder `BACKEND_ADMIN_SEED` (e.g., `//Alice`).
*   **WARNING:** This is for local development convenience ONLY to allow easier testing without full cloud infrastructure. This configuration is insecure and **MUST BE REPLACED** with a secure secret management solution before deploying to any shared, staging, or production environment.

#### Future Implementation Steps
*   Define the specific name for the secret in GCP Secret Manager (e.g., `polkadot-backend-admin-seed`).
*   Create the secret in GCP Secret Manager with the actual seed for the testnet/mainnet admin account.
*   Grant appropriate IAM permissions to the backend service identity to access this secret.
*   Implement the client-side code in the backend service (likely in `polkadot/utils.py` or on app startup) to fetch the seed from GCP Secret Manager.

### Fixed Exchange Rate Handling
The backend implements an internal fixed exchange rate of **1 Happy Paisa = 1000 INR**, as specified in `config/settings.py`. This conversion is available via helper functions in `core/services.py` and is used, for example, to display an INR equivalent when querying a user's balance.

**Crucially, this feature is for internal display, informational, or accounting purposes ONLY.** It does not imply or facilitate any direct cash-out, external trading at this fixed rate, or general use as legal tender, due to the significant regulatory concerns highlighted in the project's initial brief. The system is designed as a closed-loop virtual currency until further legal and regulatory guidance is provided and implemented.
