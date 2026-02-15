// ===========================================
// APP VENDEDORA - VERSIÓN SIMPLIFICADA
// CON LA MISMA LÓGICA QUE FUNCIONABA ANTES
// ===========================================

const API_URL = 'https://sistema-test-api.onrender.com';

// ========== APP VENDEDORA SIMPLIFICADA ==========
const App = {
    usuario: null,
    currentPage: 'dashboard',
    productos: [],
    categorias: [],
    carrito: [],
    ventas: [],
    ventasPendientes: [],
    categoriaActiva: 'todos',
    online: navigator.onLine,
    sincronizando: false,
    
    async init() {
        console.log('🚀 Iniciando App Vendedora (versión simplificada)');
        
        this.setupConnectionListener();
        await this.cargarCategoriasLocales();
        await this.cargarProductosLocales();
        
        this.hideSplashScreen();
        this.checkLogin();
        this.setupEventListeners();
        this.verificarConexion();
        this.setupNavigation();
        this.setupFloatingButton();
        this.setupSearchAndFilters();
    },
    
    // ===== ESTADO DE CONEXIÓN =====
    setupConnectionListener() {
        window.addEventListener('online', () => {
            this.online = true;
            this.actualizarEstadoConexion();
            this.mostrarNotificacion('📶 Conexión restablecida');
            this.sincronizarTodo();
        });
        
        window.addEventListener('offline', () => {
            this.online = false;
            this.actualizarEstadoConexion();
            this.mostrarNotificacion('📴 Sin conexión - Modo offline');
        });
    },
    
    actualizarEstadoConexion() {
        const dot = document.getElementById('connectionDot');
        if (!dot) return;
        
        dot.className = 'connection-dot';
        
        if (this.sincronizando) {
            dot.classList.add('syncing');
        } else if (this.online) {
            dot.classList.add('online');
        } else {
            dot.classList.add('offline');
        }
    },
    
    async verificarConexion() {
        if (!this.online) return;
        
        this.sincronizando = true;
        this.actualizarEstadoConexion();
        
        try {
            await fetch(API_URL);
            await this.sincronizarTodo();
        } catch (error) {
            console.log('❌ Error de conexión');
        } finally {
            this.sincronizando = false;
            this.actualizarEstadoConexion();
        }
    },
    
    async sincronizarTodo() {
        if (!this.online || !this.usuario) return;
        
        try {
            await this.cargarCategoriasDelServidor();
            await this.cargarProductosDelServidor();
            await this.sincronizarVentasPendientes();
        } catch (error) {
            console.error('Error en sincronización:', error);
        }
    },
    
    // ===== CATEGORÍAS =====
    async cargarCategoriasDelServidor() {
        try {
            const response = await fetch(`${API_URL}/api/categorias`);
            this.categorias = await response.json();
            localStorage.setItem('categorias', JSON.stringify(this.categorias));
            this.actualizarFiltrosCategorias();
            return this.categorias;
        } catch (error) {
            console.error('Error cargando categorías:', error);
            return this.cargarCategoriasLocales();
        }
    },
    
    async cargarCategoriasLocales() {
        const cats = localStorage.getItem('categorias');
        if (cats) {
            this.categorias = JSON.parse(cats);
            this.actualizarFiltrosCategorias();
        }
        return this.categorias;
    },
    
    actualizarFiltrosCategorias() {
        const filterContainer = document.getElementById('categoryFilterContainer');
        if (!filterContainer) return;
        
        let html = '<button class="category-btn active" data-category="todos">Todos</button>';
        this.categorias.forEach(c => {
            if (c.activa !== false) {
                html += `<button class="category-btn" data-category="${c.id}">${c.nombre}</button>`;
            }
        });
        filterContainer.innerHTML = html;
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.categoriaActiva = btn.dataset.category;
                this.filtrarProductos(document.getElementById('searchInput')?.value.toLowerCase() || '', this.categoriaActiva);
            });
        });
    },
    
    obtenerNombreCategoria(categoriaId) {
        if (!categoriaId) return 'Sin categoría';
        const cat = this.categorias.find(c => c.id === categoriaId);
        return cat ? cat.nombre : 'Sin categoría';
    },
    
    // ===== PRODUCTOS (VERSIÓN QUE FUNCIONABA) =====
    async cargarProductosDelServidor() {
        try {
            const response = await fetch(`${API_URL}/api/productos`);
            const productos = await response.json();
            
            // Guardar en localStorage
            localStorage.setItem('productos', JSON.stringify(productos));
            
            this.productos = productos;
            
            if (this.usuario) {
                this.renderizarProductos();
                this.cargarInventario();
            }
            
            return productos;
        } catch (error) {
            console.error('Error cargando productos del servidor:', error);
            return this.cargarProductosLocales();
        }
    },
    
    async cargarProductosLocales() {
        const prods = localStorage.getItem('productos');
        if (prods) {
            this.productos = JSON.parse(prods);
            if (this.usuario) {
                this.renderizarProductos();
                this.cargarInventario();
            }
        }
        return this.productos;
    },
    
    renderizarProductos() {
        const container = document.getElementById('productoContainer');
        if (!container) return;
        
        if (this.productos.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay productos disponibles</div>';
            return;
        }
        
        let html = '';
        this.productos.forEach(p => {
            const disabled = p.stock === 0 ? 'disabled' : '';
            const maxStock = p.stock;
            const categoriaNombre = this.obtenerNombreCategoria(p.categoria);
            
            html += `
                <div class="product-card" data-producto-id="${p.id}" data-categoria="${p.categoria || 'general'}">
                    <div class="product-icon">📦</div>
                    <div class="product-name">${p.nombre}</div>
                    <div style="font-size:0.7rem; color:#666;">🏷️ ${categoriaNombre}</div>
                    <div class="product-price">$${p.precio.toFixed(2)}</div>
                    <div class="product-stock">Stock: ${p.stock} uds</div>
                    <div class="product-actions">
                        <input type="number" id="cantidad-${p.id}" class="quantity-input" value="1" min="1" max="${maxStock}" ${disabled}>
                        <button class="add-to-sale-btn" onclick="App.agregarAlCarrito('${p.id}')" ${disabled}>
                            🛒 Agregar
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        this.cargarInventario();
    },
    
    // ===== CARRITO Y VENTAS (VERSIÓN QUE FUNCIONABA) =====
    agregarAlCarrito(productoId) {
        console.log('🔍 Buscando producto:', productoId);
        console.log('📦 Productos disponibles:', this.productos.map(p => ({ id: p.id, nombre: p.nombre })));
        
        const producto = this.productos.find(p => p.id === productoId);
        
        if (!producto) {
            console.error('❌ Producto no encontrado');
            this.mostrarNotificacion('❌ Producto no encontrado');
            return;
        }
        
        console.log('✅ Producto encontrado:', producto.nombre);
        
        const cantidadInput = document.getElementById(`cantidad-${productoId}`);
        const cantidad = parseInt(cantidadInput?.value || '1');
        
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
                cantidad: cantidad
            });
        }
        
        this.actualizarCarrito();
        this.mostrarNotificacion(`✅ ${producto.nombre} x${cantidad} agregado`);
    },
    
    quitarDelCarrito(productoId) {
        this.carrito = this.carrito.filter(item => item.id !== productoId);
        this.actualizarCarrito();
    },
    
    limpiarCarrito() {
        if (this.carrito.length === 0) return;
        if (confirm('¿Cancelar la venta actual?')) {
            this.carrito = [];
            this.actualizarCarrito();
            document.getElementById('currentSalePanel')?.classList.remove('active');
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
            if (container) container.innerHTML = '<div class="empty-message">No hay productos</div>';
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
            this.mostrarNotificacion('❌ No hay productos');
            return;
        }
        
        const cliente = document.getElementById('clientName')?.value.trim() || 'Cliente General';
        const total = this.carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
        
        for (const item of this.carrito) {
            const producto = this.productos.find(p => p.id === item.id);
            if (!producto || item.cantidad > producto.stock) {
                this.mostrarNotificacion(`❌ Stock insuficiente para ${item.nombre}`);
                return;
            }
        }
        
        const venta = {
            id: Date.now().toString(),
            cliente: cliente,
            productos: [...this.carrito],
            total: total,
            fecha: new Date().toISOString(),
            vendedora: this.usuario?.nombre || 'Vendedora',
            vendedoraId: this.usuario?.id || '',
            estado: this.online ? 'completada' : 'pendiente'
        };
        
        if (this.online) {
            // Venta online - actualizar stock en servidor
            let exito = true;
            
            for (const item of this.carrito) {
                const producto = this.productos.find(p => p.id === item.id);
                if (!producto) continue;
                
                try {
                    await fetch(`${API_URL}/api/dueno/productos/${item.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            stock: producto.stock - item.cantidad
                        })
                    });
                    
                    producto.stock -= item.cantidad;
                } catch (error) {
                    exito = false;
                    break;
                }
            }
            
            if (exito) {
                this.ventas.push(venta);
                localStorage.setItem('ventas', JSON.stringify(this.ventas));
                this.renderizarProductos();
                this.mostrarNotificacion(`✅ Venta completada: $${total.toFixed(2)}`);
            }
        } else {
            // Venta offline
            this.ventasPendientes.push(venta);
            localStorage.setItem('ventas_pendientes', JSON.stringify(this.ventasPendientes));
            this.mostrarNotificacion(`⏳ Venta guardada offline`);
        }
        
        this.carrito = [];
        this.actualizarCarrito();
        document.getElementById('currentSalePanel')?.classList.remove('active');
        document.getElementById('clientName').value = '';
    },
    
    async sincronizarVentasPendientes() {
        if (!this.online || !this.usuario) return;
        
        const pendientes = this.ventasPendientes;
        if (pendientes.length === 0) return;
        
        let sincronizadas = 0;
        
        for (const venta of pendientes) {
            try {
                for (const item of venta.productos) {
                    await fetch(`${API_URL}/api/dueno/productos/${item.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            stock: 0 // Simplificado
                        })
                    });
                }
                
                venta.estado = 'completada';
                this.ventas.push(venta);
                sincronizadas++;
            } catch (error) {
                console.error('Error sincronizando venta:', error);
            }
        }
        
        this.ventasPendientes = [];
        localStorage.setItem('ventas', JSON.stringify(this.ventas));
        localStorage.setItem('ventas_pendientes', '[]');
        
        if (sincronizadas > 0) {
            this.mostrarNotificacion(`✅ ${sincronizadas} ventas sincronizadas`);
        }
    },
    
    // ===== SPLASH SCREEN =====
    hideSplashScreen() {
        setTimeout(() => {
            document.getElementById('splashScreen')?.classList.add('hidden');
            setTimeout(() => {
                document.getElementById('splashScreen').style.display = 'none';
                document.getElementById('loginPanel')?.classList.add('visible');
            }, 500);
        }, 2000);
    },
    
    // ===== LOGIN =====
    checkLogin() {
        const savedUser = localStorage.getItem('vendedora_activa');
        if (savedUser) {
            try {
                this.usuario = JSON.parse(savedUser);
                this.showVentaPanel();
                this.cargarProductosLocales();
                this.cargarCategoriasLocales();
                this.cargarVentasLocales();
                this.actualizarInfoUsuario();
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
            this.showError('Usuario y contraseña obligatorios');
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
                await this.cargarCategoriasDelServidor();
                await this.cargarProductosDelServidor();
                await this.cargarVentasLocales();
                
                this.showError('', 'clear');
                this.mostrarNotificacion(`✅ Bienvenida, ${this.usuario.nombre}`);
            } else {
                this.showError(data.error || 'Credenciales incorrectas');
            }
        } catch (error) {
            this.showError('Error de conexión');
        } finally {
            btn.disabled = false;
            btn.textContent = '🔑 Iniciar Sesión';
        }
    },
    
    logout() {
        localStorage.removeItem('vendedora_activa');
        this.usuario = null;
        this.carrito = [];
        this.showLoginPanel();
    },
    
    cargarVentasLocales() {
        const ventas = localStorage.getItem('ventas');
        if (ventas) this.ventas = JSON.parse(ventas);
        
        const pendientes = localStorage.getItem('ventas_pendientes');
        if (pendientes) this.ventasPendientes = JSON.parse(pendientes);
    },
    
    // ===== NAVEGACIÓN =====
    setupNavigation() {
        document.querySelectorAll('#ventaPanel .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchPage(item.dataset.page);
            });
        });
        
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('userAvatar')?.addEventListener('click', () => this.logout());
    },
    
    switchPage(page) {
        document.querySelectorAll('#ventaPanel .nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) item.classList.add('active');
        });
        
        document.querySelectorAll('#ventaPanel .page-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(`${page}Section`).classList.add('active');
        this.currentPage = page;
        
        if (page === 'products') this.cargarInventario();
        else if (page === 'sales') this.cargarTodasLasVentas();
    },
    
    // ===== BÚSQUEDA =====
    setupSearchAndFilters() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        const performSearch = () => {
            this.filtrarProductos(searchInput.value.toLowerCase(), this.categoriaActiva);
        };
        
        searchInput?.addEventListener('input', performSearch);
        searchBtn?.addEventListener('click', performSearch);
    },
    
    filtrarProductos(termino, categoria = 'todos') {
        document.querySelectorAll('#productoContainer .product-card').forEach(card => {
            const nombre = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
            const categoriaProd = card.dataset.categoria || 'general';
            
            let mostrar = true;
            if (termino && !nombre.includes(termino)) mostrar = false;
            if (categoria !== 'todos' && categoriaProd !== categoria) mostrar = false;
            
            card.style.display = mostrar ? 'block' : 'none';
        });
    },
    
    // ===== BOTÓN FLOTANTE =====
    setupFloatingButton() {
        const floatingBtn = document.getElementById('floatingSaleBtn');
        const closeBtn = document.getElementById('closeSaleBtn');
        const panel = document.getElementById('currentSalePanel');
        const ventaActualCard = document.getElementById('ventaActualCard');
        
        floatingBtn?.addEventListener('click', () => panel?.classList.toggle('active'));
        closeBtn?.addEventListener('click', () => panel?.classList.remove('active'));
        ventaActualCard?.addEventListener('click', () => panel?.classList.toggle('active'));
        
        document.getElementById('clearSaleBtn')?.addEventListener('click', () => this.limpiarCarrito());
        document.getElementById('completeSaleBtn')?.addEventListener('click', () => this.completarVenta());
    },
    
    // ===== INVENTARIO =====
    cargarInventario() {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;
        
        if (this.productos.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Sin productos</td></tr>';
            return;
        }
        
        let html = '';
        this.productos.forEach(p => {
            const catNombre = this.obtenerNombreCategoria(p.categoria);
            let estado = 'Disponible';
            if (p.stock === 0) estado = 'Agotado';
            else if (p.stock < 5) estado = 'Stock Bajo';
            
            html += `<tr><td>${p.nombre}</td><td>${catNombre}</td><td>$${p.precio.toFixed(2)}</td><td>${p.stock}</td><td>${estado}</td></tr>`;
        });
        
        tableBody.innerHTML = html;
    },
    
    cargarTodasLasVentas() {
        const container = document.getElementById('allSalesContainer');
        if (!container) return;
        
        if (this.ventas.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay ventas</div>';
            return;
        }
        
        let html = '';
        [...this.ventas].reverse().forEach(v => {
            const fecha = new Date(v.fecha).toLocaleString();
            html += `
                <div class="history-item">
                    <div>${v.cliente}<br><small>${fecha}</small></div>
                    <div>${v.productos.length} productos</div>
                    <div>$${v.total.toFixed(2)}</div>
                    <div>Completada</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    // ===== UTILIDADES =====
    mostrarNotificacion(msg) {
        const n = document.getElementById('notification');
        if (n) {
            n.style.display = 'block';
            n.textContent = msg;
            setTimeout(() => n.style.display = 'none', 3000);
        }
    },
    
    showLoginPanel() {
        document.getElementById('loginPanel').style.display = 'block';
        document.getElementById('ventaPanel').style.display = 'none';
    },
    
    showVentaPanel() {
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('ventaPanel').style.display = 'block';
    },
    
    actualizarInfoUsuario() {
        if (!this.usuario) return;
        document.getElementById('userName').textContent = this.usuario.nombre;
        document.getElementById('userAvatar').textContent = this.usuario.nombre?.charAt(0) || 'V';
    },
    
    setupEventListeners() {
        document.getElementById('btnLogin')?.addEventListener('click', () => this.login());
        document.addEventListener('keypress', e => {
            if (e.key === 'Enter' && document.getElementById('loginPanel').style.display !== 'none') this.login();
        });
    },
    
    showError(msg, type) {
        const err = document.getElementById('loginError');
        if (!err) return;
        if (type === 'clear') {
            err.style.display = 'none';
            err.textContent = '';
        } else {
            err.style.display = 'block';
            err.textContent = msg;
        }
    }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
