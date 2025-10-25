// Enhanced Chart Animation System with Technical Analysis
class ChartAnimation {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.prices = [];
        this.volumes = [];
        this.isPlaying = true;
        this.animationId = null;
        this.currentPrice = 0;
        this.priceChange = 0;
        this.selectedAsset = null;
        this.timeframe = '1m';
        this.indicators = {
            sma: true,
            ema: false,
            rsi: false,
            macd: false
        };
        this.candles = [];
        this.currentCandle = null;
        this.candleTime = 0;
        this.candleInterval = 1000;
        this.lastUpdate = Date.now();
        
        // Market news simulation
        this.marketNews = {
            active: false,
            strength: 0,
            duration: 0,
            remaining: 0,
            message: ""
        };
        
        // Live updates untuk semua asset
        this.autoUpdate = true;
        this.updateInterval = 2000; // Update setiap 2 detik
        this.intervalId = null;
        
        this.init();
    }

    init() {
        this.canvas = document.getElementById('price-chart');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.setupEventListeners();
        this.setupTechnicalIndicators();
        
        const assets = storage.getAssets();
        if (assets.length > 0) {
            this.selectedAsset = assets[0];
            this.currentPrice = this.selectedAsset.price;
            this.initializeChartData();
        }
        
        // Initialize live ticker dan start auto updates
        this.updateLiveTicker();
        this.startLiveUpdates();
        
        this.startAnimation();
    }

    setupCanvas() {
        const updateCanvasSize = () => {
            this.canvas.width = this.canvas.offsetWidth * 2;
            this.canvas.height = this.canvas.offsetHeight * 2;
            this.canvas.style.width = this.canvas.offsetWidth + 'px';
            this.canvas.style.height = this.canvas.offsetHeight + 'px';
            this.drawChart();
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }

    setupEventListeners() {
        const playBtn = document.getElementById('play-chart');
        const pauseBtn = document.getElementById('pause-chart');
        const resetBtn = document.getElementById('reset-chart');

        if (playBtn) playBtn.addEventListener('click', () => this.startAnimation());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseAnimation());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetAnimation());

        const assetSelect = document.getElementById('asset-select');
        if (assetSelect) {
            assetSelect.addEventListener('change', (e) => {
                this.updateAsset(e.target.value);
                // Sync harga dengan market ticker
                this.syncAllAssets();
            });
        }

        const timeframeSelect = document.getElementById('timeframe-select');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', (e) => {
                this.changeTimeframe(e.target.value);
            });
        }

        document.querySelectorAll('.indicator-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.toggleIndicator(e.target.dataset.indicator, e.target.checked);
            });
        });

        // Auto-update toggle
        const autoUpdateToggle = document.getElementById('auto-update-toggle');
        if (autoUpdateToggle) {
            autoUpdateToggle.addEventListener('change', (e) => {
                this.autoUpdate = e.target.checked;
                if (this.autoUpdate) {
                    this.startLiveUpdates();
                } else {
                    this.stopLiveUpdates();
                }
            });
        }
    }

    setupTechnicalIndicators() {
        const chartControls = document.querySelector('.chart-controls');
        if (chartControls && !document.getElementById('indicator-controls')) {
            const indicatorHTML = '<div class="indicator-controls" id="indicator-controls"><label><input type="checkbox" class="indicator-toggle" data-indicator="sma" checked> SMA</label><label><input type="checkbox" class="indicator-toggle" data-indicator="ema"> EMA</label><label><input type="checkbox" class="indicator-toggle" data-indicator="rsi"> RSI</label><select id="timeframe-select"><option value="1m">1M</option><option value="5m">5M</option><option value="15m">15M</option><option value="1h">1H</option></select></div>';
            chartControls.insertAdjacentHTML('afterend', indicatorHTML);
            this.setupEventListeners();
        }
    }

    initializeChartData() {
        this.prices = Array(100).fill(this.currentPrice);
        this.volumes = Array(100).fill(1000);
        this.candles = [];
        
        for (let i = 0; i < 50; i++) {
            this.candles.push(this.generateCandle());
        }
        
        this.currentCandle = this.generateCandle();
        this.drawChart();
        this.updatePriceDisplay();
    }

    generateCandle() {
        const basePrice = this.currentPrice;
        const volatility = this.selectedAsset.volatility / 100;
        
        const open = basePrice;
        const high = open * (1 + Math.random() * volatility * 2);
        const low = open * (1 - Math.random() * volatility * 2);
        const close = low + Math.random() * (high - low);
        const volume = Math.random() * 10000 + 1000;
        
        return {
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume,
            timestamp: Date.now()
        };
    }

    startAnimation() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.lastUpdate = Date.now();
        this.animate();
        this.updateControlButtons();
    }

    pauseAnimation() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.updateControlButtons();
    }

    resetAnimation() {
        if (this.selectedAsset) {
            this.currentPrice = this.selectedAsset.price;
            this.initializeChartData();
        }
    }

    animate() {
        if (!this.isPlaying) return;

        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        
        if (deltaTime >= this.candleInterval) {
            this.updateCandle();
            this.lastUpdate = now;
        }

        this.drawChart();
        this.updatePriceDisplay();

        this.animationId = requestAnimationFrame(() => {
            this.animate();
        });
    }

    updateCandle() {
        if (!this.currentCandle) return;

        // Market news simulation
        this.simulateMarketNews();

        const marketState = storage.getMarketState();
        const volatility = this.selectedAsset.volatility / 100;
        
        // Trend yang lebih kuat dan realistis
        let trendStrength = 0;
        switch (marketState.trend) {
            case 'up':
                trendStrength = 0.4 + (Math.random() * 0.3);
                break;
            case 'down':
                trendStrength = -0.4 - (Math.random() * 0.3);
                break;
            default:
                trendStrength = (Math.random() - 0.5) * 0.2;
        }

        // Perhitungan movement yang lebih realistis
        const randomNoise = (Math.random() - 0.5) * volatility * 0.5;
        const trendMove = trendStrength * volatility;
        const momentum = this.calculateMomentum() * 0.2;
        
        // Market news impact
        const newsImpact = this.marketNews.active ? 
            this.marketNews.strength * (this.marketNews.remaining / this.marketNews.duration) : 0;

        // Gabungkan semua faktor
        const priceMove = trendMove + randomNoise + momentum + newsImpact;
        
        // Batasi pergerakan maksimal
        const maxMove = volatility * 0.1;
        const clampedMove = Math.max(-maxMove, Math.min(maxMove, priceMove));

        this.currentPrice = Math.max(1, this.currentPrice * (1 + clampedMove));
        this.priceChange = clampedMove;

        // Update candle dengan pergerakan yang smooth
        this.currentCandle.high = Math.max(this.currentCandle.high, this.currentPrice);
        this.currentCandle.low = Math.min(this.currentCandle.low, this.currentPrice);
        this.currentCandle.close = this.currentPrice;
        
        // Volume mengikuti volatilitas
        const volumeChange = Math.abs(clampedMove) * 5000;
        this.currentCandle.volume += volumeChange;

        this.candleTime += this.candleInterval;

        const timeframeMs = this.getTimeframeMs();
        if (this.candleTime >= timeframeMs) {
            this.candles.push(this.currentCandle);
            if (this.candles.length > 50) {
                this.candles.shift();
            }
            this.currentCandle = this.generateCandle();
            this.candleTime = 0;
        }

        storage.updateAssetPrice(this.selectedAsset.symbol, Math.round(this.currentPrice));
    }

    simulateMarketNews() {
        // 3% chance terjadi market news setiap 5 detik
        if (Math.random() < 0.03 && !this.marketNews.active) {
            this.marketNews.active = true;
            this.marketNews.strength = (Math.random() - 0.5) * 0.3;
            this.marketNews.duration = 3000 + Math.random() * 7000;
            this.marketNews.remaining = this.marketNews.duration;
            
            // Generate random news message
            const newsMessages = {
                positive: [
                    "BREAKING: Positive earnings report!",
                    "Strong demand driving prices up!",
                    "Analyst upgrades price target!",
                    "Institutional buying detected!"
                ],
                negative: [
                    "Weak economic data released!",
                    "Profit taking pressure!",
                    "Technical breakdown occurring!",
                    "Selling pressure intensifies!"
                ]
            };
            
            const messageType = this.marketNews.strength > 0 ? 'positive' : 'negative';
            this.marketNews.message = newsMessages[messageType][Math.floor(Math.random() * newsMessages[messageType].length)];
            
            // Show news alert
            this.showNewsAlert();
        }
        
        if (this.marketNews.active) {
            this.marketNews.remaining -= this.candleInterval;
            if (this.marketNews.remaining <= 0) {
                this.marketNews.active = false;
            }
        }
    }

    showNewsAlert() {
        const newsDiv = document.createElement('div');
        const newsType = this.marketNews.strength > 0 ? 'news-bull' : 'news-bear';
        newsDiv.className = 'news-alert ' + newsType;
        
        newsDiv.innerHTML = '<strong>' + this.marketNews.message + '</strong><span>Impact: ' + (this.marketNews.strength * 100).toFixed(1) + '%</span>';
        
        newsDiv.style.cssText = 'position: fixed; top: 80px; right: 20px; padding: 1rem; border-radius: 8px; color: white; font-weight: 600; z-index: 999; animation: slideInRight 0.5s ease; display: flex; flex-direction: column; gap: 0.5rem; max-width: 300px;';
        
        document.body.appendChild(newsDiv);
        
        // Auto remove after 5 seconds
        setTimeout(function() {
            if (newsDiv.parentNode) {
                newsDiv.remove();
            }
        }, 5000);
    }

    // LIVE UPDATES UNTUK SEMUA ASSET
    startLiveUpdates() {
        if (this.intervalId) return;
        
        this.intervalId = setInterval(() => {
            if (this.autoUpdate && this.isPlaying) {
                this.updateAllAssets();
            }
        }, this.updateInterval);
    }

    stopLiveUpdates() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    updateAllAssets() {
        const assets = storage.getAssets();
        const marketState = storage.getMarketState();
        
        assets.forEach(asset => {
            // Perbaikan: Hindari optional chaining
            const selectedAssetSymbol = this.selectedAsset ? this.selectedAsset.symbol : null;
            if (asset.symbol !== selectedAssetSymbol) {
                this.updateAssetPrice(asset, marketState);
            }
        });
        
        // Update live ticker
        this.updateLiveTicker();
    }

    updateAssetPrice(asset, marketState) {
        const baseVolatility = asset.volatility / 100;
        const marketVolatility = marketState.volatility || 1.0;
        const adjustedVolatility = baseVolatility * marketVolatility;
        
        let trendStrength = marketState.strength || 0;
        
        // Sector-based movement (realistic correlation)
        let sectorBias = 0;
        if (asset.sector === 'Technology') {
            sectorBias = trendStrength * 1.2; // Tech lebih volatile
        } else if (asset.sector === 'Cryptocurrency') {
            sectorBias = trendStrength * 1.5; // Crypto paling volatile
        } else if (asset.sector === 'Automotive') {
            sectorBias = trendStrength * 0.8; // Automotive moderate
        } else if (asset.sector === 'Commodities') {
            sectorBias = trendStrength * 0.5; // Commodities stabil
        } else {
            sectorBias = trendStrength;
        }
        
        const randomMove = (Math.random() - 0.5) * adjustedVolatility;
        const priceMove = sectorBias * adjustedVolatility + randomMove;
        
        // Batasi pergerakan maksimal
        const maxMove = adjustedVolatility * 0.15;
        const clampedMove = Math.max(-maxMove, Math.min(maxMove, priceMove));
        
        const newPrice = Math.max(1, asset.price * (1 + clampedMove));
        storage.updateAssetPrice(asset.symbol, Math.round(newPrice));
    }

    syncAllAssets() {
        const assets = storage.getAssets();
        const marketState = storage.getMarketState();
        
        assets.forEach(asset => {
            this.updateAssetPrice(asset, marketState);
        });
        
        this.updateLiveTicker();
    }

    updateLiveTicker() {
        const tickerContainer = document.getElementById('live-ticker');
        if (!tickerContainer) return;
        
        const assets = storage.getAssets();
        
        const tickerHTML = assets.map(asset => {
            // Hitung perubahan harga
            let priceChange = 0;
            if (asset.history && asset.history.length > 1) {
                priceChange = ((asset.price - asset.history[1].price) / asset.history[1].price) * 100;
            }
            
            const changeClass = priceChange > 0 ? 'profit' : priceChange < 0 ? 'loss' : 'neutral';
            const changeSign = priceChange > 0 ? '+' : '';
            
            return '<div class="ticker-item" data-symbol="' + asset.symbol + '"><span class="asset-symbol">' + asset.symbol + '</span><span class="asset-price">' + this.formatCurrency(asset.price) + '</span><span class="price-change ' + changeClass + '">' + changeSign + priceChange.toFixed(2) + '%</span></div>';
        }).join('');
        
        tickerContainer.innerHTML = tickerHTML;
    }

    getTimeframeMs() {
        switch (this.timeframe) {
            case '1m': return 60000;
            case '5m': return 300000;
            case '15m': return 900000;
            case '1h': return 3600000;
            default: return 60000;
        }
    }

    calculateMomentum() {
        if (this.candles.length < 5) return 0;
        
        const recentPrices = this.candles.slice(-5).map(c => c.close);
        const priceChange = recentPrices[recentPrices.length - 1] - recentPrices[0];
        return priceChange / recentPrices[0];
    }

    drawChart() {
        if (!this.ctx || !this.canvas) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 40;

        this.ctx.clearRect(0, 0, width, height);

        if (this.candles.length < 2) return;

        this.drawCandlestickChart(width, height, padding);
        
        if (this.indicators.sma) this.drawSMA(width, height, padding);
        if (this.indicators.ema) this.drawEMA(width, height, padding);
        if (this.indicators.rsi) this.drawRSI(width, height, padding);
        
        this.drawCurrentPriceLine(width, height, padding);
    }

    drawCandlestickChart(width, height, padding) {
        const chartWidth = width - 2 * padding;
        const chartHeight = height * 0.7 - 2 * padding;
        const volumeAreaHeight = height * 0.3 - padding;

        const allPrices = this.candles.flatMap(c => [c.high, c.low]);
        if (this.currentCandle) {
            allPrices.push(this.currentCandle.high, this.currentCandle.low);
        }
        const maxPrice = Math.max(...allPrices);
        const minPrice = Math.min(...allPrices);
        const priceRange = maxPrice - minPrice || 1;

        const volumes = this.candles.map(c => c.volume);
        const maxVolume = Math.max(...volumes, 1000);

        this.drawGrid(width, height, padding, maxPrice, minPrice, priceRange);

        const candleWidth = Math.max(2, chartWidth / (this.candles.length + 1) * 0.8);
        
        this.candles.forEach((candle, index) => {
            const x = padding + (index / this.candles.length) * chartWidth;
            const isBullish = candle.close >= candle.open;
            
            const openY = height * 0.7 - padding - ((candle.open - minPrice) / priceRange) * chartHeight;
            const closeY = height * 0.7 - padding - ((candle.close - minPrice) / priceRange) * chartHeight;
            const highY = height * 0.7 - padding - ((candle.high - minPrice) / priceRange) * chartHeight;
            const lowY = height * 0.7 - padding - ((candle.low - minPrice) / priceRange) * chartHeight;
            
            this.ctx.strokeStyle = isBullish ? '#4CAF50' : '#f44336';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x + candleWidth / 2, highY);
            this.ctx.lineTo(x + candleWidth / 2, lowY);
            this.ctx.stroke();

            this.ctx.fillStyle = isBullish ? '#4CAF50' : '#f44336';
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(openY - closeY);
            this.ctx.fillRect(x, bodyTop, candleWidth, Math.max(1, bodyHeight));

            if (volumeAreaHeight > 10) {
                const volumeBarHeight = (candle.volume / maxVolume) * (volumeAreaHeight - 10);
                const volumeBarY = height * 0.7 + (volumeAreaHeight - volumeBarHeight);
                this.ctx.fillStyle = isBullish ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
                this.ctx.fillRect(x, volumeBarY, candleWidth, volumeBarHeight);
            }
        });

        if (this.currentCandle) {
            const x = padding + chartWidth;
            const isBullish = this.currentCandle.close >= this.currentCandle.open;
            
            const openY = height * 0.7 - padding - ((this.currentCandle.open - minPrice) / priceRange) * chartHeight;
            const closeY = height * 0.7 - padding - ((this.currentCandle.close - minPrice) / priceRange) * chartHeight;
            const highY = height * 0.7 - padding - ((this.currentCandle.high - minPrice) / priceRange) * chartHeight;
            const lowY = height * 0.7 - padding - ((this.currentCandle.low - minPrice) / priceRange) * chartHeight;
            
            this.ctx.strokeStyle = isBullish ? '#4CAF50' : '#f44336';
            this.ctx.setLineDash([5, 3]);
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x + candleWidth / 2, highY);
            this.ctx.lineTo(x + candleWidth / 2, lowY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            this.ctx.fillStyle = isBullish ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(openY - closeY);
            this.ctx.fillRect(x, bodyTop, candleWidth, Math.max(1, bodyHeight));

            if (volumeAreaHeight > 10) {
                const volumeBarHeight = (this.currentCandle.volume / maxVolume) * (volumeAreaHeight - 10);
                const volumeBarY = height * 0.7 + (volumeAreaHeight - volumeBarHeight);
                this.ctx.fillStyle = isBullish ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
                this.ctx.fillRect(x, volumeBarY, candleWidth, volumeBarHeight);
            }
        }
    }

    drawGrid(width, height, padding, maxPrice, minPrice, priceRange) {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (height * 0.7 - 2 * padding) * (i / 5);
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(width - padding, y);
            this.ctx.stroke();

            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'right';
            const price = maxPrice - (priceRange * (i / 5));
            this.ctx.fillText(this.formatCurrency(price), padding - 5, y + 4);
        }

        this.ctx.setLineDash([]);
    }

    drawSMA(width, height, padding) {
        const period = 14;
        if (this.candles.length < period) return;

        const closes = this.candles.map(c => c.close);
        const smaValues = this.calculateSMA(closes, period);
        
        this.drawLine(smaValues, width, height, padding, '#FF9800', 'SMA 14');
    }

    drawEMA(width, height, padding) {
        const period = 12;
        if (this.candles.length < period) return;

        const closes = this.candles.map(c => c.close);
        const emaValues = this.calculateEMA(closes, period);
        
        this.drawLine(emaValues, width, height, padding, '#2196F3', 'EMA 12');
    }

    drawRSI(width, height, padding) {
        const period = 14;
        if (this.candles.length < period + 1) return;

        const rsiValues = this.calculateRSI(period);
        this.drawRSIChart(rsiValues, width, height, padding);
    }

    drawLine(values, width, height, padding, color, label) {
        const chartWidth = width - 2 * padding;
        const chartHeight = height * 0.7 - 2 * padding;

        const allPrices = this.candles.flatMap(c => [c.high, c.low]);
        const maxPrice = Math.max(...allPrices);
        const minPrice = Math.min(...allPrices);
        const priceRange = maxPrice - minPrice || 1;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        values.forEach((value, index) => {
            if (value === null) return;
            
            const x = padding + (index / (this.candles.length - 1)) * chartWidth;
            const y = height * 0.7 - padding - ((value - minPrice) / priceRange) * chartHeight;
            
            if (index === values.findIndex(v => v !== null)) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();

        if (values[values.length - 1]) {
            const lastX = padding + chartWidth;
            const lastY = height * 0.7 - padding - ((values[values.length - 1] - minPrice) / priceRange) * chartHeight;
            
            this.ctx.fillStyle = color;
            this.ctx.fillText(label, lastX + 5, lastY);
        }
    }

    drawRSIChart(rsiValues, width, height, padding) {
        const rsiHeight = height * 0.2;
        const rsiY = height * 0.75;
        const rsiWidth = width - 2 * padding;

        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        this.ctx.moveTo(padding, rsiY);
        this.ctx.lineTo(width - padding, rsiY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(padding, rsiY + rsiHeight);
        this.ctx.lineTo(width - padding, rsiY + rsiHeight);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#9C27B0';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        rsiValues.forEach((value, index) => {
            if (value === null) return;
            
            const x = padding + (index / (rsiValues.length - 1)) * rsiWidth;
            const y = rsiY + rsiHeight - (value / 100) * rsiHeight;
            
            if (index === rsiValues.findIndex(v => v !== null)) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();

        this.ctx.strokeStyle = '#f44336';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(padding, rsiY + rsiHeight * 0.3);
        this.ctx.lineTo(width - padding, rsiY + rsiHeight * 0.3);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.moveTo(padding, rsiY + rsiHeight * 0.7);
        this.ctx.lineTo(width - padding, rsiY + rsiHeight * 0.7);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawCurrentPriceLine(width, height, padding) {
        const allPrices = this.candles.flatMap(c => [c.high, c.low]);
        const maxPrice = Math.max(...allPrices);
        const minPrice = Math.min(...allPrices);
        const priceRange = maxPrice - minPrice || 1;

        const chartHeight = height * 0.7 - 2 * padding;
        const y = height * 0.7 - padding - ((this.currentPrice - minPrice) / priceRange) * chartHeight;

        this.ctx.strokeStyle = '#FFC107';
        this.ctx.setLineDash([5, 5]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, y);
        this.ctx.lineTo(width - padding, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = '#FFC107';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(this.formatCurrency(this.currentPrice), width - padding - 100, y - 5);
    }

    calculateSMA(data, period) {
        const sma = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma[i] = sum / period;
        }
        return sma;
    }

    calculateEMA(data, period) {
        const ema = [];
        const multiplier = 2 / (period + 1);
        
        ema[period - 1] = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        for (let i = period; i < data.length; i++) {
            ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
        }
        
        return ema;
    }

    calculateRSI(period) {
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < this.candles.length; i++) {
            const change = this.candles[i].close - this.candles[i - 1].close;
            gains.push(Math.max(change, 0));
            losses.push(Math.max(-change, 0));
        }

        const rsi = [];
        for (let i = period; i < gains.length; i++) {
            const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
            const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
            
            if (avgLoss === 0) {
                rsi[i] = 100;
            } else {
                const rs = avgGain / avgLoss;
                rsi[i] = 100 - (100 / (1 + rs));
            }
        }
        
        return rsi;
    }

    updateAsset(assetSymbol) {
        const asset = storage.getAsset(assetSymbol);
        if (asset) {
            this.selectedAsset = asset;
            this.currentPrice = asset.price;
            this.initializeChartData();
            this.updateChartTitle();
        }
    }

    changeTimeframe(timeframe) {
        this.timeframe = timeframe;
        this.candleTime = 0;
        this.initializeChartData();
    }

    toggleIndicator(indicator, enabled) {
        this.indicators[indicator] = enabled;
        this.drawChart();
    }

    updateChartTitle() {
        const chartTitle = document.getElementById('chart-title');
        if (chartTitle && this.selectedAsset) {
            chartTitle.textContent = this.selectedAsset.symbol + ' - ' + this.selectedAsset.name;
        }
    }

    updatePriceDisplay() {
        const currentPriceElem = document.getElementById('current-price');
        const priceChangeElem = document.getElementById('price-change');

        if (currentPriceElem) {
            currentPriceElem.textContent = this.formatCurrency(this.currentPrice);
            
            // Efek visual berdasarkan pergerakan
            if (this.priceChange > 0.02) {
                currentPriceElem.classList.add('price-surge');
                setTimeout(() => currentPriceElem.classList.remove('price-surge'), 500);
            } else if (this.priceChange < -0.02) {
                currentPriceElem.classList.add('price-crash');
                setTimeout(() => currentPriceElem.classList.remove('price-crash'), 500);
            }
        }

        if (priceChangeElem) {
            const changePercent = (this.priceChange * 100).toFixed(2);
            priceChangeElem.textContent = (this.priceChange >= 0 ? '+' : '') + changePercent + '%';
            priceChangeElem.className = this.priceChange >= 0 ? 'profit' : 'loss';
            
            if (Math.abs(this.priceChange) > 0.05) {
                priceChangeElem.style.fontWeight = 'bold';
                priceChangeElem.style.fontSize = '1.1em';
            } else {
                priceChangeElem.style.fontWeight = 'normal';
                priceChangeElem.style.fontSize = '1em';
            }
        }
    }

    updateControlButtons() {
        const playBtn = document.getElementById('play-chart');
        const pauseBtn = document.getElementById('pause-chart');

        if (playBtn && pauseBtn) {
            if (this.isPlaying) {
                playBtn.style.display = 'none';
                pauseBtn.style.display = 'inline-block';
            } else {
                playBtn.style.display = 'inline-block';
                pauseBtn.style.display = 'none';
            }
        }
    }

    formatCurrency(amount) {
        if (amount >= 1000000) {
            return 'Rp ' + (amount / 1000000).toFixed(2) + 'M';
        } else if (amount >= 1000) {
            return 'Rp ' + (amount / 1000).toFixed(1) + 'K';
        } else {
            return 'Rp ' + Math.round(amount);
        }
    }

    destroy() {
        this.pauseAnimation();
        this.stopLiveUpdates(); // Stop auto updates
    }
}

// Initialize chart animation
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('user-dashboard.html')) {
        window.chartAnimation = new ChartAnimation();
    }
});

window.addEventListener('beforeunload', () => {
    if (window.chartAnimation) {
        window.chartAnimation.destroy();
    }
});