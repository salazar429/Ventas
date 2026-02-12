// ===========================================
// APP VENDEDORA - LÓGICA COMPLETA
// ===========================================

const API_URL = 'https://sistema-test-api.onrender.com';

const App = {
    usuario: null,
    currentPage: 'dashboard',
    productos: [],
    carrito: [],
    ventas: [],
    categoriaActiva: 'todos',
    
    init() {
        console.log('🚀 Iniciando App Vendedora');
        this.hideSplashScreen();
        this.checkLogin();
        this.setupEventListeners();
        this.testServerConnection();
        this.setupNavigation();
        this.setupFloatingButton();
        this.setupSearchAndFilters();
        this.setupReportes();
    },
    
    // ===== SPLASH SCREEN =====
    hideSplashScreen() {
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.classList.add('hidden');
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 500);
            }
            
            // Mostrar status después del splash
            const status = document.getElementById('serverStatus');
            if (status) status.style.display = 'block';
            
            // Mostrar login con animación
            const loginPanel = document.getElementById('loginPanel');
            if (loginPanel) loginPanel.classList.add('visible');
            
        }, 2000); // 2 segundos de splash
    },
    
    async testServerConnection() {
        const statusDiv = document.getElementById('serverStatus');
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                statusDiv.className = 'connection-status online';
                statusDiv.innerHTML = `✓ Conectado - ${data.productos} productos, ${data.vendedoras} vendedoras`;
            } else {
                throw new Error('Error en respuesta');
            }
        } catch (error) {
            statusDiv.className = 'connection-status offline';
            statusDiv.innerHTML = '✗ Sin conexión';
        }
    },
    
    checkLogin() {
        const savedUser = localStorage.getItem('vendedora_activa');
        if (savedUser) {
            try {
                this.usuario = JSON.parse(savedUser);
                this.showVentaPanel();
                this.cargarProductos();
                this.actualizarInfoUsuario();
                this.cargarVentas();
            } catch (e) {
                this.showLoginPanel();
            }
        } else {
            this.showLoginPanel();
        }
    },
    
    async login() {
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;
        
        if (!usuario || !password) {
            this.showError('Usuario y contraseña son obligatorios');
            return;
        }
        
        const btn = document.getElementById('btnLogin');
        btn.disabled = true;
        btn.textContent = '🔐 Verificando...';
        
        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.usuario = data.usuario;
                localStorage.setItem('vendedora_activa', JSON.stringify(this.usuario));
                
                this.actualizarInfoUsuario();
                this.showVentaPanel();
                this.cargarProductos();
                this.cargarVentas();
                this.showError('', 'clear');
                
                this.mostrarNotificacion(`✅ Bienvenida, ${this.usuario.nombre}`);
            } else {
                this.showError(data.error || 'Credenciales incorrectas');
            }
            
        } catch (error) {
            console.error('Error en login:', error);
            this.showError('Error de conexión con el servidor');
        } finally {
            btn.disabled = false;
            btn.textContent = '🔑 Iniciar Sesión';
        }
    },
    
    logout() {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('vendedora_activa');
            this.usuario = null;
            this.carrito = [];
            this.ventas = [];
            this.showLoginPanel();
            this.mostrarNotificacion('👋 Sesión cerrada');
        }
    },
    
    setupNavigation() {
        document.querySelectorAll('#ventaPanel .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });
        
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('userAvatar')?.addEventListener('click', () => this.logout());
    },
    
    switchPage(page) {
        document.querySelectorAll('#ventaPanel .nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
        
        document.querySelectorAll('#ventaPanel .page-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(`${page}Section`).classList.add('active');
        this.currentPage = page;
        
        if (page === 'products') {
            this.cargarInventario();
        } else if (page === 'sales') {
            this.cargarTodasLasVentas();
        }
    },
    
    setupSearchAndFilters() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        const performSearch = () => {
            const term = searchInput.value.toLowerCase();
            this.filtrarProductos(term, this.categoriaActiva);
        };
        
        searchInput?.addEventListener('input', performSearch);
        searchBtn?.addEventListener('click', performSearch);
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.categoriaActiva = btn.dataset.category;
                this.filtrarProductos(document.getElementById('searchInput')?.value.toLowerCase() || '', this.categoriaActiva);
            });
        });
    },
    
    filtrarProductos(termino, categoria = 'todos') {
        const cards = document.querySelectorAll('#productoContainer .product-card');
        cards.forEach(card => {
            const nombre = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
            const categoriaProducto = card.dataset.categoria || 'general';
            
            let mostrar = true;
            
            if (termino && !nombre.includes(termino)) {
                mostrar = false;
            }
            
            if (categoria !== 'todos' && categoriaProducto !== categoria) {
                mostrar = false;
            }
            
            card.style.display = mostrar ? 'block' : 'none';
        });
    },
    
    setupFloatingButton() {
        const floatingBtn = document.getElementById('floatingSaleBtn');
        const closeBtn = document.getElementById('closeSaleBtn');
        const panel = document.getElementById('currentSalePanel');
        const ventaActualCard = document.getElementById('ventaActualCard');
        
        floatingBtn?.addEventListener('click', () => {
            panel?.classList.toggle('active');
        });
        
        closeBtn?.addEventListener('click', () => {
            panel?.classList.remove('active');
        });
        
        ventaActualCard?.addEventListener('click', () => {
            panel?.classList.toggle('active');
        });
        
        document.getElementById('clearSaleBtn')?.addEventListener('click', () => {
            this.limpiarCarrito();
        });
        
        document.getElementById('completeSaleBtn')?.addEventListener('click', () => {
            this.completarVenta();
        });
    },
    
    async cargarProductos() {
        const container = document.getElementById('productoContainer');
        const countSpan = document.getElementById('productCount');
        const totalProductosSpan = document.getElementById('totalProductosCount');
        const inventoryTotalSpan = document.getElementById('inventoryTotalProducts');
        
        try {
            const response = await fetch(`${API_URL}/api/dueno/productos`);
            this.productos = await response.json();
            
            if (countSpan) countSpan.textContent = `(${this.productos.length} productos)`;
            if (totalProductosSpan) totalProductosSpan.textContent = this.productos.length;
            if (inventoryTotalSpan) inventoryTotalSpan.textContent = this.productos.length;
            
            if (this.productos.length === 0) {
                container.innerHTML = '<div class="empty-message" style="grid-column: span 2; padding: 40px;">No hay productos disponibles</div>';
                return;
            }
            
            let html = '';
            this.productos.forEach(p => {
                const stockClass = p.stock < 5 ? 'low-stock' : '';
                const stockText = p.stock === 0 ? 'out-of-stock' : '';
                
                html += `
                    <div class="product-card ${stockClass} ${stockText}" data-producto-id="${p.id}" data-categoria="${p.categoria || 'general'}">
                        <div class="product-icon">📦</div>
                        <div class="product-name">${p.nombre}</div>
                        <div class="product-price">$${p.precio.toFixed(2)}</div>
                        <div class="product-stock">Stock: ${p.stock} uds</div>
                        <div class="product-actions">
                            <input type="number" id="cantidad-${p.id}" class="quantity-input" value="1" min="1" max="${p.stock}">
                            <button class="add-to-sale-btn" onclick="App.agregarAlCarrito('${p.id}')">
                                🛒 Agregar
                            </button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            this.cargarInventario();
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            container.innerHTML = '<div class="empty-message" style="grid-column: span 2; padding: 40px; color: #e74c3c;">❌ Error cargando productos</div>';
        }
    },
    
    agregarAlCarrito(productoId) {
        const producto = this.productos.find(p => p.id === productoId);
        const cantidadInput = document.getElementById(`cantidad-${productoId}`);
        const cantidad = parseInt(cantidadInput?.value || '1');
        
        if (!producto) return;
        
        if (cantidad > producto.stock) {
            this.mostrarNotificacion('❌ Stock insuficiente');
            return;
        }
        
        const itemExistente = this.carrito.find(item => item.id === productoId);
        
        if (itemExistente) {
            if (itemExistente.cantidad + cantidad > producto.stock) {
                this.mostrarNotificacion('❌ Stock insuficiente');
                return;
            }
            itemExistente.cantidad += cantidad;
        } else {
            this.carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: cantidad,
                stock: producto.stock
            });
        }
        
        this.actualizarCarrito();
        this.mostrarNotificacion(`✅ ${producto.nombre} x${cantidad} agregado`);
    },
    
    quitarDelCarrito(productoId) {
        this.carrito = this.carrito.filter(item => item.id !== productoId);
        this.actualizarCarrito();
        this.mostrarNotificacion('🗑️ Producto eliminado');
    },
    
    limpiarCarrito() {
        if (this.carrito.length === 0) return;
        
        if (confirm('¿Cancelar la venta actual?')) {
            this.carrito = [];
            this.actualizarCarrito();
            document.getElementById('currentSalePanel')?.classList.remove('active');
            this.mostrarNotificacion('🔄 Venta cancelada');
        }
    },
    
    actualizarCarrito() {
        const container = document.getElementById('saleItemsContainer');
        const itemsCount = document.getElementById('saleItemsCount');
        const cartBadge = document.getElementById('cartBadge');
        const carritoCount = document.getElementById('carritoCount');
        const subtotalSpan = document.getElementById('subtotal');
        const totalSpan = document.getElementById('total');
        
        let subtotal = 0;
        
        if (this.carrito.length === 0) {
            if (container) container.innerHTML = '<div class="empty-message">No hay productos en la venta actual</div>';
            if (itemsCount) itemsCount.textContent = '(0 productos)';
            if (cartBadge) {
                cartBadge.textContent = '0';
                cartBadge.style.display = 'none';
            }
            if (carritoCount) carritoCount.textContent = '0';
            if (subtotalSpan) subtotalSpan.textContent = '$0.00';
            if (totalSpan) totalSpan.textContent = '$0.00';
            return;
        }
        
        let html = '';
        this.carrito.forEach(item => {
            const itemSubtotal = item.precio * item.cantidad;
            subtotal += itemSubtotal;
            
            html += `
                <div class="sale-item">
                    <div>${item.nombre}</div>
                    <div>$${item.precio.toFixed(2)}</div>
                    <div>${item.cantidad}</div>
                    <div>$${itemSubtotal.toFixed(2)}</div>
                    <div>
                        <button class="remove-item-btn" onclick="App.quitarDelCarrito('${item.id}')">✖</button>
                    </div>
                </div>
            `;
        });
        
        if (container) container.innerHTML = html;
        if (itemsCount) itemsCount.textContent = `(${this.carrito.reduce((sum, i) => sum + i.cantidad, 0)} productos)`;
        if (cartBadge) {
            cartBadge.textContent = this.carrito.reduce((sum, i) => sum + i.cantidad, 0);
            cartBadge.style.display = 'flex';
        }
        if (carritoCount) carritoCount.textContent = this.carrito.reduce((sum, i) => sum + i.cantidad, 0);
        if (subtotalSpan) subtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
        if (totalSpan) totalSpan.textContent = `$${subtotal.toFixed(2)}`;
    },
    
    async completarVenta() {
        if (this.carrito.length === 0) {
            this.mostrarNotificacion('❌ No hay productos en la venta');
            return;
        }
        
        const cliente = document.getElementById('clientName')?.value.trim() || 'Cliente General';
        const total = this.carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
        const fecha = new Date();
        
        const venta = {
            id: Date.now().toString(),
            cliente: cliente,
            productos: [...this.carrito],
            total: total,
            fecha: fecha.toISOString(),
            vendedora: this.usuario?.nombre || 'Vendedora',
            vendedoraId: this.usuario?.id || '',
            estado: 'completada'
        };
        
        this.ventas.push(venta);
        localStorage.setItem('ventas_vendedora', JSON.stringify(this.ventas));
        
        const ventasHoy = document.getElementById('ventasHoyCount');
        if (ventasHoy) ventasHoy.textContent = parseInt(ventasHoy.textContent || 0) + 1;
        
        this.mostrarNotificacion(`✅ Venta completada: $${total.toFixed(2)}`);
        
        this.carrito = [];
        this.actualizarCarrito();
        document.getElementById('currentSalePanel')?.classList.remove('active');
        const clientName = document.getElementById('clientName');
        if (clientName) clientName.value = '';
        
        this.cargarVentasRecientes();
        this.cargarTodasLasVentas();
        this.actualizarDashboard();
    },
    
    cargarVentas() {
        const ventasGuardadas = localStorage.getItem('ventas_vendedora');
        if (ventasGuardadas) {
            try {
                this.ventas = JSON.parse(ventasGuardadas);
            } catch (e) {
                this.ventas = [];
            }
        }
        this.cargarVentasRecientes();
        this.actualizarDashboard();
    },
    
    cargarVentasRecientes() {
        const container = document.getElementById('ventasRecientesContainer');
        if (!container) return;
        
        if (this.ventas.length === 0) {
            container.innerHTML = '<div class="empty-message" style="padding: 1.5rem;">No hay ventas registradas aún</div>';
            return;
        }
        
        const recientes = [...this.ventas].reverse().slice(0, 5);
        
        let html = '';
        recientes.forEach(v => {
            const fecha = new Date(v.fecha);
            const fechaStr = fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
            
            html += `
                <div class="history-item">
                    <div>
                        <div style="font-weight: 600;">${v.cliente}</div>
                        <div style="font-size: 0.75rem; color: #666;">${fechaStr}</div>
                    </div>
                    <div>${v.productos.reduce((sum, i) => sum + i.cantidad, 0)} productos</div>
                    <div style="font-weight: bold; color: var(--accent-color);">$${v.total.toFixed(2)}</div>
                    <div><span class="status status-completed">Completada</span></div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    cargarTodasLasVentas() {
        const container = document.getElementById('allSalesContainer');
        const totalSalesAmount = document.getElementById('totalSalesAmount');
        const avgSaleAmount = document.getElementById('avgSaleAmount');
        const totalSalesCount = document.getElementById('totalSalesCount');
        
        if (this.ventas.length === 0) {
            if (container) container.innerHTML = '<div class="empty-message">No hay ventas registradas</div>';
            if (totalSalesAmount) totalSalesAmount.textContent = '$0.00';
            if (avgSaleAmount) avgSaleAmount.textContent = '$0.00';
            if (totalSalesCount) totalSalesCount.textContent = '0';
            return;
        }
        
        const total = this.ventas.reduce((sum, v) => sum + v.total, 0);
        const promedio = total / this.ventas.length;
        
        if (totalSalesAmount) totalSalesAmount.textContent = `$${total.toFixed(2)}`;
        if (avgSaleAmount) avgSaleAmount.textContent = `$${promedio.toFixed(2)}`;
        if (totalSalesCount) totalSalesCount.textContent = this.ventas.length;
        
        let html = '';
        [...this.ventas].reverse().forEach(v => {
            const fecha = new Date(v.fecha);
            const fechaStr = fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
            
            html += `
                <div class="history-item">
                    <div>
                        <div style="font-weight: 600;">${v.cliente}</div>
                        <div style="font-size: 0.75rem; color: #666;">${fechaStr}</div>
                    </div>
                    <div>${v.productos.reduce((sum, i) => sum + i.cantidad, 0)} productos</div>
                    <div style="font-weight: bold; color: var(--accent-color);">$${v.total.toFixed(2)}</div>
                    <div><span class="status status-completed">Completada</span></div>
                </div>
            `;
        });
        
        if (container) container.innerHTML = html;
    },
    
    cargarInventario() {
        const tableBody = document.getElementById('inventoryTableBody');
        const lowStockSpan = document.getElementById('lowStockCount');
        const outOfStockSpan = document.getElementById('outOfStockCount');
        
        if (this.productos.length === 0) {
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #7f8c8d;">No hay productos en el inventario</td></tr>';
            return;
        }
        
        const lowStock = this.productos.filter(p => p.stock > 0 && p.stock < 5).length;
        const outOfStock = this.productos.filter(p => p.stock === 0).length;
        
        if (lowStockSpan) lowStockSpan.textContent = lowStock;
        if (outOfStockSpan) outOfStockSpan.textContent = outOfStock;
        
        let html = '';
        this.productos.forEach(p => {
            let estado = 'Disponible';
            let estadoClass = '';
            
            if (p.stock === 0) {
                estado = 'Agotado';
                estadoClass = 'status-danger';
            } else if (p.stock < 5) {
                estado = 'Stock Bajo';
                estadoClass = 'status-warning';
            }
            
            html += `
                <tr>
                    <td>${p.nombre}</td>
                    <td>${p.categoria || 'General'}</td>
                    <td>$${p.precio.toFixed(2)}</td>
                    <td>${p.stock}</td>
                    <td><span class="${estadoClass}">${estado}</span></td>
                </tr>
            `;
        });
        
        if (tableBody) tableBody.innerHTML = html;
    },
    
    setupReportes() {
        const reportDate = document.getElementById('reportDate');
        const generateBtn = document.getElementById('generateReportBtn');
        const exportPDFBtn = document.getElementById('exportPDFBtn');
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        const exportInventoryBtn = document.getElementById('exportInventoryBtn');
        const refreshInventoryBtn = document.getElementById('refreshInventoryBtn');
        
        const hoy = new Date().toISOString().split('T')[0];
        if (reportDate) reportDate.value = hoy;
        
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generarReporte(reportDate?.value || hoy);
            });
        }
        
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => {
                this.mostrarNotificacion('📄 Exportando a PDF... (simulado)');
                setTimeout(() => this.mostrarNotificacion('✅ PDF exportado'), 1500);
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => {
                this.mostrarNotificacion('📊 Exportando a Excel... (simulado)');
                setTimeout(() => this.mostrarNotificacion('✅ Excel exportado'), 1500);
            });
        }
        
        if (exportInventoryBtn) {
            exportInventoryBtn.addEventListener('click', () => {
                this.mostrarNotificacion('📤 Exportando inventario... (simulado)');
                setTimeout(() => this.mostrarNotificacion('✅ Inventario exportado'), 1500);
            });
        }
        
        if (refreshInventoryBtn) {
            refreshInventoryBtn.addEventListener('click', () => {
                this.cargarProductos();
                this.mostrarNotificacion('🔄 Inventario actualizado');
            });
        }
    },
    
    generarReporte(fecha) {
        const dailyTotal = document.getElementById('dailyTotal');
        const dailySalesCount = document.getElementById('dailySalesCount');
        const dailyAvg = document.getElementById('dailyAvg');
        const categorySales = document.getElementById('categorySales');
        const bestProduct = document.getElementById('bestProduct');
        const bestHour = document.getElementById('bestHour');
        const topCategory = document.getElementById('topCategory');
        
        const ventasDelDia = this.ventas.filter(v => {
            return v.fecha.split('T')[0] === fecha;
        });
        
        if (ventasDelDia.length === 0) {
            if (dailyTotal) dailyTotal.textContent = '$0.00';
            if (dailySalesCount) dailySalesCount.textContent = '0';
            if (dailyAvg) dailyAvg.textContent = '$0.00';
            if (categorySales) categorySales.innerHTML = '<div class="empty-message">No hay ventas en esta fecha</div>';
            if (bestProduct) bestProduct.textContent = '-';
            if (bestHour) bestHour.textContent = '-';
            if (topCategory) topCategory.textContent = '-';
            return;
        }
        
        const total = ventasDelDia.reduce((sum, v) => sum + v.total, 0);
        const promedio = total / ventasDelDia.length;
        
        if (dailyTotal) dailyTotal.textContent = `$${total.toFixed(2)}`;
        if (dailySalesCount) dailySalesCount.textContent = ventasDelDia.length;
        if (dailyAvg) dailyAvg.textContent = `$${promedio.toFixed(2)}`;
        
        if (categorySales) {
            categorySales.innerHTML = `
                <div class="category-sale-item">
                    <span>Ropa</span>
                    <span style="font-weight: bold;">$0.00</span>
                </div>
                <div class="category-sale-item">
                    <span>Electrónica</span>
                    <span style="font-weight: bold;">$0.00</span>
                </div>
            `;
        }
        
        if (bestProduct) bestProduct.textContent = this.productos[0]?.nombre || '-';
        if (bestHour) bestHour.textContent = '15:00 - 17:00';
        if (topCategory) topCategory.textContent = 'Ropa';
        
        this.mostrarNotificacion(`📊 Reporte generado para ${fecha}`);
    },
    
    actualizarDashboard() {
        const pendienteCount = document.getElementById('pendienteCount');
        if (pendienteCount) pendienteCount.textContent = this.ventas.length;
        
        const totalProductosSpan = document.getElementById('totalProductosCount');
        if (totalProductosSpan) totalProductosSpan.textContent = this.productos.length;
    },
    
    actualizarInfoUsuario() {
        if (!this.usuario) return;
        
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = this.usuario.nombre || 'Vendedora';
        if (userAvatar) userAvatar.textContent = (this.usuario.nombre?.charAt(0) || 'V').toUpperCase();
    },
    
    setupEventListeners() {
        document.getElementById('btnLogin')?.addEventListener('click', () => this.login());
        
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && document.getElementById('loginPanel')?.style.display !== 'none') {
                this.login();
            }
        });
    },
    
    mostrarNotificacion(mensaje) {
        const notif = document.getElementById('notification');
        if (notif) {
            notif.style.display = 'block';
            notif.textContent = mensaje;
            setTimeout(() => {
                notif.style.display = 'none';
            }, 3000);
        }
    },
    
    showLoginPanel() {
        const loginPanel = document.getElementById('loginPanel');
        const ventaPanel = document.getElementById('ventaPanel');
        const status = document.getElementById('serverStatus');
        
        if (loginPanel) {
            loginPanel.style.display = 'block';
            setTimeout(() => loginPanel.classList.add('visible'), 50);
        }
        if (ventaPanel) ventaPanel.style.display = 'none';
        if (status) status.style.display = 'block';
    },
    
    showVentaPanel() {
        const loginPanel = document.getElementById('loginPanel');
        const ventaPanel = document.getElementById('ventaPanel');
        
        if (loginPanel) {
            loginPanel.style.display = 'none';
            loginPanel.classList.remove('visible');
        }
        if (ventaPanel) ventaPanel.style.display = 'block';
    },
    
    showError(message, type = 'error') {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            if (type === 'clear') {
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
            } else {
                errorDiv.style.display = 'block';
                errorDiv.textContent = message;
            }
        }
    }
};

// Hacer App accesible globalmente
window.App = App;

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});