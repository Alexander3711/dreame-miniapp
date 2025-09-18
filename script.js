// JavaScript для Telegram Mini App

class DreametechApp {
    constructor() {
        this.categories = {
            "roboty-pylesosy": { name: "🤖 Роботы-пылесосы", emoji: "🤖" },
            "besprovodnye-pylesosy": { name: "🔋 Беспроводные пылесосы", emoji: "🔋" },
            "moyushchie-pylesosy": { name: "💧 Моющие пылесосы", emoji: "💧" },
            "tekhnika-dlya-krasoty": { name: "💄 Техника для красоты", emoji: "💄" },
            "air-purifiers": { name: "🌬️ Очистители воздуха", emoji: "🌬️" }
        };
        
        this.currentCategory = null;
        this.currentProduct = null;
        this.products = [];
        
        this.init();
    }
    
    init() {
        // Инициализация Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }
        
        this.setupEventListeners();
        this.loadCategories();
    }
    
    setupEventListeners() {
        // Поиск
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.handleSearch();
        });
        
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        // Навигация
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showCategories();
        });
        
        document.getElementById('backToProductsBtn').addEventListener('click', () => {
            this.showProducts();
        });
    }
    
    async loadCategories() {
        try {
            this.showLoading();
            
            // Загружаем статистику по категориям
            const response = await fetch('https://b6f1b3153b6f.ngrok-free.app/api/categories');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const categoriesData = await response.json();
            
            this.renderCategories(categoriesData);
            this.hideLoading();
            
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            this.showError();
        }
    }
    
    renderCategories(categoriesData) {
        const grid = document.getElementById('categoriesGrid');
        grid.innerHTML = '';
        
        Object.entries(this.categories).forEach(([key, category]) => {
            const count = categoriesData[key] || 0;
            
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <span class="emoji">${category.emoji}</span>
                <div class="name">${category.name}</div>
                <div class="count">${count} товаров</div>
            `;
            
            card.addEventListener('click', () => {
                // Мгновенно переключаемся на экран товаров и прокручиваем вверх
                this.currentCategory = key;
                this.showProducts();
                this.scrollToTop();
                this.loadProducts(key);
            });
            
            grid.appendChild(card);
        });
    }
    
    async loadProducts(categoryKey) {
        try {
            this.showLoading();
            this.currentCategory = categoryKey;
            
            const response = await fetch(`https://b6f1b3153b6f.ngrok-free.app/api/products?category=${categoryKey}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            
            this.products = products;
            this.renderProducts(products);
            this.showProducts();
            this.hideLoading();
            
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert(`Ошибка загрузки товаров: ${error?.message || error}`);
            }
            this.showError();
        }
    }
    
    renderProducts(products) {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = '';
        
        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--tg-theme-hint-color);">Товары не найдены</p>';
            return;
        }
        
        products.forEach(async (product) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const imgUrl = await this.fetchProductImage(product.name, product.category);
            card.innerHTML = `
                ${imgUrl ? `<img src="${imgUrl}" alt="${this.escapeHtml(product.name)}" style="width:100%;height:auto;border-radius:12px;margin-bottom:10px;object-fit:cover;">` : ''}
                <div class="name">${this.escapeHtml(product.name)}</div>
                <div class="price">${this.escapeHtml(product.price)}</div>
                <div class="description">${this.formatDescription(product.description)}</div>
            `;
            
            card.addEventListener('click', () => {
                this.showProductDetails(product);
            });
            
            grid.appendChild(card);
        });
    }
    
    async showProductDetails(product) {
        try {
            this.showLoading();
            this.currentProduct = product;
            
            // Загружаем полную информацию о товаре
            const response = await fetch(`https://b6f1b3153b6f.ngrok-free.app/api/product/${encodeURIComponent(product.name)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const productData = await response.json();
            
            this.renderProductDetails(productData);
            this.showProductDetailsView();
            this.hideLoading();
            
        } catch (error) {
            console.error('Ошибка загрузки деталей товара:', error);
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert(`Ошибка загрузки товара: ${error?.message || error}`);
            }
            this.showError();
        }
    }
    
    renderProductDetails(product) {
        const title = document.getElementById('productTitle');
        const info = document.getElementById('productInfo');
        
        title.textContent = product.name;
        
        let specificationsHtml = '';
        if (product.specifications && Object.keys(product.specifications).length > 0) {
            specificationsHtml = `
                <div class="specifications">
                    <h3>📋 Характеристики</h3>
                    ${Object.entries(product.specifications).map(([key, value]) => `
                        <div class="spec-item">
                            <span class="spec-key">${this.escapeHtml(key)}</span>
                            <span class="spec-value">${this.escapeHtml(value)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        info.innerHTML = `
            <div class="name">${this.escapeHtml(product.name)}</div>
            <div class="price">${this.escapeHtml(product.price)}</div>
            <div class="description">${this.formatDescription(product.description)}</div>
            ${specificationsHtml}
            <div class="url">
                <a href="${product.url}" target="_blank" rel="noopener noreferrer">
                    🔗 Открыть на сайте Dreametech
                </a>
            </div>
        `;

        // Вставим изображение сверху, если существует
        this.fetchProductImage(product.name, product.category).then((imgUrl) => {
            if (!imgUrl) return;
            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = product.name;
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '16px';
            img.style.marginBottom = '16px';
            info.prepend(img);
        });
    }
    
    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;
        
        try {
            this.showLoading();
            
            const response = await fetch(`https://b6f1b3153b6f.ngrok-free.app/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const results = await response.json();
            
            this.renderProducts(results);
            this.showProducts();
            this.hideLoading();
            
        } catch (error) {
            console.error('Ошибка поиска:', error);
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert(`Ошибка поиска: ${error?.message || error}`);
            }
            this.showError();
        }
    }
    
    // Навигация между экранами
    showCategories() {
        const cat = document.getElementById('categoriesSection');
        const prod = document.getElementById('productsSection');
        const details = document.getElementById('productDetails');
        const search = document.getElementById('searchInput');
        if (cat) cat.style.display = 'block';
        if (prod) prod.style.display = 'none';
        if (details) details.style.display = 'none';
        if (search) search.value = '';
    }
    
    showProducts() {
        const cat = document.getElementById('categoriesSection');
        const prod = document.getElementById('productsSection');
        const details = document.getElementById('productDetails');
        if (cat) cat.style.display = 'none';
        if (prod) prod.style.display = 'block';
        if (details) details.style.display = 'none';
        
        const categoryTitle = document.getElementById('categoryTitle');
        if (this.currentCategory) {
            categoryTitle.textContent = this.categories[this.currentCategory].name;
        }

        // Всегда прокручиваем вверх при открытии списка товаров
        this.scrollToTop();
    }
    
    showProductDetailsView() {
        const cat = document.getElementById('categoriesSection');
        const prod = document.getElementById('productsSection');
        const details = document.getElementById('productDetails');
        if (cat) cat.style.display = 'none';
        if (prod) prod.style.display = 'none';
        if (details) details.style.display = 'block';
        this.scrollToTop();
    }
    
    // Утилиты
    showLoading() {
        const el = document.getElementById('loading');
        if (el) el.style.display = 'block';
    }
    
    hideLoading() {
        const el = document.getElementById('loading');
        if (el) el.style.display = 'none';
    }
    
    showError() {
        const el = document.getElementById('error');
        if (el) el.style.display = 'block';
        this.hideLoading();
    }

    scrollToTop() {
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (window.Telegram?.WebApp?.MainButton) {
                // Небольшой трюк, чтобы Telegram перерисовал вью
                setTimeout(() => window.scrollTo({ top: 0 }), 50);
            }
        } catch (_) {
            // Fallback без smooth
            window.scrollTo(0, 0);
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Красиво форматируем описание, если оно приходит JSON-массивом или с \n
    formatDescription(raw) {
        if (!raw) return 'Описание недоступно';
        try {
            const maybeParsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (Array.isArray(maybeParsed)) {
                return maybeParsed
                    .filter(Boolean)
                    .map(p => `<p>${this.escapeHtml(String(p))}</p>`) 
                    .join('');
            }
            if (typeof maybeParsed === 'object' && maybeParsed !== null) {
                return `<pre>${this.escapeHtml(JSON.stringify(maybeParsed, null, 2))}</pre>`;
            }
        } catch (_) {
            // not JSON, fall back to plain text handling
        }
        // Простая строка: заменим переводы строк на <br>
        return this.escapeHtml(String(raw)).replace(/\n/g, '<br>');
    }

    async fetchProductImage(name, category) {
        try {
            const url = new URL('https://b6f1b3153b6f.ngrok-free.app/api/product-image');
            url.searchParams.set('name', name);
            if (category) url.searchParams.set('category', category);
            const res = await fetch(url.toString());
            if (!res.ok) return null;
            const data = await res.json();
            return data.image_url || null;
        } catch (_) {
            return null;
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new DreametechApp();
});