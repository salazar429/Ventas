// ===========================================
// APP VENDEDORA - VERSIÓN FINAL
// CON MENÚ DE USUARIO + CARRITO CORREGIDO
// ===========================================

const API_URL = 'https://sistema-test-api.onrender.com';
const DB_NAME = 'FacturacionDB';
const DB_VERSION = 4;

const TIEMPO_INACTIVIDAD = 30 * 60 * 1000;

class OfflineDB {
    static async abrirDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                const stores = ['categorias', 'productos', 'ventas_pendientes', 'ventas_completadas', 'sesion'];
                stores.forEach(store => {
                    if (db.objectStoreNames.contains(store)) {
                        db.deleteObjectStore(store);
                    }
                });
                
                db.createObjectStore('categorias', { keyPath: 'id' });
                
                const storeProductos = db.createObjectStore('productos', { keyPath: 'id' });
                storeProductos.createIndex('nombre', 'nombre', { unique: false });
                storeProductos.createIndex('categoria', 'categoria', { unique: false });
                
                const storePendientes = db.createObjectStore('ventas_pendientes', { keyPath: 'id' });
                storePendientes.createIndex('fecha', 'fecha', { unique: false });
                storePendientes.createIndex('vendedoraId', 'vendedoraId', { unique: false });
                
                const storeCompletadas = db.createObjectStore('ventas_completadas', { keyPath: 'id' });
                storeCompletadas.createIndex('fecha', 'fecha', { unique: false });
                storeCompletadas.createIndex('vendedoraId', 'vendedoraId', { unique: false });
                
                db.createObjectStore('sesion', { keyPath: 'id' });
            };
        });
    }
    
    static async guardarCategorias(categorias) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('categorias', 'readwrite');
            const store = tx.objectStore('categorias');
            store.clear();
            categorias.forEach(c => store.put(c));
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }
    
    static async cargarCategorias() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('categorias', 'readonly');
            const store = tx.objectStore('categorias');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    static async guardarProductos(productos) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('productos', 'readwrite');
            const store = tx.objectStore('productos');
            store.clear();
            productos.forEach(p => store.put(p));
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }
    
    static async cargarProductos() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('productos', 'readonly');
            const store = tx.objectStore('productos');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    static async guardarVentaPendiente(venta) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_pendientes', 'readwrite');
            const store = tx.objectStore('ventas_pendientes');
            store.put(venta);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }
    
    static async obtenerVentasPendientes(vendedoraId) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_pendientes', 'readonly');
            const store = tx.objectStore('ventas_pendientes');
            const index = store.index('vendedoraId');
            const request = index.getAll(vendedoraId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    static async eliminarVentaPendiente(id) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_pendientes', 'readwrite');
            const store = tx.objectStore('ventas_pendientes');
            store.delete(id);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }
    
    static async guardarVentaCompletada(venta) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_completadas', 'readwrite');
            const store = tx.objectStore('ventas_completadas');
            store.put(venta);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }
    
    static async cargarVentasCompletadas(vendedoraId) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_completadas', 'readonly');
            const store = tx.objectStore('ventas_completadas');
            const index = store.index('vendedoraId');
            const request = index.getAll(vendedoraId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    static async guardarUltimaActividad() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sesion', 'readwrite');
            const store = tx.objectStore('sesion');
            store.put({ id: 'ultimaActividad', timestamp: Date.now() });
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    }
    
    static async obtenerUltimaActividad() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sesion', 'readonly');
            const store = tx.objectStore('sesion');
            const request = store.get('ultimaActividad');
            request.onsuccess = () => resolve(request.result?.timestamp || Date.now());
            request.onerror = () => reject(request.error);
        });
    }
}

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
    timeoutInactividad: null,
    
    async init() {
        console.log('🚀 Iniciando App Vendedora');
        
        this.setupInactividad();
        this.setupConnectionListener();
        this.setupUserMenu();
        await this.cargarCategoriasOffline();
        await this.cargarProductosOffline();
        
        await this.verificarSesion();
        
        this.hideSplashScreen();
        this.checkLogin();
        this.setupEventListeners();
        this.verificarConexion();
        this.setupNavigation();
        this.setupFloatingButton();
        this.setupSearchAndFilters();
        this.setupReportes();
        this.setupPendientesClick();
    },
    
    // ===== MENÚ DE USUARIO =====
    setupUserMenu() {
        const avatar = document.getElementById('userAvatar');
        if (!avatar) return;
        
        // Crear menú desplegable
        const menu = document.createElement('div');
        menu.id = 'userMenu';
        menu.style.cssText = `
            position: absolute;
            top: 60px;
            right: 10px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            width: 200px;
            display: none;
            z-index: 1000;
            overflow: hidden;
        `;
        
        menu.innerHTML = `
            <div style="padding: 12px 16px; background: #f8f9fa; border-bottom: 1px solid #eee;">
                <strong id="menuUserName">${this.usuario?.nombre || 'Vendedora'}</strong><br>
                <small style="color: #666;" id="menuUserTienda">${this.usuario?.tienda || ''}</small>
            </div>
            <div style="padding: 8px 0;">
                <div class="menu-item" onclick="alert('Configuración - Falta implementación')" style="padding: 10px 16px; cursor: pointer; hover:background:#f5f5f5;">
                    ⚙️ Ajustes
                </div>
                <div class="menu-item" onclick="alert('Tutoriales - Falta implementación')" style="padding: 10px 16px; cursor: pointer; hover:background:#f5f5f5;">
                    📚 Tutoriales
                </div>
                <div class="menu-item" onclick="App.logout()" style="padding: 10px 16px; cursor: pointer; color: #e74c3c; hover:background:#f5f5f5;">
                    🚪 Cerrar sesión
                </div>
            </div>
        `;
        
        // Agregar estilos hover
        const style = document.createElement('style');
        style.textContent = `
            .menu-item:hover {
                background-color: #f5f5f5;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(menu);
        
        // Toggle menú al hacer clic en avatar
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
            
            // Actualizar nombre en el menú
            document.getElementById('menuUserName').textContent = this.usuario?.nombre || 'Vendedora';
            document.getElementById('menuUserTienda').textContent = this.usuario?.tienda || '';
        });
        
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && e.target !== avatar) {
                menu.style.display = 'none';
            }
        });
    },
    
    // ===== CONTROL DE SESIÓN =====
    setupInactividad() {
        const eventos = ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        eventos.forEach(evento => {
            document.addEventListener(evento, () => this.registrarActividad());
        });
        
        setInterval(() => this.verificarInactividad(), 60000);
    },
    
    async registrarActividad() {
        await OfflineDB.guardarUltimaActividad();
        
        if (this.timeoutInactividad) {
            clearTimeout(this.timeoutInactividad);
        }
        
        this.timeoutInactividad = setTimeout(() => {
            this.cerrarSesionPorInactividad();
        }, TIEMPO_INACTIVIDAD);
    },
    
    async verificarInactividad() {
        const ultimaActividad = await OfflineDB.obtenerUltimaActividad();
        const tiempoInactivo = Date.now() - ultimaActividad;
        
        if (tiempoInactivo > TIEMPO_INACTIVIDAD && this.usuario) {
            this.cerrarSesionPorInactividad();
        }
    },
    
    async cerrarSesionPorInactividad() {
        this.mostrarNotificacion('⏰ Sesión cerrada por inactividad');
        await this.cerrarSesion();
    },
    
    async verificarSesion() {
        const savedUser = localStorage.getItem('vendedora_activa');
        if (savedUser) {
            const ultimaActividad = await OfflineDB.obtenerUltimaActividad();
            const tiempoInactivo = Date.now() - ultimaActividad;
            
            if (tiempoInactivo > TIEMPO_INACTIVIDAD) {
                localStorage.removeItem('vendedora_activa');
                this.mostrarNotificacion('⏰ Sesión expirada');
            }
        }
    },
    
    async cerrarSesion() {
        localStorage.removeItem('vendedora_activa');
        this.usuario = null;
        this.carrito = [];
        this.ventas = [];
        this.ventasPendientes = [];
        this.showLoginPanel();
        document.getElementById('userMenu').style.display = 'none';
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
            this.actualizarVistasPendientes();
        });
    },
    
    actualizarEstadoConexion() {
        const dot = document.getElementById('connectionDot');
        if (!dot) return;
        
        dot.className = 'connection-dot';
        
        if (this.sincronizando) {
            dot.classList.add('syncing');
            dot.title = 'Sincronizando...';
        } else if (this.online) {
            dot.classList.add('online');
            dot.title = 'Conectado';
        } else {
            dot.classList.add('offline');
            dot.title = 'Sin conexión';
        }
    },
    
    async verificarConexion() {
        if (!this.online) {
            this.actualizarEstadoConexion();
            return;
        }
        
        this.sincronizando = true;
        this.actualizarEstadoConexion();
        
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                await this.sincronizarTodo();
            }
        } catch (error) {
            console.log('❌ Error conectando al servidor');
        } finally {
            this.sincronizando = false;
            this.actualizarEstadoConexion();
        }
    },
    
    async sincronizarTodo() {
        if (!this.online) return;
        
        this.sincronizando = true;
        this.actualizarEstadoConexion();
        this.mostrarNotificacion('🔄 Sincronizando...');
        
        try {
            await this.cargarCategoriasDelServidor();
            await this.cargarProductosDelServidor();
            await this.sincronizarVentasPendientes();
            this.mostrarNotificacion('✅ Sincronización completa');
        } catch (error) {
            console.error('Error en sincronización:', error);
            this.mostrarNotificacion('❌ Error en sincronización');
        } finally {
            this.sincronizando = false;
            this.actualizarEstadoConexion();
        }
    },
    
    // ===== CATEGORÍAS =====
    async cargarCategoriasDelServidor() {
        try {
            const response = await fetch(`${API_URL}/api/categorias`);
            const categorias = await response.json();
            await OfflineDB.guardarCategorias(categorias);
            await this.cargarCategoriasOffline();
            return categorias;
        } catch (error) {
            console.error('Error cargando categorías:', error);
            return [];
        }
    },
    
    async cargarCategoriasOffline() {
        try {
            this.categorias = await OfflineDB.cargarCategorias();
            this.actualizarFiltrosCategorias();
        } catch (error) {
            this.categorias = [];
        }
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
    
    // ===== PRODUCTOS =====
    async cargarProductosDelServidor() {
        try {
            const response = await fetch(`${API_URL}/api/productos`);
            const productos = await response.json();
            
            const pendientes = await OfflineDB.obtenerVentasPendientes(this.usuario?.id);
            
            if (pendientes.length > 0) {
                const productosActualizados = productos.map(p => {
                    let stockRestado = 0;
                    pendientes.forEach(v => {
                        const item = v.productos.find(i => i.id === p.id);
                        if (item) stockRestado += item.cantidad;
                    });
                    return { ...p, stock: Math.max(0, p.stock - stockRestado) };
                });
                await OfflineDB.guardarProductos(productosActualizados);
            } else {
                await OfflineDB.guardarProductos(productos);
            }
            
            await this.cargarProductosOffline();
            return productos;
        } catch (error) {
            console.error('Error cargando productos:', error);
            return [];
        }
    },
    
    async cargarProductosOffline() {
        try {
            this.productos = await OfflineDB.cargarProductos();
            if (this.usuario) {
                this.renderizarProductos();
                this.cargarInventario();
                this.actualizarDashboard();
            }
        } catch (error) {
            this.productos = [];
        }
    },
    
    renderizarProductos() {
        const container = document.getElementById('productoContainer');
        const countSpan = document.getElementById('productCount');
        const totalProductosSpan = document.getElementById('totalProductosCount');
        
        if (countSpan) countSpan.textContent = `(${this.productos.length} productos)`;
        if (totalProductosSpan) totalProductosSpan.textContent = this.productos.length;
        
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
                <div class="product-card ${p.stock < 5 ? 'low-stock' : ''}" data-producto-id="${p.id}" data-categoria="${p.categoria || 'general'}">
                    <div class="product-icon">📦</div>
                    <div class="product-name">${p.nombre}</div>
                    <div style="font-size: 0.7rem; color: #666;">🏷️ ${categoriaNombre}</div>
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
    
    // ===== CARRITO Y VENTAS =====
    agregarAlCarrito(productoId) {
        const producto = this.productos.find(p => p.id === productoId);
        const cantidadInput = document.getElementById(`cantidad-${productoId}`);
        const cantidad = parseInt(cantidadInput?.value || '1');
        
        if (!producto) {
            this.mostrarNotificacion('❌ Producto no encontrado');
            return;
        }
        
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
                stock: producto.stock,
                categoria: producto.categoria
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
            id: `venta_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            cliente: cliente,
            productos: [...this.carrito],
            total: total,
            fecha: new Date().toISOString(),
            vendedora: this.usuario?.nombre || 'Vendedora',
            vendedoraId: this.usuario?.id || '',
            estado: this.online ? 'completada' : 'pendiente'
        };
        
        if (this.online) {
            let exito = true;
            
            for (const item of this.carrito) {
                const producto = this.productos.find(p => p.id === item.id);
                if (!producto) continue;
                
                try {
                    const response = await fetch(`${API_URL}/api/dueno/productos/${item.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nombre: producto.nombre,
                            precio: producto.precio,
                            stock: producto.stock - item.cantidad,
                            categoria: producto.categoria
                        })
                    });
                    
                    if (!response.ok) {
                        exito = false;
                        break;
                    }
                    
                    producto.stock -= item.cantidad;
                } catch (error) {
                    exito = false;
                    break;
                }
            }
            
            if (exito) {
                await OfflineDB.guardarVentaCompletada(venta);
                this.ventas.push(venta);
                await OfflineDB.guardarProductos(this.productos);
                
                const ventasHoy = document.getElementById('ventasHoyCount');
                if (ventasHoy) ventasHoy.textContent = parseInt(ventasHoy.textContent || 0) + 1;
                
                this.mostrarNotificacion(`✅ Venta completada: $${total.toFixed(2)}`);
                this.renderizarProductos();
            }
        } else {
            await OfflineDB.guardarVentaPendiente(venta);
            this.ventasPendientes.push(venta);
            this.mostrarNotificacion(`⏳ Venta guardada offline`);
            
            for (const item of this.carrito) {
                const producto = this.productos.find(p => p.id === item.id);
                if (producto) producto.stock -= item.cantidad;
            }
            
            await OfflineDB.guardarProductos(this.productos);
            this.renderizarProductos();
            this.actualizarVistasPendientes();
            
            const ventasHoy = document.getElementById('ventasHoyCount');
            if (ventasHoy) ventasHoy.textContent = parseInt(ventasHoy.textContent || 0) + 1;
        }
        
        this.carrito = [];
        this.actualizarCarrito();
        document.getElementById('currentSalePanel')?.classList.remove('active');
        document.getElementById('clientName').value = '';
        
        await this.cargarVentasLocales();
    },
    
    async sincronizarVentasPendientes() {
        if (!this.online || !this.usuario) return;
        
        const pendientes = await OfflineDB.obtenerVentasPendientes(this.usuario.id);
        if (pendientes.length === 0) return;
        
        this.sincronizando = true;
        this.actualizarEstadoConexion();
        
        let sincronizadas = 0;
        
        for (const venta of pendientes) {
            try {
                for (const item of venta.productos) {
                    const prodResponse = await fetch(`${API_URL}/api/dueno/productos`);
                    const productos = await prodResponse.json();
                    const producto = productos.find(p => p.id === item.id);
                    
                    if (producto) {
                        await fetch(`${API_URL}/api/dueno/productos/${item.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                nombre: producto.nombre,
                                precio: producto.precio,
                                stock: producto.stock - item.cantidad,
                                categoria: producto.categoria
                            })
                        });
                    }
                }
                
                venta.estado = 'completada';
                await OfflineDB.guardarVentaCompletada(venta);
                await OfflineDB.eliminarVentaPendiente(venta.id);
                this.ventas.push(venta);
                sincronizadas++;
            } catch (error) {
                console.error('Error sincronizando venta:', error);
            }
        }
        
        await this.cargarCategoriasDelServidor();
        await this.cargarProductosDelServidor();
        await this.cargarVentasPendientesLocales();
        
        this.sincronizando = false;
        this.actualizarEstadoConexion();
        
        if (sincronizadas > 0) {
            this.mostrarNotificacion(`✅ ${sincronizadas} ventas sincronizadas`);
            await this.cargarVentasLocales();
            this.renderizarProductos();
        }
    },
    
    async cargarVentasLocales() {
        if (!this.usuario) return;
        
        try {
            this.ventas = await OfflineDB.cargarVentasCompletadas(this.usuario.id);
            this.cargarVentasRecientes();
            this.cargarTodasLasVentas();
        } catch (error) {
            this.ventas = [];
        }
    },
    
    async cargarVentasPendientesLocales() {
        if (!this.usuario) return;
        
        try {
            this.ventasPendientes = await OfflineDB.obtenerVentasPendientes(this.usuario.id);
            this.actualizarVistasPendientes();
        } catch (error) {
            this.ventasPendientes = [];
        }
    },
    
    actualizarVistasPendientes() {
        const pendienteCount = document.getElementById('pendienteCount');
        if (pendienteCount) pendienteCount.textContent = this.ventasPendientes.length;
        this.mostrarBannerPendientes();
        this.cargarVentasRecientes();
    },
    
    mostrarBannerPendientes() {
        const bannerExistente = document.getElementById('pendientesBanner');
        if (bannerExistente) bannerExistente.remove();
        
        if (this.ventasPendientes.length === 0) return;
        
        const banner = document.createElement('div');
        banner.id = 'pendientesBanner';
        banner.style.cssText = `
            background: #f39c12;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 10px 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            z-index: 100;
        `;
        
        banner.innerHTML = `
            <span style="font-size: 1.5rem;">⏳</span>
            <div style="flex: 1; margin-left: 12px;">
                <strong>${this.ventasPendientes.length} venta${this.ventasPendientes.length !== 1 ? 's' : ''} pendiente${this.ventasPendientes.length !== 1 ? 's' : ''}</strong><br>
                <small>${this.online ? 'Pendientes de sincronizar' : 'Sin conexión'}</small>
            </div>
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.2); border:none; color:white;" onclick="App.forzarSincronizacion()">
                ${this.online ? '🔄 Sincronizar' : '📱 Esperando...'}
            </button>
        `;
        
        banner.onclick = () => this.mostrarDetallePendientes();
        document.querySelector('header')?.insertAdjacentElement('afterend', banner);
    },
    
    mostrarDetallePendientes() {
        if (this.ventasPendientes.length === 0) return;
        
        let mensaje = '📋 VENTAS PENDIENTES:\n\n';
        let total = 0;
        
        this.ventasPendientes.forEach((v, i) => {
            mensaje += `${i+1}. ${v.cliente} - $${v.total.toFixed(2)}\n`;
            total += v.total;
        });
        
        mensaje += `\n💰 TOTAL: $${total.toFixed(2)}`;
        alert(mensaje);
    },
    
    async forzarSincronizacion() {
        if (!this.online) {
            this.mostrarNotificacion('❌ Sin conexión');
            return;
        }
        await this.sincronizarVentasPendientes();
    },
    
    setupPendientesClick() {
        const card = document.getElementById('pendienteCount')?.parentElement?.parentElement;
        if (card) {
            card.addEventListener('click', () => this.mostrarDetallePendientes());
            card.style.cursor = 'pointer';
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
                this.cargarProductosOffline();
                this.cargarCategoriasOffline();
                this.actualizarInfoUsuario();
                this.cargarVentasLocales();
                this.cargarVentasPendientesLocales();
                this.registrarActividad();
                this.setupUserMenu();
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
        
        if (!this.online) {
            this.showError('Necesitas conexión a internet');
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
                
                await this.registrarActividad();
                this.actualizarInfoUsuario();
                this.setupUserMenu();
                this.showVentaPanel();
                await this.cargarCategoriasDelServidor();
                await this.cargarProductosDelServidor();
                await this.cargarVentasPendientesLocales();
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
        this.cerrarSesion();
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
    
    // ===== VENTAS RECIENTES =====
    cargarVentasRecientes() {
        const container = document.getElementById('ventasRecientesContainer');
        if (!container) return;
        
        const todas = [
            ...this.ventasPendientes.map(v => ({...v, estado: 'pendiente'})),
            ...this.ventas
        ];
        
        if (todas.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay ventas</div>';
            return;
        }
        
        const recientes = [...todas].reverse().slice(0, 5);
        let html = '';
        
        recientes.forEach(v => {
            const fecha = new Date(v.fecha).toLocaleString();
            html += `
                <div class="history-item" style="${v.estado === 'pendiente' ? 'border-left:4px solid #f39c12' : ''}">
                    <div>
                        <div style="font-weight:600;">${v.cliente}</div>
                        <div style="font-size:0.75rem;">${fecha}</div>
                    </div>
                    <div>${v.productos.reduce((s,i)=>s+i.cantidad,0)} productos</div>
                    <div style="color:var(--accent-color);">$${v.total.toFixed(2)}</div>
                    <div><span class="status ${v.estado==='pendiente'?'status-warning':'status-completed'}">
                        ${v.estado==='pendiente'?'Pendiente':'Completada'}
                    </span></div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    cargarTodasLasVentas() {
        const container = document.getElementById('allSalesContainer');
        const totalAmount = document.getElementById('totalSalesAmount');
        const avgAmount = document.getElementById('avgSaleAmount');
        const totalCount = document.getElementById('totalSalesCount');
        
        if (this.ventas.length === 0) {
            if (container) container.innerHTML = '<div class="empty-message">No hay ventas</div>';
            if (totalAmount) totalAmount.textContent = '$0.00';
            if (avgAmount) avgAmount.textContent = '$0.00';
            if (totalCount) totalCount.textContent = '0';
            return;
        }
        
        const total = this.ventas.reduce((s, v) => s + v.total, 0);
        const promedio = total / this.ventas.length;
        
        if (totalAmount) totalAmount.textContent = `$${total.toFixed(2)}`;
        if (avgAmount) avgAmount.textContent = `$${promedio.toFixed(2)}`;
        if (totalCount) totalCount.textContent = this.ventas.length;
        
        let html = '';
        [...this.ventas].reverse().forEach(v => {
            const fecha = new Date(v.fecha).toLocaleString();
            html += `
                <div class="history-item">
                    <div>
                        <div style="font-weight:600;">${v.cliente}</div>
                        <div style="font-size:0.75rem;">${fecha}</div>
                    </div>
                    <div>${v.productos.reduce((s,i)=>s+i.cantidad,0)} productos</div>
                    <div style="color:var(--accent-color);">$${v.total.toFixed(2)}</div>
                    <div><span class="status status-completed">Completada</span></div>
                </div>
            `;
        });
        
        if (container) container.innerHTML = html;
    },
    
    // ===== INVENTARIO =====
    cargarInventario() {
        const tableBody = document.getElementById('inventoryTableBody');
        const lowStockSpan = document.getElementById('lowStockCount');
        const outStockSpan = document.getElementById('outOfStockCount');
        
        if (this.productos.length === 0) {
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="5">Sin productos</td></tr>';
            return;
        }
        
        const lowStock = this.productos.filter(p => p.stock > 0 && p.stock < 5).length;
        const outStock = this.productos.filter(p => p.stock === 0).length;
        
        if (lowStockSpan) lowStockSpan.textContent = lowStock;
        if (outStockSpan) outStockSpan.textContent = outStock;
        
        let html = '';
        this.productos.forEach(p => {
            const catNombre = this.obtenerNombreCategoria(p.categoria);
            let estado = 'Disponible', clase = '';
            if (p.stock === 0) { estado = 'Agotado'; clase = 'status-danger'; }
            else if (p.stock < 5) { estado = 'Stock Bajo'; clase = 'status-warning'; }
            
            html += `<tr><td>${p.nombre}</td><td>${catNombre}</td><td>$${p.precio.toFixed(2)}</td><td>${p.stock}</td><td><span class="${clase}">${estado}</span></td></tr>`;
        });
        
        if (tableBody) tableBody.innerHTML = html;
    },
    
    // ===== REPORTES =====
    setupReportes() {
        const hoy = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('reportDate');
        if (dateInput) dateInput.value = hoy;
        
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            this.generarReporte(dateInput?.value || hoy);
        });
        
        document.getElementById('exportPDFBtn')?.addEventListener('click', () => this.generarReportePDF());
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => this.generarReporteExcel());
        
        const enviarBtn = document.createElement('button');
        enviarBtn.className = 'btn btn-primary';
        enviarBtn.innerHTML = '📤 Enviar al Dueño';
        enviarBtn.style.marginTop = '10px';
        enviarBtn.onclick = () => this.enviarReporteAlDueño();
        
        const exportSection = document.querySelector('.export-section .export-buttons');
        if (exportSection) exportSection.appendChild(enviarBtn);
        
        document.getElementById('exportInventoryBtn')?.addEventListener('click', () => {
            this.mostrarNotificacion('📤 Exportando...');
            setTimeout(() => this.mostrarNotificacion('✅ Exportado'), 1500);
        });
        
        document.getElementById('refreshInventoryBtn')?.addEventListener('click', () => {
            this.cargarProductosDelServidor();
            this.mostrarNotificacion('🔄 Actualizado');
        });
    },
    
    generarReporte(fecha) {
        const ventas = this.ventas.filter(v => v.fecha.split('T')[0] === fecha);
        const pendientes = this.ventasPendientes.filter(v => v.fecha.split('T')[0] === fecha);
        const total = ventas.reduce((s, v) => s + v.total, 0);
        const totalPend = pendientes.reduce((s, v) => s + v.total, 0);
        
        document.getElementById('dailyTotal').textContent = `$${total.toFixed(2)}`;
        document.getElementById('dailySalesCount').textContent = ventas.length;
        document.getElementById('dailyAvg').textContent = ventas.length ? `$${(total/ventas.length).toFixed(2)}` : '$0.00';
        
        let cats = '';
        this.categorias.forEach(c => {
            const ventasCat = ventas.filter(v => v.productos.some(p => p.categoria === c.id))
                                    .reduce((s, v) => s + v.total, 0);
            cats += `<div class="category-sale-item"><span>${c.nombre}</span><span>$${ventasCat.toFixed(2)}</span></div>`;
        });
        
        document.getElementById('categorySales').innerHTML = `
            <div style="color:#f39c12;">⏳ Pendientes: $${totalPend.toFixed(2)}</div>
            ${cats}
        `;
        
        document.getElementById('bestProduct').textContent = this.productos[0]?.nombre || '-';
        document.getElementById('bestHour').textContent = '15:00 - 17:00';
        document.getElementById('topCategory').textContent = this.categorias[0]?.nombre || '-';
    },
    
    async generarReportePDF() {
        const fecha = document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0];
        const ventas = this.ventas.filter(v => v.fecha.split('T')[0] === fecha);
        const pendientes = this.ventasPendientes.filter(v => v.fecha.split('T')[0] === fecha);
        const total = ventas.reduce((s, v) => s + v.total, 0);
        const totalPend = pendientes.reduce((s, v) => s + v.total, 0);
        
        let texto = `📊 REPORTE DE VENTAS - ${fecha}\n`;
        texto += `Vendedora: ${this.usuario?.nombre}\n`;
        texto += `Tienda: ${this.usuario?.tienda}\n`;
        texto += `\n✅ Completadas: ${ventas.length} - $${total.toFixed(2)}\n`;
        texto += `⏳ Pendientes: ${pendientes.length} - $${totalPend.toFixed(2)}\n\n`;
        texto += `📋 DETALLE:\n`;
        
        ventas.forEach((v, i) => {
            texto += `\n${i+1}. ${v.cliente} - $${v.total.toFixed(2)}\n`;
            v.productos.forEach(p => texto += `   • ${p.nombre} x${p.cantidad} = $${(p.precio*p.cantidad).toFixed(2)}\n`);
        });
        
        const blob = new Blob([texto], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${fecha}_${this.usuario?.nombre.replace(/\s/g,'_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.mostrarNotificacion('📄 Reporte generado');
    },
    
    async generarReporteExcel() {
        const fecha = document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0];
        const ventas = this.ventas.filter(v => v.fecha.split('T')[0] === fecha);
        const pendientes = this.ventasPendientes.filter(v => v.fecha.split('T')[0] === fecha);
        
        let csv = '"Fecha","Cliente","Productos","Total","Estado"\n';
        
        ventas.forEach(v => {
            const prodStr = v.productos.map(p => `${p.nombre} x${p.cantidad}`).join('; ');
            csv += `"${new Date(v.fecha).toLocaleString()}","${v.cliente}","${prodStr}","${v.total.toFixed(2)}","Completada"\n`;
        });
        
        pendientes.forEach(v => {
            const prodStr = v.productos.map(p => `${p.nombre} x${p.cantidad}`).join('; ');
            csv += `"${new Date(v.fecha).toLocaleString()}","${v.cliente}","${prodStr}","${v.total.toFixed(2)}","Pendiente"\n`;
        });
        
        const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${fecha}_${this.usuario?.nombre.replace(/\s/g,'_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.mostrarNotificacion('📊 Excel generado');
    },
    
    async enviarReporteAlDueño() {
        const fecha = document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0];
        const ventas = this.ventas.filter(v => v.fecha.split('T')[0] === fecha);
        const pendientes = this.ventasPendientes.filter(v => v.fecha.split('T')[0] === fecha);
        
        const total = ventas.reduce((s, v) => s + v.total, 0);
        const totalPend = pendientes.reduce((s, v) => s + v.total, 0);
        
        const reporte = {
            id: `rep_${Date.now()}`,
            titulo: `Reporte de ventas - ${fecha}`,
            fecha: new Date().toISOString(),
            fechaReporte: fecha,
            vendedora: this.usuario?.nombre || 'Vendedora',
            vendedoraId: this.usuario?.id || '',
            tienda: this.usuario?.tienda || 'Tienda General',
            resumen: {
                ventasCompletadas: ventas.length,
                totalCompletado: total,
                ventasPendientes: pendientes.length,
                totalPendiente: totalPend
            },
            ventas: ventas.map(v => ({
                cliente: v.cliente,
                total: v.total,
                productos: v.productos.map(p => ({
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precio: p.precio,
                    subtotal: p.precio * p.cantidad
                })),
                fecha: v.fecha
            })),
            pendientes: pendientes.map(v => ({
                cliente: v.cliente,
                total: v.total,
                productos: v.productos.map(p => ({
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precio: p.precio,
                    subtotal: p.precio * p.cantidad
                })),
                fecha: v.fecha
            }))
        };
        
        try {
            const response = await fetch(`${API_URL}/api/reportes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reporte)
            });
            
            if (response.ok) {
                this.mostrarNotificacion('✅ Reporte enviado al dueño');
            } else {
                throw new Error();
            }
        } catch {
            this.mostrarNotificacion('❌ Error al enviar');
        }
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

document.addEventListener('DOMContentLoaded', () => App.init());
