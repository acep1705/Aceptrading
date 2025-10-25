// Storage Management untuk Trading Mini App
class StorageManager {
    constructor() {
        this.usersKey = 'trading_users';
        this.adminKey = 'trading_admin';
        this.assetsKey = 'trading_assets';
        this.transactionsKey = 'trading_transactions';
        this.settingsKey = 'trading_settings';
        this.marketKey = 'trading_market';
        this.currentUserKey = 'current_user';
        this.init();
    }

    init() {
        // Initialize default data jika belum ada
        if (!this.getUsers().length) {
            this.initDefaultData();
        }
    }

    initDefaultData() {
        // Default users
        const defaultUsers = [
            {
                id: 1,
                username: 'user1',
                password: '1234',
                balance: 1000000,
                createdAt: new Date().toISOString(),
                trades: [],
                transactions: []
            }
        ];
        this.setItem(this.usersKey, defaultUsers);

        // Default admin
        const adminUser = {
            username: 'acep',
            password: '17',
            isAdmin: true
        };
        this.setItem(this.adminKey, adminUser);

        // Default assets
        // Di method initDefaultData(), ganti bagian assets:
// CARI BARIS INI (sekitar line 40-70):
const defaultAssets = [
    {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 175000,
        volatility: 8,
        type: 'stock',
        history: [],
        sector: 'Technology',
        marketCap: '2.8T'
    },
    {
        id: 2,
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 245000,
        volatility: 15,
        type: 'stock', 
        history: [],
        sector: 'Automotive',
        marketCap: '780B'
    },
    {
        id: 3,
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 825000000,
        volatility: 25,
        type: 'crypto',
        history: [],
        sector: 'Cryptocurrency',
        marketCap: '1.6T'
    },
    {
        id: 4,
        symbol: 'ETH',
        name: 'Ethereum',
        price: 45000000,
        volatility: 20,
        type: 'crypto',
        history: [],
        sector: 'Cryptocurrency', 
        marketCap: '540B'
    },
    {
        id: 5,
        symbol: 'GOLD',
        name: 'Gold',
        price: 1200000,
        volatility: 3,
        type: 'commodity',
        history: [],
        sector: 'Commodities',
        marketCap: '12T'
    }
];
        this.setItem(this.assetsKey, defaultAssets);

        // Default settings
        const defaultSettings = {
            minTradeAmount: 10000,
            maxTradeDuration: 300,
            autoApproval: false
        };
        this.setItem(this.settingsKey, defaultSettings);
        
// GANTI DENGAN INI:
const defaultMarket = {
    trend: 'random',
    strength: 0,
    volatility: 1.0,
    marketHours: true,
    lastUpdate: Date.now()
};
        this.setItem(this.marketKey, defaultMarket);

        // Initialize transaction requests
        this.setItem(this.transactionsKey, []);
    }

    // Generic storage methods
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    // User management
    getUsers() {
        return this.getItem(this.usersKey) || [];
    }

    saveUsers(users) {
        return this.setItem(this.usersKey, users);
    }

    getUserByUsername(username) {
        const users = this.getUsers();
        return users.find(user => user.username === username);
    }

    getUserById(userId) {
        const users = this.getUsers();
        return users.find(user => user.id === userId);
    }

    addUser(user) {
        const users = this.getUsers();
        const newUser = {
            ...user,
            id: Date.now(),
            balance: 1000000,
            createdAt: new Date().toISOString(),
            trades: [],
            transactions: []
        };
        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }

    updateUser(updatedUser) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedUser };
            this.saveUsers(users);
            return true;
        }
        return false;
    }

    deleteUser(userId) {
        const users = this.getUsers();
        const filteredUsers = users.filter(user => user.id !== userId);
        return this.saveUsers(filteredUsers);
    }

    // Asset management
    getAssets() {
        return this.getItem(this.assetsKey) || [];
    }

    saveAssets(assets) {
        return this.setItem(this.assetsKey, assets);
    }

    getAsset(symbol) {
        const assets = this.getAssets();
        return assets.find(asset => asset.symbol === symbol);
    }

    getAssetById(assetId) {
        const assets = this.getAssets();
        return assets.find(asset => asset.id === assetId);
    }

    addAsset(asset) {
        const assets = this.getAssets();
        const newAsset = {
            ...asset,
            id: Date.now(),
            history: []
        };
        assets.push(newAsset);
        this.saveAssets(assets);
        return newAsset;
    }

    updateAsset(updatedAsset) {
        const assets = this.getAssets();
        const index = assets.findIndex(asset => asset.id === updatedAsset.id);
        if (index !== -1) {
            assets[index] = { ...assets[index], ...updatedAsset };
            this.saveAssets(assets);
            return true;
        }
        return false;
    }

    deleteAsset(assetId) {
        const assets = this.getAssets();
        const filteredAssets = assets.filter(asset => asset.id !== assetId);
        return this.saveAssets(filteredAssets);
    }

    // Transaction management
    getTransactions() {
        return this.getItem(this.transactionsKey) || [];
    }

    saveTransactions(transactions) {
        return this.setItem(this.transactionsKey, transactions);
    }

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        const newTransaction = {
            ...transaction,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        transactions.push(newTransaction);
        this.saveTransactions(transactions);
        return newTransaction;
    }

    updateTransaction(updatedTransaction) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === updatedTransaction.id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedTransaction };
            this.saveTransactions(transactions);
            return true;
        }
        return false;
    }

    // Settings management
    getSettings() {
        return this.getItem(this.settingsKey) || {
            minTradeAmount: 10000,
            maxTradeDuration: 300,
            autoApproval: false
        };
    }

    saveSettings(settings) {
        return this.setItem(this.settingsKey, settings);
    }

    // Market state management
    getMarketState() {
        return this.getItem(this.marketKey) || {
            trend: 'random',
            paused: false
        };
    }

    saveMarketState(marketState) {
        return this.setItem(this.marketKey, marketState);
    }

    // Current user session
    getCurrentUser() {
        return this.getItem(this.currentUserKey);
    }

    setCurrentUser(user) {
        return this.setItem(this.currentUserKey, user);
    }

    clearCurrentUser() {
        localStorage.removeItem(this.currentUserKey);
    }

    // Admin authentication
    validateAdmin(username, password) {
        const admin = this.getItem(this.adminKey);
        return admin && admin.username === username && admin.password === password;
    }

    // Trade management
    addUserTrade(userId, trade) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            const newTrade = {
                ...trade,
                id: Date.now(),
                createdAt: new Date().toISOString(),
                status: 'active'
            };
            
            if (!users[userIndex].trades) {
                users[userIndex].trades = [];
            }
            
            users[userIndex].trades.unshift(newTrade);
            users[userIndex].balance -= trade.amount;
            this.saveUsers(users);
            
            // Update current user if it's the same user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                this.setCurrentUser(users[userIndex]);
            }
            
            return newTrade;
        }
        return null;
    }

    completeTrade(userId, tradeId, result) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            const user = users[userIndex];
            const tradeIndex = user.trades.findIndex(t => t.id === tradeId);
            
            if (tradeIndex !== -1 && user.trades[tradeIndex].status === 'active') {
                const trade = user.trades[tradeIndex];
                trade.status = 'completed';
                trade.result = result;
                trade.completedAt = new Date().toISOString();
                
                if (result === 'win') {
                    user.balance += trade.amount * 2;
                }
                
                this.saveUsers(users);
                
                // Update current user if it's the same user
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    this.setCurrentUser(user);
                }
                
                return true;
            }
        }
        return false;
    }

    // Transaction approval
    approveTransaction(transactionId) {
        const transactions = this.getTransactions();
        const transactionIndex = transactions.findIndex(t => t.id === transactionId);
        
        if (transactionIndex !== -1 && transactions[transactionIndex].status === 'pending') {
            const transaction = transactions[transactionIndex];
            transaction.status = 'approved';
            transaction.approvedAt = new Date().toISOString();
            
            // Update user balance
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.id === transaction.userId);
            if (userIndex !== -1) {
                if (transaction.type === 'deposit') {
                    users[userIndex].balance += transaction.amount;
                } else if (transaction.type === 'withdraw') {
                    users[userIndex].balance -= transaction.amount;
                }
                this.saveUsers(users);
            }
            
            this.saveTransactions(transactions);
            return true;
        }
        return false;
    }

    rejectTransaction(transactionId) {
        const transactions = this.getTransactions();
        const transactionIndex = transactions.findIndex(t => t.id === transactionId);
        
        if (transactionIndex !== -1 && transactions[transactionIndex].status === 'pending') {
            transactions[transactionIndex].status = 'rejected';
            this.saveTransactions(transactions);
            return true;
        }
        return false;
    }

    // Price update for assets
    updateAssetPrice(symbol, newPrice) {
        const assets = this.getAssets();
        const assetIndex = assets.findIndex(a => a.symbol === symbol);
        if (assetIndex !== -1) {
            const asset = assets[assetIndex];
            
            // Add to history (keep last 100 prices)
            if (!asset.history) {
                asset.history = [];
            }
            
            asset.history.unshift({
                price: asset.price,
                timestamp: new Date().toISOString()
            });
            
            if (asset.history.length > 100) {
                asset.history = asset.history.slice(0, 100);
            }
            
            // Update current price
            asset.price = Math.round(newPrice);
            this.saveAssets(assets);
            return true;
        }
        return false;
    }

    // Statistics
    getSystemStats() {
        const users = this.getUsers();
        const transactions = this.getTransactions();
        
        const totalUsers = users.length;
        const totalDeposit = transactions
            .filter(t => t.type === 'deposit' && t.status === 'approved')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalWithdraw = transactions
            .filter(t => t.type === 'withdraw' && t.status === 'approved')
            .reduce((sum, t) => sum + t.amount, 0);
        const systemBalance = totalDeposit - totalWithdraw;
        
        return {
            totalUsers,
            totalDeposit,
            totalWithdraw,
            systemBalance
        };
    }
}

// Create global instance
const storage = new StorageManager();
