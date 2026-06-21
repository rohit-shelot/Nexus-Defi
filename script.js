const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const BUSD_ADDRESS = "0xe9e7cea3dedca5984780bafc599bd69add087d56";
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

const ERC20_ABI = [
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address owner) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)"
];

const ROUTER_ABI = [
    "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)"
];

const TOKENS = {
    BUSD: {
        symbol: "BUSD",
        name: "Binance USD",
        address: BUSD_ADDRESS,
        decimals: 18,
        svg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#F3BA2F"/>
            <path d="M12 17V7M9 9.5h5c.8 0 1.5.5 1.5 1.25s-.7 1.25-1.5 1.25H9M9 12h5c.8 0 1.5.5 1.5 1.25S14.8 14.5 14 14.5H9" stroke="#080A10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    },
    WBNB: {
        symbol: "WBNB",
        name: "Wrapped BNB",
        address: WBNB_ADDRESS,
        decimals: 18,
        svg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#080A10" stroke="#F3BA2F" stroke-width="1.5"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 6.5l3.5 3.5-1.5 1.5L12 9.5l-2 2-1.5-1.5L12 6.5zm3.5 5.5l1.5 1.5L12 18.5l-5-5 1.5-1.5 3.5 3.5 3.5-3.5zm-3.5-1l1.5 1.5-1.5 1.5-1.5-1.5 1.5-1.5z" fill="#F3BA2F" />
        </svg>`
    }
};

let state = {
    provider: null,
    walletProvider: null,
    signer: null,
    userAddress: null,
    chainId: null,
    fromToken: TOKENS.BUSD,
    toToken: TOKENS.WBNB,
    balances: { BUSD: "0.0", WBNB: "0.0" },
    allowances: { BUSD: ethers.constants.Zero, WBNB: ethers.constants.Zero },
    exchangeRate: 0,
    wbnbPriceUsd: 0,
    isSwapping: false,
    isApproving: false,
    isFetchingPrice: false
};

const publicBscProvider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.binance.org");

const connectBtn = document.getElementById("connectBtn");
const networkBadge = document.getElementById("networkBadge");
const networkAlert = document.getElementById("networkAlert");
const switchNetworkBtn = document.getElementById("switchNetworkBtn");

const fromBlock = document.getElementById("fromBlock");
const fromAmountInput = document.getElementById("fromAmount");
const fromBalanceLabel = document.getElementById("fromBalance");
const fromSymbolLabel = document.getElementById("fromSymbol");
const fromIconContainer = document.getElementById("fromIcon");
const fromUsdValueLabel = document.getElementById("fromUsdValue");
const maxBtn = document.getElementById("maxBtn");

const switchBtn = document.getElementById("switchBtn");

const toBlock = document.getElementById("toBlock");
const toAmountInput = document.getElementById("toAmount");
const toBalanceLabel = document.getElementById("toBalance");
const toSymbolLabel = document.getElementById("toSymbol");
const toIconContainer = document.getElementById("toIcon");
const toUsdValueLabel = document.getElementById("toUsdValue");
const priceLoader = document.getElementById("priceLoader");

const priceInfoPanel = document.getElementById("priceInfoPanel");
const exchangeRateLabel = document.getElementById("exchangeRate");
const minReceivedLabel = document.getElementById("minReceived");

const actionBtn = document.getElementById("actionBtn");

window.addEventListener("DOMContentLoaded", async () => {
    initUI();
    setupEventListeners();
    await checkProviderAndNetwork();
    fetchPrice();
});

function initUI() {
    fromSymbolLabel.textContent = state.fromToken.symbol;
    fromIconContainer.innerHTML = state.fromToken.svg;
    toSymbolLabel.textContent = state.toToken.symbol;
    toIconContainer.innerHTML = state.toToken.svg;
    updateBalancesUI();
}

function setupEventListeners() {
    fromAmountInput.addEventListener("focus", () => fromBlock.classList.add("focus"));
    fromAmountInput.addEventListener("blur", () => fromBlock.classList.remove("focus"));
    
    fromAmountInput.addEventListener("input", debounce(() => {
        handleAmountChange();
    }, 400));
    
    maxBtn.addEventListener("click", () => {
        if (!state.userAddress) return;
        const currentBalance = state.balances[state.fromToken.symbol];
        fromAmountInput.value = currentBalance;
        handleAmountChange();
    });
    
    switchBtn.addEventListener("click", () => {
        const temp = state.fromToken;
        state.fromToken = state.toToken;
        state.toToken = temp;
        
        const currentInputVal = fromAmountInput.value;
        initUI();
        
        if (currentInputVal) {
            fromAmountInput.value = currentInputVal;
            handleAmountChange();
        } else {
            toAmountInput.value = "";
            priceInfoPanel.classList.add("hidden");
        }
        
        if (state.userAddress) {
            updateWalletState();
        }
    });
    
    connectBtn.addEventListener("click", connectWallet);
    actionBtn.addEventListener("click", handleActionClick);
    switchNetworkBtn.addEventListener("click", switchNetwork);
}

async function checkProviderAndNetwork() {
    if (typeof window.ethereum !== "undefined") {
        state.walletProvider = new ethers.providers.Web3Provider(window.ethereum);
        
        const network = await state.walletProvider.getNetwork();
        state.chainId = network.chainId;
        
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
        
        const accounts = await state.walletProvider.listAccounts();
        if (accounts.length > 0) {
            handleAccountsChanged(accounts);
        }
    } else {
        actionBtn.innerText = "Install MetaMask";
        actionBtn.disabled = false;
        connectBtn.innerText = "Install MetaMask";
        showToast("Web3 Required", "Please install MetaMask to purchase BUSD/WBNB.", "info");
    }
}

async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        window.open("https://metamask.io/", "_blank");
        return;
    }
    
    try {
        connectBtn.disabled = true;
        connectBtn.innerText = "Connecting...";
        
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        await handleAccountsChanged(accounts);
    } catch (error) {
        console.error("Connection failed", error);
        showToast("Connection Refused", "Failed to connect to wallet: " + error.message, "error");
        resetConnectButton();
    }
}

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        state.userAddress = null;
        state.signer = null;
        connectBtn.classList.remove("connected");
        connectBtn.innerText = "Connect Wallet";
        networkBadge.classList.add("hidden");
        networkAlert.classList.add("hidden");
        
        resetConnectButton();
        updateBalancesUI();
        updateActionButton();
    } else {
        state.userAddress = accounts[0];
        state.signer = state.walletProvider.getSigner();
        
        const shortAddr = `${state.userAddress.slice(0, 6)}...${state.userAddress.slice(-4)}`;
        connectBtn.classList.add("connected");
        connectBtn.innerText = shortAddr;
        
        await updateWalletState();
    }
}

function handleChainChanged(chainIdHex) {
    window.location.reload();
}

async function updateWalletState() {
    const network = await state.walletProvider.getNetwork();
    state.chainId = network.chainId;
    
    networkBadge.classList.remove("hidden");
    networkBadge.className = "network-badge";
    const nameSpan = networkBadge.querySelector(".network-name");
    
    if (state.chainId === 56) {
        nameSpan.innerText = "BSC Mainnet";
        networkAlert.classList.add("hidden");
    } else {
        nameSpan.innerText = "Wrong Network";
        networkBadge.classList.add("wrong-network");
        networkAlert.classList.remove("hidden");
        showToast("Wrong Network", "Please switch to Binance Smart Chain Mainnet (Chain ID 56)", "warning");
    }
    
    await updateBalancesAndAllowances();
    updateActionButton();
}

async function switchNetwork() {
    if (!window.ethereum) return;
    
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x38" }]
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: "0x38",
                        chainName: "Binance Smart Chain",
                        nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                        rpcUrls: ["https://bsc-dataseed1.binance.org"],
                        blockExplorerUrls: ["https://bscscan.com"]
                    }]
                });
            } catch (addError) {
                console.error("Could not add chain", addError);
                showToast("Network Add Failed", "Failed to add BSC: " + addError.message, "error");
            }
        } else {
            console.error("Could not switch network", switchError);
            showToast("Network Switch Failed", "Failed to switch chain: " + switchError.message, "error");
        }
    }
}

function resetConnectButton() {
    connectBtn.disabled = false;
    connectBtn.innerText = "Connect Wallet";
}

async function updateBalancesAndAllowances() {
    if (!state.userAddress) return;
    
    try {
        const busdContract = new ethers.Contract(BUSD_ADDRESS, ERC20_ABI, state.walletProvider);
        const wbnbContract = new ethers.Contract(WBNB_ADDRESS, ERC20_ABI, state.walletProvider);
        
        const [busdBal, wbnbBal, busdAllow, wbnbAllow] = await Promise.all([
            busdContract.balanceOf(state.userAddress),
            wbnbContract.balanceOf(state.userAddress),
            busdContract.allowance(state.userAddress, ROUTER_ADDRESS),
            wbnbContract.allowance(state.userAddress, ROUTER_ADDRESS)
        ]);
        
        state.balances.BUSD = parseFloat(ethers.utils.formatUnits(busdBal, 18)).toFixed(4);
        state.balances.WBNB = parseFloat(ethers.utils.formatUnits(wbnbBal, 18)).toFixed(4);
        
        state.allowances.BUSD = busdAllow;
        state.allowances.WBNB = wbnbAllow;
        
        updateBalancesUI();
    } catch (err) {
        console.error("Error reading balances/allowances", err);
    }
}

function updateBalancesUI() {
    fromBalanceLabel.textContent = `Balance: ${state.balances[state.fromToken.symbol]}`;
    toBalanceLabel.textContent = `Balance: ${state.balances[state.toToken.symbol]}`;
}

async function handleAmountChange() {
    const inputVal = fromAmountInput.value.trim();
    
    if (!inputVal || isNaN(inputVal) || parseFloat(inputVal) <= 0) {
        toAmountInput.value = "";
        fromUsdValueLabel.textContent = "~$0.00";
        toUsdValueLabel.textContent = "~$0.00";
        priceInfoPanel.classList.add("hidden");
        updateActionButton();
        return;
    }
    
    await fetchPrice();
}

async function fetchPrice() {
    const inputVal = fromAmountInput.value.trim() || "1.0";
    if (isNaN(inputVal) || parseFloat(inputVal) <= 0) return;
    
    try {
        state.isFetchingPrice = true;
        priceLoader.classList.remove("hidden");
        
        const path = [state.fromToken.address, state.toToken.address];
        const inputAmount = ethers.utils.parseUnits(inputVal, state.fromToken.decimals);
        
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, publicBscProvider);
        const amountsOut = await router.getAmountsOut(inputAmount, path);
        
        const outAmount = ethers.utils.formatUnits(amountsOut[1], state.toToken.decimals);
        
        if (fromAmountInput.value.trim()) {
            toAmountInput.value = parseFloat(outAmount).toFixed(6);
        }
        
        const conversionRate = parseFloat(outAmount) / parseFloat(inputVal);
        state.exchangeRate = conversionRate;
        
        let fromUsd = 0.0;
        let toUsd = 0.0;
        
        if (state.fromToken.symbol === "BUSD") {
            fromUsd = parseFloat(inputVal);
            state.wbnbPriceUsd = 1 / conversionRate;
            toUsd = parseFloat(outAmount) * state.wbnbPriceUsd;
        } else {
            state.wbnbPriceUsd = conversionRate;
            fromUsd = parseFloat(inputVal) * state.wbnbPriceUsd;
            toUsd = parseFloat(outAmount);
        }
        
        if (fromAmountInput.value.trim()) {
            fromUsdValueLabel.textContent = `~$${fromUsd.toFixed(2)}`;
            toUsdValueLabel.textContent = `~$${toUsd.toFixed(2)}`;
        }
        
        exchangeRateLabel.textContent = `1 ${state.fromToken.symbol} = ${conversionRate.toFixed(6)} ${state.toToken.symbol} (~$${(state.fromToken.symbol === "BUSD" ? 1.00 : state.wbnbPriceUsd).toFixed(2)})`;
        
        const minRec = parseFloat(outAmount) * 0.995;
        minReceivedLabel.textContent = `${minRec.toFixed(6)} ${state.toToken.symbol}`;
        
        if (fromAmountInput.value.trim()) {
            priceInfoPanel.classList.remove("hidden");
        }
        
    } catch (err) {
        console.error("Price fetch error", err);
        toAmountInput.value = "Price Error";
    } finally {
        state.isFetchingPrice = false;
        priceLoader.classList.add("hidden");
        updateActionButton();
    }
}

function updateActionButton() {
    actionBtn.className = "action-btn";
    actionBtn.disabled = false;
    
    if (!state.userAddress) {
        if (typeof window.ethereum === "undefined") {
            actionBtn.innerText = "Install MetaMask";
        } else {
            actionBtn.innerText = "Connect Wallet";
        }
        return;
    }
    
    if (state.chainId !== 56) {
        actionBtn.innerText = "Wrong Network - Switch to BSC";
        actionBtn.disabled = true;
        return;
    }
    
    const inputVal = fromAmountInput.value.trim();
    if (!inputVal || isNaN(inputVal) || parseFloat(inputVal) <= 0) {
        actionBtn.innerText = "Enter an amount";
        actionBtn.disabled = true;
        return;
    }
    
    const balance = parseFloat(state.balances[state.fromToken.symbol]);
    const spendAmount = parseFloat(inputVal);
    if (spendAmount > balance) {
        actionBtn.innerText = `Insufficient ${state.fromToken.symbol} balance`;
        actionBtn.disabled = true;
        return;
    }
    
    const spendAmountBig = ethers.utils.parseUnits(inputVal, state.fromToken.decimals);
    const allowance = state.allowances[state.fromToken.symbol];
    
    if (allowance.lt(spendAmountBig)) {
        actionBtn.innerText = `Approve ${state.fromToken.symbol}`;
        actionBtn.classList.add("approve-state");
        return;
    }
    
    actionBtn.innerText = "Swap Tokens";
}

async function handleActionClick() {
    if (!state.userAddress) {
        await connectWallet();
        return;
    }
    
    if (state.chainId !== 56) {
        await switchNetwork();
        return;
    }
    
    const inputVal = fromAmountInput.value.trim();
    const spendAmountBig = ethers.utils.parseUnits(inputVal, state.fromToken.decimals);
    const allowance = state.allowances[state.fromToken.symbol];
    
    if (allowance.lt(spendAmountBig)) {
        await approveToken();
    } else {
        await executeSwap();
    }
}

async function approveToken() {
    if (state.isApproving) return;
    
    try {
        state.isApproving = true;
        actionBtn.disabled = true;
        actionBtn.innerText = `Approving ${state.fromToken.symbol}...`;
        
        showToast(`Approve Pending`, `Confirm the transaction in your wallet to approve ${state.fromToken.symbol}.`, "info");
        
        const tokenContract = new ethers.Contract(state.fromToken.address, ERC20_ABI, state.signer);
        const tx = await tokenContract.approve(ROUTER_ADDRESS, ethers.constants.MaxUint256);
        
        showToast(`Tx Submitted`, `Approve transaction submitted. Waiting for confirmation.`, "info", tx.hash);
        
        await tx.wait();
        
        showToast(`Approval Success`, `${state.fromToken.symbol} approved successfully!`, "success", tx.hash);
        
        await updateBalancesAndAllowances();
    } catch (err) {
        console.error("Approval error", err);
        showToast(`Approval Failed`, err.message || "Approval rejected or failed.", "error");
    } finally {
        state.isApproving = false;
        updateActionButton();
    }
}

async function executeSwap() {
    if (state.isSwapping) return;
    
    try {
        state.isSwapping = true;
        actionBtn.disabled = true;
        actionBtn.innerText = "Swapping...";
        
        showToast(`Swap Pending`, `Confirm the swap transaction in your wallet.`, "info");
        
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, state.signer);
        const inputAmount = ethers.utils.parseUnits(fromAmountInput.value.trim(), state.fromToken.decimals);
        const path = [state.fromToken.address, state.toToken.address];
        const amountsOut = await router.getAmountsOut(inputAmount, path);
        const amountOutMin = amountsOut[1].mul(995).div(1000);
        const deadline = Math.floor(Date.now() / 1000) + 1200;
        
        const tx = await router.swapExactTokensForTokens(
            inputAmount,
            amountOutMin,
            path,
            state.userAddress,
            deadline
        );
        
        showToast(`Swap Submitted`, `Transaction submitted to BSC. Waiting for confirmation.`, "info", tx.hash);
        
        await tx.wait();
        
        showToast(`Swap Success!`, `Successfully swapped ${fromAmountInput.value} ${state.fromToken.symbol} for ${toAmountInput.value} ${state.toToken.symbol}.`, "success", tx.hash);
        
        fromAmountInput.value = "";
        toAmountInput.value = "";
        fromUsdValueLabel.textContent = "~$0.00";
        toUsdValueLabel.textContent = "~$0.00";
        priceInfoPanel.classList.add("hidden");
        
        await updateBalancesAndAllowances();
    } catch (err) {
        console.error("Swap execution error", err);
        showToast(`Swap Failed`, err.message || "Swap transaction rejected or reverted.", "error");
    } finally {
        state.isSwapping = false;
        updateActionButton();
    }
}

function showToast(title, body, type = "info", txHash = null) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let linkHtml = "";
    if (txHash) {
        linkHtml = `<a href="https://bscscan.com/tx/${txHash}" target="_blank" rel="noopener noreferrer" class="toast-tx-link">View on BscScan</a>`;
    }
    
    toast.innerHTML = `
        <div class="toast-header">
            <span>${title}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#8E96A8;cursor:pointer;font-size:1.2rem;line-height:1;margin-left:8px;">&times;</button>
        </div>
        <div class="toast-body">
            ${body}
            ${linkHtml}
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 6500);
}

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}
