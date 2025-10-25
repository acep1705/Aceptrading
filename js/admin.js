// Admin Management System
class AdminSystem {
    constructor() {
        this.currentSection = 'overview';
        this.init();
    }

    init() {
        // Check admin authentication
        const currentUser = storage.getCurrentUser();
        if (!currentUser || !currentUser.isAdmin) {
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
        this.showSection('overview');
    }

    setupEventListeners() {
        // Navigation
               
    // TAMBAHKAN DI DALAM setupEventListeners() - setelah event listeners yang sudah ada:
    document.querySelectorAll('.volatility-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const volatility = parseFloat(e.target.dataset.volatility);
            this.setMarketVolatility(volatility);
        });
    });
}
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showSection(e.target.dataset.section);
            });
        });

        // Approval tabs
        document.querySelectorAll('.approval-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.showApprovalTab(e.target.dataset.type);
            });
        });

        // User management
        const refreshUsersBtn = document.getElementById('refresh-users');
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', () => {
                this.loadUsers();
            });
        }

        // Asset management
        const addAssetBtn = document.getElementById('add-asset-btn');
        if (addAssetBtn) {
            addAssetBtn.addEventListener('click', () => {
                this.showAddAssetModal();
            });
        }

        const cancelAddAssetBtn = document.getElementById('cancel-add-asset');
        if (cancelAddAssetBtn) {
            cancelAddAssetBtn.addEventListener('click', () => {
                this.hideAddAssetModal();
            });
        }

        const addAssetForm = document.getElementById('add-asset-form');
        if (addAssetForm) {
            addAssetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddAsset();
            });
        }

        // Market controls
        document.querySelectorAll('.trend-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMarketTrend(e.target.dataset.trend);
            });
        });

        const manualPriceForm = document.getElementById('manual-price-form');
        if (manualPriceForm) {
            manualPriceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.setManualPrice();
            });
        }

        // Settings
        const settingsForm = document.getElementById('system-settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    }

    showSection(section) {
        this.currentSection = section;

        // Update navigation
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-section="${section}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show selected section
        const activeSection = document.getElementById(`${section}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        // Load section data
        switch(section) {
            case 'overview':
                this.loadOverview();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'assets':
                this.loadAssets();
                break;
            case 'market':
                this.loadMarketControls();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    showApprovalTab(type) {
        // Update tabs
        document.querySelectorAll('.approval-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-type="${type}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Show/hide lists
        const depositRequests = document.getElementById('deposit-requests');
        const withdrawRequests = document.getElementById('withdraw-requests');
        
        if (depositRequests) {
            depositRequests.style.display = type === 'deposit' ? 'block' : 'none';
        }
        if (withdrawRequests) {
            withdrawRequests.style.display = type === 'withdraw' ? 'block' : 'none';
        }
    }

    // Overview Section
    loadOverview() {
        const stats = storage.getSystemStats();

        // Update stats
        this.updateElementText('total-users', stats.totalUsers);
        this.updateElementText('total-deposit', this.formatCurrency(stats.totalDeposit));
        this.updateElementText('total-withdraw', this.formatCurrency(stats.totalWithdraw));
        this.updateElementText('system-balance', this.formatCurrency(stats.systemBalance));

        // Load recent activities
        this.loadRecentActivities();
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    loadRecentActivities() {
        const activitiesList = document.getElementById('recent-activities-list');
        if (!activitiesList) return;

        const users = storage.getUsers();
        const transactions = storage.getTransactions();
        
        // Get recent trades and transactions
        const allActivities = [];

        // Add recent trades
        users.forEach(user => {
            const recentTrades = user.trades.slice(0, 10);
            recentTrades.forEach(trade => {
                allActivities.push({
                    type: 'trade',
                    user: user.username,
                    asset: trade.asset,
                    action: trade.type,
                    amount: trade.amount,
                    result: trade.result,
                    status: trade.status,
                    timestamp: trade.completedAt || trade.createdAt
                });
            });
        });

        // Add recent transactions
        const recentTransactions = transactions.slice(0, 10);
        recentTransactions.forEach(transaction => {
            allActivities.push({
                type: 'transaction',
                user: transaction.username,
                action: transaction.type,
                amount: transaction.amount,
                status: transaction.status,
                timestamp: transaction.createdAt
            });
        });

        // Sort by timestamp and take latest 10
        const recentActivities = allActivities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        if (recentActivities.length === 0) {
            activitiesList.innerHTML = '<div class="empty-state">Tidak ada aktivitas terbaru</div>';
            return;
        }

        activitiesList.innerHTML = recentActivities.map(activity => {
            let activityText = '';
            
            if (activity.type === 'trade') {
                activityText = `Trade ${activity.asset} ${activity.action} ${this.formatCurrency(activity.amount)}`;
                if (activity.result) {
                    activityText += ` - ${activity.result.toUpperCase()}`;
                }
            } else {
                activityText = `${activity.action.toUpperCase()} ${this.formatCurrency(activity.amount)} - ${activity.status}`;
            }
            
            return `
                <div class="activity-item">
                    <div class="activity-info">
                        <strong>${activity.user}</strong> - ${activityText}
                    </div>
                    <div class="activity-time">
                        ${new Date(activity.timestamp).toLocaleString()}
                    </div>
                </div>
            `;
        }).join('');
    }

    // User Management Section
    loadUsers() {
        const usersTable = document.getElementById('users-table');
        if (!usersTable) return;

        const users = storage.getUsers();
        const tbody = usersTable.querySelector('tbody');

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada user</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const totalTrades = user.trades.length;
            const profitTrades = user.trades.filter(t => t.result === 'win').length;
            const lossTrades = user.trades.filter(t => t.result === 'loss').length;
            const winRate = totalTrades > 0 ? ((profitTrades / totalTrades) * 100).toFixed(1) : 0;

            return `
                <tr>
                    <td>${user.username}</td>
                    <td>${this.formatCurrency(user.balance)}</td>
                    <td>${totalTrades}</td>
                    <td>${winRate}% (${profitTrades}/${lossTrades})</td>
                    <td><span class="status-active">Active</span></td>
                    <td>
                        <button class="btn-small btn-secondary" onclick="adminSystem.deleteUser(${user.id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    deleteUser(userId) {
        if (confirm('Apakah Anda yakin ingin menghapus user ini? Semua data trading user akan hilang.')) {
            if (storage.deleteUser(userId)) {
                this.showMessage('User berhasil dihapus', 'success');
                this.loadUsers();
                this.loadOverview();
            } else {
                this.showMessage('Gagal menghapus user', 'error');
            }
        }
    }

    // Asset Management Section
    loadAssets() {
        const assetsTable = document.getElementById('assets-table');
        if (!assetsTable) return;

        const assets = storage.getAssets();
        const tbody = assetsTable.querySelector('tbody');

        if (assets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada aset</td></tr>';
            return;
        }

        tbody.innerHTML = assets.map(asset => `
            <tr>
                <td>${asset.symbol}</td>
                <td>${asset.name}</td>
                <td>${this.formatCurrency(asset.price)}</td>
                <td>${asset.volatility}%</td>
                <td>${asset.type === 'stock' ? 'Saham' : 'Kripto'}</td>
                <td>
                    <button class="btn-small btn-secondary" onclick="adminSystem.deleteAsset(${asset.id})">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join('');

        // Update manual price form
        this.updateManualPriceForm();
    }

    showAddAssetModal() {
        const modal = document.getElementById('add-asset-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideAddAssetModal() {
        const modal = document.getElementById('add-asset-modal');
        if (modal) {
            modal.style.display = 'none';
            const form = document.getElementById('add-asset-form');
            if (form) form.reset();
        }
    }

    handleAddAsset() {
        const symbol = document.getElementById('asset-symbol').value.trim().toUpperCase();
        const name = document.getElementById('asset-name').value.trim();
        const price = parseInt(document.getElementById('asset-price').value);
        const volatility = parseFloat(document.getElementById('asset-volatility').value);
        const type = document.getElementById('asset-type').value;

        if (!symbol || !name || !price || !volatility) {
            this.showMessage('Semua field harus diisi', 'error');
            return;
        }

        if (price < 1) {
            this.showMessage('Harga harus lebih dari 0', 'error');
            return;
        }

        if (volatility < 0.1 || volatility > 50) {
            this.showMessage('Volatilitas harus antara 0.1% dan 50%', 'error');
            return;
        }

        // Check if symbol already exists
        const existingAsset = storage.getAsset(symbol);
        if (existingAsset) {
            this.showMessage('Symbol aset sudah ada', 'error');
            return;
        }

        const newAsset = storage.addAsset({
            symbol,
            name,
            price,
            volatility,
            type
        });

        if (newAsset) {
            this.showMessage('Aset berhasil ditambahkan', 'success');
            this.hideAddAssetModal();
            this.loadAssets();
        } else {
            this.showMessage('Gagal menambahkan aset', 'error');
        }
    }

    deleteAsset(assetId) {
        if (confirm('Apakah Anda yakin ingin menghapus aset ini?')) {
            if (storage.deleteAsset(assetId)) {
                this.showMessage('Aset berhasil dihapus', 'success');
                this.loadAssets();
            } else {
                this.showMessage('Gagal menghapus aset', 'error');
            }
        }
    }

    // GANTI method loadMarketControls() dengan ini:
loadMarketControls() {
    const marketState = storage.getMarketState();
    
    // Update current trend display
    const currentTrendElement = document.getElementById('current-trend');
    if (currentTrendElement) {
        let trendText = '';
        let trendClass = '';
        
        switch(marketState.trend) {
            case 'random':
                trendText = `Random (Netral) - Strength: ${(marketState.strength * 100).toFixed(1)}%`;
                trendClass = 'market-neutral';
                break;
            case 'up':
                trendText = `BULL MARKET - Strength: ${(marketState.strength * 100).toFixed(1)}%`;
                trendClass = 'market-bull';
                break;
            case 'down':
                trendText = `BEAR MARKET - Strength: ${(marketState.strength * 100).toFixed(1)}%`;
                trendClass = 'market-bear';
                break;
        }
        
        currentTrendElement.textContent = trendText;
        currentTrendElement.className = trendClass;
    }

    // Update market stats
    this.updateMarketStats();
    this.updateManualPriceForm();
}

// TAMBAHKAN SETELAH loadMarketControls() method:

updateMarketStats() {
    const assets = storage.getAssets();
    let totalChange = 0;
    let upCount = 0;
    let downCount = 0;
    
    assets.forEach(asset => {
        if (asset.history && asset.history.length > 1) {
            const change = ((asset.price - asset.history[1].price) / asset.history[1].price) * 100;
            totalChange += change;
            if (change > 0) upCount++;
            if (change < 0) downCount++;
        }
    });
    
    const avgChange = assets.length > 0 ? totalChange / assets.length : 0;
    
    // Update stats display
    const statsElement = document.getElementById('market-stats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="market-stat">
                <span class="stat-label">Avg Change:</span>
                <span class="stat-value ${avgChange >= 0 ? 'profit' : 'loss'}">${avgChange.toFixed(2)}%</span>
            </div>
            <div class="market-stat">
                <span class="stat-label">Advance/Decline:</span>
                <span class="stat-value">${upCount}/${downCount}</span>
            </div>
            <div class="market-stat">
                <span class="stat-label">Volatility:</span>
                <span class="stat-value">${(storage.getMarketState().volatility * 100).toFixed(1)}%</span>
            </div>
        `;
    }
}

   // GANTI method setMarketTrend() dengan ini:
setMarketTrend(trend) {
    const marketState = storage.getMarketState();
    marketState.trend = trend;
    
    // Set strength berdasarkan trend
    switch(trend) {
        case 'up':
            marketState.strength = 0.6 + (Math.random() * 0.3); // 60-90% strength
            break;
        case 'down':
            marketState.strength = -0.6 - (Math.random() * 0.3); // -60 to -90% strength
            break;
        default:
            marketState.strength = (Math.random() - 0.5) * 0.2; // -10 to +10% strength
    }
    
    marketState.lastUpdate = Date.now();
    
    if (storage.saveMarketState(marketState)) {
        let trendText = '';
        switch(trend) {
            case 'random':
                trendText = 'Random (Netral)';
                break;
            case 'up':
                trendText = 'BULL MARKET (Trend Naik Kuat)';
                break;
            case 'down':
                trendText = 'BEAR MARKET (Trend Turun Kuat)';
                break;
        }
        this.showMessage(`Market trend diubah ke: ${trendText}`, 'success');
        this.loadMarketControls();
    }
}

// TAMBAHKAN SETELAH setMarketTrend() method:

setMarketVolatility(volatility) {
    const marketState = storage.getMarketState();
    marketState.volatility = volatility;
    
    if (storage.saveMarketState(marketState)) {
        this.showMessage(`Market volatility diubah ke: ${(volatility * 100).toFixed(1)}%`, 'success');
        this.loadMarketControls();
    }
}

    updateManualPriceForm() {
        const manualAssetSelect = document.getElementById('manual-asset');
        if (!manualAssetSelect) return;

        const assets = storage.getAssets();
        manualAssetSelect.innerHTML = assets.map(asset => 
            `<option value="${asset.symbol}">${asset.symbol} - ${asset.name}</option>`
        ).join('');
    }

    setManualPrice() {
        const symbol = document.getElementById('manual-asset').value;
        const newPrice = parseInt(document.getElementById('manual-price').value);

        if (!symbol || !newPrice || newPrice < 1) {
            this.showMessage('Pilih aset dan masukkan harga yang valid', 'error');
            return;
        }

        if (storage.updateAssetPrice(symbol, newPrice)) {
            this.showMessage(`Harga ${symbol} diubah menjadi ${this.formatCurrency(newPrice)}`, 'success');
            document.getElementById('manual-price-form').reset();
        } else {
            this.showMessage('Gagal mengubah harga', 'error');
        }
    }

    // Transaction Approval Section
    loadTransactions() {
        this.loadDepositRequests();
        this.loadWithdrawRequests();
    }

    loadDepositRequests() {
        const depositList = document.getElementById('deposit-list');
        if (!depositList) return;

        const transactions = storage.getTransactions();
        const pendingDeposits = transactions.filter(t => 
            t.type === 'deposit' && t.status === 'pending'
        );

        if (pendingDeposits.length === 0) {
            depositList.innerHTML = '<div class="empty-state">Tidak ada permintaan deposit</div>';
            return;
        }

        depositList.innerHTML = pendingDeposits.map(transaction => `
            <div class="request-item">
                <div class="request-info">
                    <strong>${transaction.username}</strong>
                    <div>Amount: ${this.formatCurrency(transaction.amount)}</div>
                    <small>${new Date(transaction.createdAt).toLocaleString()}</small>
                </div>
                <div class="request-actions">
                    <button class="btn-small btn-primary" onclick="adminSystem.approveTransaction(${transaction.id})">
                        Approve
                    </button>
                    <button class="btn-small btn-secondary" onclick="adminSystem.rejectTransaction(${transaction.id})">
                        Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadWithdrawRequests() {
        const withdrawList = document.getElementById('withdraw-list');
        if (!withdrawList) return;

        const transactions = storage.getTransactions();
        const pendingWithdraws = transactions.filter(t => 
            t.type === 'withdraw' && t.status === 'pending'
        );

        if (pendingWithdraws.length === 0) {
            withdrawList.innerHTML = '<div class="empty-state">Tidak ada permintaan withdraw</div>';
            return;
        }

        withdrawList.innerHTML = pendingWithdraws.map(transaction => `
            <div class="request-item">
                <div class="request-info">
                    <strong>${transaction.username}</strong>
                    <div>Amount: ${this.formatCurrency(transaction.amount)}</div>
                    <small>${new Date(transaction.createdAt).toLocaleString()}</small>
                </div>
                <div class="request-actions">
                    <button class="btn-small btn-primary" onclick="adminSystem.approveTransaction(${transaction.id})">
                        Approve
                    </button>
                    <button class="btn-small btn-secondary" onclick="adminSystem.rejectTransaction(${transaction.id})">
                        Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    approveTransaction(transactionId) {
        if (storage.approveTransaction(transactionId)) {
            this.showMessage('Transaksi disetujui', 'success');
            this.loadTransactions();
            this.loadOverview();
        } else {
            this.showMessage('Gagal menyetujui transaksi', 'error');
        }
    }

    rejectTransaction(transactionId) {
        if (storage.rejectTransaction(transactionId)) {
            this.showMessage('Transaksi ditolak', 'success');
            this.loadTransactions();
        } else {
            this.showMessage('Gagal menolak transaksi', 'error');
        }
    }

    // Settings Section
    loadSettings() {
        const settings = storage.getSettings();

        this.setInputValue('min-trade-amount', settings.minTradeAmount);
        this.setInputValue('max-trade-duration', settings.maxTradeDuration);
        this.setSelectValue('auto-approval', settings.autoApproval.toString());
    }

    setInputValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }

    setSelectValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }

    saveSettings() {
        const settings = {
            minTradeAmount: parseInt(document.getElementById('min-trade-amount').value) || 10000,
            maxTradeDuration: parseInt(document.getElementById('max-trade-duration').value) || 300,
            autoApproval: document.getElementById('auto-approval').value === 'true'
        };

        if (settings.minTradeAmount < 1000) {
            this.showMessage('Minimum trade amount harus minimal Rp 1,000', 'error');
            return;
        }

        if (settings.maxTradeDuration < 10) {
            this.showMessage('Maximum trade duration harus minimal 10 detik', 'error');
            return;
        }

        if (storage.saveSettings(settings)) {
            this.showMessage('Settings berhasil disimpan', 'success');
        } else {
            this.showMessage('Gagal menyimpan settings', 'error');
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
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
}

// Global instance for HTML onclick handlers
let adminSystem;

// Initialize admin system
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin-dashboard.html')) {
        adminSystem = new AdminSystem();
    }
});
