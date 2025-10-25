// Trading System
class TradingSystem {
    constructor() {
        this.currentUser = null;
        this.selectedAsset = null;
        this.tradeType = 'BUY';
        this.chartInterval = null;
        this.activeTimers = [];
        this.init();
    }

    init() {
        this.currentUser = storage.getCurrentUser();
        if (!this.currentUser || this.currentUser.isAdmin) {
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
        this.loadUserData();
        this.initAssetSelector();
        this.startActiveTradeTimers();
    }

    setupEventListeners() {
        // Trade type buttons
        document.querySelectorAll('.trade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTradeType(e.target.dataset.type);
            });
        });

        // Asset selector
        const assetSelect = document.getElementById('asset-select');
        if (assetSelect) {
            assetSelect.addEventListener('change', (e) => {
                this.selectAsset(e.target.value);
            });
        }

        // Trade amount input
        const tradeAmount = document.getElementById('trade-amount');
        if (tradeAmount) {
            tradeAmount.addEventListener('input', () => {
                this.updatePotentialResult();
            });
        }

        // Trade duration input
        const tradeDuration = document.getElementById('trade-duration');
        if (tradeDuration) {
            tradeDuration.addEventListener('input', () => {
                this.updatePotentialResult();
            });
        }

        // Place trade button
        const placeTradeBtn = document.getElementById('place-trade');
        if (placeTradeBtn) {
            placeTradeBtn.addEventListener('click', () => {
                this.placeTrade();
            });
        }

        // Deposit/Withdraw buttons in header
        const depositBtn = document.getElementById('deposit-btn');
        const withdrawBtn = document.getElementById('withdraw-btn');
        
        if (depositBtn) depositBtn.addEventListener('click', () => this.showModal('deposit'));
        if (withdrawBtn) withdrawBtn.addEventListener('click', () => this.showModal('withdraw'));

        // Deposit/Withdraw buttons in account section
        const showDepositBtn = document.getElementById('show-deposit');
        const showWithdrawBtn = document.getElementById('show-withdraw');
        
        if (showDepositBtn) showDepositBtn.addEventListener('click', () => this.showModal('deposit'));
        if (showWithdrawBtn) showWithdrawBtn.addEventListener('click', () => this.showModal('withdraw'));

        // Modal cancel buttons
        const cancelDeposit = document.getElementById('cancel-deposit');
        const cancelWithdraw = document.getElementById('cancel-withdraw');

        if (cancelDeposit) cancelDeposit.addEventListener('click', () => this.hideModal('deposit'));
        if (cancelWithdraw) cancelWithdraw.addEventListener('click', () => this.hideModal('withdraw'));

        // Transaction forms
        const depositForm = document.getElementById('deposit-form');
        const withdrawForm = document.getElementById('withdraw-form');

        if (depositForm) depositForm.addEventListener('submit', (e) => this.handleDeposit(e));
        if (withdrawForm) withdrawForm.addEventListener('submit', (e) => this.handleWithdraw(e));
    }

    loadUserData() {
        // Refresh user data from storage
        const updatedUser = storage.getUserById(this.currentUser.id);
        if (updatedUser) {
            this.currentUser = updatedUser;
            storage.setCurrentUser(updatedUser);
        }

        // Update user info
        const userWelcome = document.getElementById('user-welcome');
        const currentBalance = document.getElementById('current-balance');
        const headerBalance = document.getElementById('header-balance');

        if (userWelcome) userWelcome.textContent = `Selamat datang, ${this.currentUser.username}!`;
        if (currentBalance) currentBalance.textContent = this.formatCurrency(this.currentUser.balance);
        if (headerBalance) headerBalance.textContent = this.formatCurrency(this.currentUser.balance);

        this.updateActiveTrades();
        this.updateTradingHistory();
        this.calculateStats();
    }

    initAssetSelector() {
        const assets = storage.getAssets();
        const assetSelect = document.getElementById('asset-select');
        
        if (assetSelect && assets.length > 0) {
            assetSelect.innerHTML = assets.map(asset => 
                `<option value="${asset.symbol}">${asset.symbol} - ${asset.name}</option>`
            ).join('');
            
            this.selectAsset(assets[0].symbol);
        }
    }

    selectAsset(symbol) {
        this.selectedAsset = storage.getAsset(symbol);
        this.updatePotentialResult();
    }

    setTradeType(type) {
        this.tradeType = type;
        
        // Update UI
        document.querySelectorAll('.trade-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
        
        this.updatePotentialResult();
    }

    updatePotentialResult() {
        const amount = parseInt(document.getElementById('trade-amount').value) || 0;
        const potentialResult = document.getElementById('potential-result');
        
        if (potentialResult && amount > 0) {
            const profit = amount * 2;
            potentialResult.textContent = this.formatCurrency(profit);
            potentialResult.className = this.tradeType === 'BUY' ? 'profit' : 'loss';
        }
    }

    placeTrade() {
        const amountInput = document.getElementById('trade-amount');
        const durationInput = document.getElementById('trade-duration');
        
        const amount = parseInt(amountInput.value);
        const duration = parseInt(durationInput.value);
        const settings = storage.getSettings();

        // Validasi
        if (!this.selectedAsset) {
            this.showMessage('Pilih aset terlebih dahulu', 'error');
            return;
        }

        if (!amount || amount < settings.minTradeAmount) {
            this.showMessage(`Minimum trading: ${this.formatCurrency(settings.minTradeAmount)}`, 'error');
            amountInput.focus();
            return;
        }

        if (!duration || duration > settings.maxTradeDuration) {
            this.showMessage(`Maksimum durasi: ${settings.maxTradeDuration} detik`, 'error');
            durationInput.focus();
            return;
        }

        if (amount > this.currentUser.balance) {
            this.showMessage('Saldo tidak mencukupi', 'error');
            return;
        }

        // Create trade
        const trade = {
            asset: this.selectedAsset.symbol,
            type: this.tradeType,
            amount: amount,
            duration: duration,
            entryPrice: this.selectedAsset.price,
            currentPrice: this.selectedAsset.price
        };

        const newTrade = storage.addUserTrade(this.currentUser.id, trade);
        
        if (newTrade) {
            this.showMessage('Trade berhasil ditempatkan!', 'success');
            this.loadUserData();
            
            // Schedule trade completion
            const timer = setTimeout(() => {
                this.completeTrade(newTrade.id);
            }, duration * 1000);
            
            this.activeTimers.push(timer);
        } else {
            this.showMessage('Gagal menempatkan trade', 'error');
        }
    }

    completeTrade(tradeId) {
        const user = storage.getUserById(this.currentUser.id);
        const trade = user.trades.find(t => t.id === tradeId);
        
        if (trade && trade.status === 'active') {
            const currentAsset = storage.getAsset(trade.asset);
            const currentPrice = currentAsset ? currentAsset.price : trade.entryPrice;
            const entryPrice = trade.entryPrice;
            
            let result = 'loss';
            
            if (trade.type === 'BUY') {
                result = currentPrice > entryPrice ? 'win' : 'loss';
            } else if (trade.type === 'SELL') {
                result = currentPrice < entryPrice ? 'win' : 'loss';
            }
            
            storage.completeTrade(this.currentUser.id, tradeId, result);
            this.loadUserData();
            
            const message = result === 'win' ? 
                `Trade ${trade.asset} ${trade.type} MENANG! +${this.formatCurrency(trade.amount * 2)}` :
                `Trade ${trade.asset} ${trade.type} KALAH! -${this.formatCurrency(trade.amount)}`;
            
            this.showMessage(message, result === 'win' ? 'success' : 'error');
        }
    }

    startActiveTradeTimers() {
        const activeTrades = this.currentUser.trades.filter(trade => trade.status === 'active');
        
        activeTrades.forEach(trade => {
            const timePassed = Date.now() - new Date(trade.createdAt).getTime();
            const timeRemaining = (trade.duration * 1000) - timePassed;
            
            if (timeRemaining > 0) {
                const timer = setTimeout(() => {
                    this.completeTrade(trade.id);
                }, timeRemaining);
                
                this.activeTimers.push(timer);
            } else {
                // Trade should have been completed but wasn't
                this.completeTrade(trade.id);
            }
        });
    }

    // Transaction methods
    showModal(type) {
        const modal = document.getElementById(`${type}-modal`);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideModal(type) {
        const modal = document.getElementById(`${type}-modal`);
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    handleDeposit(e) {
        e.preventDefault();
        const amount = parseInt(document.getElementById('deposit-amount').value);
        
        if (!amount || amount < 10000) {
            this.showMessage('Minimum deposit: Rp 10,000', 'error');
            return;
        }

        const transaction = {
            userId: this.currentUser.id,
            type: 'deposit',
            amount: amount,
            username: this.currentUser.username
        };

        storage.addTransaction(transaction);
        this.hideModal('deposit');
        this.showMessage('Permintaan deposit diajukan, menunggu approval admin', 'success');
    }

    handleWithdraw(e) {
        e.preventDefault();
        const amount = parseInt(document.getElementById('withdraw-amount').value);
        
        if (!amount || amount < 10000) {
            this.showMessage('Minimum withdraw: Rp 10,000', 'error');
            return;
        }

        if (amount > this.currentUser.balance) {
            this.showMessage('Saldo tidak mencukupi', 'error');
            return;
        }

        const transaction = {
            userId: this.currentUser.id,
            type: 'withdraw',
            amount: amount,
            username: this.currentUser.username
        };

        storage.addTransaction(transaction);
        this.hideModal('withdraw');
        this.showMessage('Permintaan withdraw diajukan, menunggu approval admin', 'success');
    }

    updateActiveTrades() {
        const activeTradesList = document.getElementById('active-trades-list');
        if (!activeTradesList) return;

        const activeTrades = this.currentUser.trades.filter(trade => trade.status === 'active');
        
        if (activeTrades.length === 0) {
            activeTradesList.innerHTML = '<div class="empty-state">Tidak ada trading aktif</div>';
            return;
        }

        activeTradesList.innerHTML = activeTrades.map(trade => {
            const timePassed = Date.now() - new Date(trade.createdAt).getTime();
            const timeRemaining = Math.max(0, trade.duration - Math.floor(timePassed / 1000));
            
            return `
                <div class="trade-item ${trade.type.toLowerCase()}">
                    <div class="trade-info">
                        <strong>${trade.asset} ${trade.type}</strong>
                        <div>Amount: ${this.formatCurrency(trade.amount)}</div>
                        <div>Entry: ${this.formatCurrency(trade.entryPrice)}</div>
                        <div>Time Left: ${timeRemaining}s</div>
                    </div>
                    <div class="trade-status active">Active</div>
                </div>
            `;
        }).join('');
    }

    updateTradingHistory() {
        const historyList = document.getElementById('trading-history');
        if (!historyList) return;

        const completedTrades = this.currentUser.trades.filter(trade => trade.status === 'completed');
        
        if (completedTrades.length === 0) {
            historyList.innerHTML = '<div class="empty-state">Belum ada riwayat trading</div>';
            return;
        }

        historyList.innerHTML = completedTrades.map(trade => `
            <div class="trade-item ${trade.type.toLowerCase()}">
                <div class="trade-info">
                    <strong>${trade.asset} ${trade.type}</strong>
                    <div>Amount: ${this.formatCurrency(trade.amount)}</div>
                    <div>Result: <span class="${trade.result}">${trade.result.toUpperCase()}</span></div>
                    <div>P/L: ${trade.result === 'win' ? '+' : '-'}${this.formatCurrency(trade.amount)}</div>
                    <small>${new Date(trade.completedAt).toLocaleString()}</small>
                </div>
                <div class="trade-status ${trade.result}">${trade.result === 'win' ? 'WIN' : 'LOSS'}</div>
            </div>
        `).join('');
    }

    // GANTI method calculateStats() dengan ini:
calculateStats() {
    const stats = this.calculateUserStats();
    
    const totalProfitElem = document.getElementById('total-profit');
    const totalLossElem = document.getElementById('total-loss');
    const winRateElem = document.getElementById('win-rate');
    const performanceElem = document.getElementById('performance');

    if (totalProfitElem) totalProfitElem.textContent = this.formatCurrency(stats.totalProfit);
    if (totalLossElem) totalLossElem.textContent = this.formatCurrency(stats.totalProfit < 0 ? Math.abs(stats.totalProfit) : 0);
    if (winRateElem) winRateElem.textContent = stats.winRate.toFixed(1) + '%';
    if (performanceElem) performanceElem.textContent = stats.performance;
}

// TAMBAHKAN SETELAH calculateStats() method:

calculateUserStats() {
    const completedTrades = this.currentUser.trades.filter(trade => trade.status === 'completed');
    const totalTrades = completedTrades.length;
    
    if (totalTrades === 0) {
        return {
            winRate: 0,
            totalProfit: 0,
            avgTrade: 0,
            bestTrade: 0,
            performance: 'Beginner'
        };
    }
    
    const winningTrades = completedTrades.filter(trade => trade.result === 'win');
    const winRate = (winningTrades.length / totalTrades) * 100;
    
    const totalProfit = completedTrades
        .filter(trade => trade.result === 'win')
        .reduce((sum, trade) => sum + trade.amount, 0);
    
    const totalLoss = completedTrades
        .filter(trade => trade.result === 'loss')
        .reduce((sum, trade) => sum + trade.amount, 0);
    
    const netProfit = totalProfit - totalLoss;
    const avgTrade = netProfit / totalTrades;
    
    const bestTrade = winningTrades.length > 0 ? 
        Math.max(...winningTrades.map(t => t.amount)) : 0;
    
    // Performance rating
    let performance = 'Beginner';
    if (winRate >= 70) performance = 'Expert';
    else if (winRate >= 60) performance = 'Advanced';
    else if (winRate >= 50) performance = 'Intermediate';
    else if (winRate >= 40) performance = 'Novice';
    
    return {
        winRate,
        totalProfit: netProfit,
        avgTrade,
        bestTrade,
        performance,
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: completedTrades.length - winningTrades.length
    };
}

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
        `;

        document.body.appendChild(messageDiv);
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    // Cleanup timers when leaving page
    destroy() {
        this.activeTimers.forEach(timer => clearTimeout(timer));
        this.activeTimers = [];
    }
}

// Initialize trading system
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('user-dashboard.html')) {
        window.tradingSystem = new TradingSystem();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.tradingSystem) {
        window.tradingSystem.destroy();
    }
});
