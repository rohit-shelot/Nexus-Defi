# Nexus DeFi: BUSD & WBNB Price Utility and Swap Client

Nexus DeFi is a lightweight, high-performance Web3 application designed to fetch real-time conversion rates and execute token swaps between BUSD and WBNB on the Binance Smart Chain (BSC). The project includes a Node.js console price fetcher and a modern, responsive Web3 frontend client utilizing PancakeSwap V2 Router contracts.

---

## Core Features

### 1. Web3 Swap Frontend
* **Direct MetaMask Integration**: Request account access, track account updates, and monitor network state.
* **BSC Auto-Switching**: Automatically prompts users to connect to Binance Smart Chain Mainnet (Chain ID 56) and adds the RPC parameters if the network is missing from the wallet.
* **On-Chain Price Queries**: Fetches live exchange rates using the PancakeSwap Router contract on every user keystroke.
* **Token Allowance & Approvals**: Detects allowance states dynamically. Shows "Approve Token" when authorization is required and "Swap Tokens" when gas limits are ready.
* **Kept State Swapping**: Retains the typed input amount when changing swap direction (clicking the up/down arrow button) and automatically recalculates the output amount for the new direction.
* **Premium Dark Theme UI**: Full glassmorphism layout, animated background glow blobs, responsive interface layouts, and real-time toast notifications linking directly to BscScan.

### 2. Node.js CLI Price Utility
* **JSON-RPC Communication**: Queries the Binance Smart Chain public nodes directly.
* **Router Price Derivation**: Resolves conversion decimals and returns PancakeSwap rate output for a given amount of tokens.

---

## Directory Structure

* **`AddressList.js`**: Stores smart contract addresses for PancakeSwap V2 Router, PancakeSwap V2 Factory, BUSD, and WBNB BEP-20 contracts.
* **`AbiInfo.js`**: Contains ERC-20, Factory, Pair, and Router contract ABIs.
* **`PriceFetch.js`**: A Node.js CLI script that imports ABIs and addresses to fetch WBNB outputs for a fixed quantity of BUSD.
* **`index.html`**: The UI layout skeleton linking stylesheets, scripts, Google Fonts, and the stable `ethers.js` CDN.
* **`style.css`**: The stylesheet detailing custom tokens, glassmorphism, animated backgrounds, responsive layout sizes, and alerts.
* **`script.js`**: The main frontend JavaScript orchestrating network validations, allowances, approvals, and swaps.
* **`package.json`**: Holds npm package details and specifies the `ethers` library dependency.

---

## Getting Started

### Prerequisites
* **Node.js** (v14 or higher recommended)
* **MetaMask** browser extension with a wallet set up.

### Installation
Clone this project directory and run the following command to download the required Node modules:
```bash
npm install
```

### Running the Node.js CLI Price Utility
Execute the script to query the current BSC mainnet conversion rate for BUSD &rarr; WBNB and print it to your console:
```bash
node PriceFetch.js
```

### Running the Frontend Swap Client
To test the interactive frontend, launch a local web server from the project directory. You can open `index.html` directly in your browser, or spin up a local server:

Using python:
```bash
python -m http.server 8000
```

Using Node.js (`http-server` npm package):
```bash
npx http-server
```

Once running, navigate to `http://localhost:8000` (or the URL outputted by `http-server`) in your Web3-enabled browser.

---

## How to Trade

1. **Connect MetaMask**: Click **"Connect Wallet"** in the top right header or inside the main action panel.
2. **Select Direction**: Click the central up/down arrow button to switch direction between swapping BUSD &rarr; WBNB or WBNB &rarr; BUSD.
3. **Set Amount**: Type the amount of the token you want to sell in the "You Pay" input box. The "You Receive" box will fetch the estimated outputs.
4. **Approve Spend**: If this is your first time trading that token, the main button will read **"Approve [Token]"**. Click it, verify the approval transaction fee in MetaMask, and wait for confirmation.
5. **Execute Swap**: Once approved, click **"Swap Tokens"** and confirm the swap transaction. The transaction toast will slide in on the bottom right and display a clickable link to inspect the hash on **BscScan**.
