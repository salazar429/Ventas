// ===========================================
// APP VENDEDORA - VERSIÓN CORREGIDA
// CON SOLUCIÓN PARA "PRODUCTO NO ENCONTRADO"
// ===========================================

const API_URL = 'https://sistema-test-api.onrender.com';
const DB_NAME = 'FacturacionDB';
const DB_VERSION = 5; // Incrementar versión para forzar limpieza

const TIEMPO_INACTIVIDAD = 30 * 60 * 1000; // 30 minutos

class OfflineDB {
    static async abrirDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log('✅ Base de datos IndexedDB abierta');
                resolve(request.result);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔄 Actualizando base de datos a versión', DB_VERSION);
                
                // Eliminar stores antiguos
                const stores = ['categorias', 'productos', 'ventas_pendientes', 'ventas_completadas', 'sesion'];
                stores.forEach(store => {
                    if (db.objectStoreNames.contains(store)) {
                        db.deleteObjectStore(store);
                    }
                });
                
                // Crear nuevos stores
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
                
                console.log('✅ Stores creados correctamente');
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
            tx.oncomplete = () => {
                console.log('✅ Categorías guardadas en IndexedDB');
                resolve();
            };
            tx.onerror = (e) => {
                console.error('❌ Error guardando categorías:', e);
                reject(e);
            };
        });
    }
    
    static async cargarCategorias() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('categorias', 'readonly');
            const store = tx.objectStore('categorias');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => {
                console.error('❌ Error cargando categorías:', e);
                reject(e);
            };
        });
    }
    
    static async guardarProductos(productos) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('productos', 'readwrite');
            const store = tx.objectStore('productos');
            store.clear();
            productos.forEach(p => {
                console.log('📦 Guardando producto en IndexedDB:', p.id, p.nombre);
                store.put(p);
            });
            tx.oncomplete = () => {
                console.log(`✅ ${productos.length} productos guardados en IndexedDB`);
                resolve();
            };
            tx.onerror = (e) => {
                console.error('❌ Error guardando productos:', e);
                reject(e);
            };
        });
    }
    
    static async cargarProductos() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('productos', 'readonly');
            const store = tx.objectStore('productos');
            const request = store.getAll();
            request.onsuccess = () => {
                console.log(`📦 ${request.result.length} productos cargados de IndexedDB`);
                resolve(request.result);
            };
            request.onerror = (e) => {
                console.error('❌ Error cargando productos:', e);
                reject(e);
            };
        });
    }
    
    static async guardarVentaPendiente(venta) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_pendientes', 'readwrite');
            const store = tx.objectStore('ventas_pendientes');
            store.put(venta);
            tx.oncomplete = () => {
                console.log('📝 Venta pendiente guardada:', venta.id);
                resolve();
            };
            tx.onerror = (e) => {
                console.error('❌ Error guardando venta pendiente:', e);
                reject(e);
            };
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
            request.onerror = (e) => {
                console.error('❌ Error obteniendo ventas pendientes:', e);
                reject(e);
            };
        });
    }
    
    static async eliminarVentaPendiente(id) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_pendientes', 'readwrite');
            const store = tx.objectStore('ventas_pendientes');
            store.delete(id);
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e);
        });
    }
    
    static async guardarVentaCompletada(venta) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_completadas', 'readwrite');
            const store = tx.objectStore('ventas_completadas');
            store.put(venta);
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e);
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
            request.onerror = (e) => reject(e);
        });
    }
    
    static async guardarUltimaActividad() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sesion', 'readwrite');
            const store = tx.objectStore('sesion');
            store.put({ id: 'ultimaActividad', timestamp: Date.now() });
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e);
        });
    }
    
    static async obtenerUltimaActividad() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sesion', 'readonly');
            const store = tx.objectStore('sesion');
            const request = store.get('ultimaActividad');
            request.onsuccess = () => resolve(request.result?.timestamp || Date.now());
            request.onerror = (e) => reject(e);
        });
    }
}

// ========== APP VENDEDORA ==========
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
        
        // Cargar datos offline primero
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
                <div class="menu-item" onclick="alert('Configuración - Falta implementación')" style="padding: 10px 16px; cursor: pointer;">
                    ⚙️ Ajustes
                </div>
                <div class="menu-item" onclick="alert('Tutoriales - Falta implementación')" style="padding: 10px 16px; cursor: pointer;">
                    📚 Tutoriales
                </div>
                <div class="menu-item" onclick="App.logout()" style="padding: 10px 16px; cursor: pointer; color: #e74c3c;">
                    🚪 Cerrar sesión
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .menu-item:hover {
                background-color: #f5f5f5;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(menu);
        
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
            
            document.getElementById('menuUserName').textContent = this.usuario?.nombre || 'Vendedora';
            document.getElementById('menuUserTienda').textContent = this.usuario?.tienda || '';
        });
        
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
        const menu = document.getElementById('userMenu');
        if (menu) menu.style.display = 'none';
    },
    
    // ===== ESTADO DE CONEXIÓN =====
    setupConnectionListener() {
        window.addEventListener('online', () => {
            console.log('📶 Conexión restablecida');
            this.online = true;
            this.actualizarEstadoConexion();
            this.mostrarNotificacion('📶 Conexión restablecida');
            this.sincronizarTodo();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Sin conexión');
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
                console.log('✅ Servidor accesible');
                await this.sincronizarTodo();
            }
        } catch (error) {
            console.log('❌ Error conectando al servidor:', error);
        } finally {
            this.sincronizando = false;
            this.actualizarEstadoConexion();
        }
    },
    
    async sincronizarTodo() {
        if (!this.online || !this.usuario) return;
        
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
            console.log('📥 Solicitando categorías al servidor...');
            const response = await fetch(`${API_URL}/api/categorias`);
            const categorias = await response.json();
            console.log('🏷️ Categorías recibidas:', categorias.length);
            await OfflineDB.guardarCategorias(categorias);
            await this.cargarCategoriasOffline();
            return categorias;
        } catch (error) {
            console.error('Error cargando categorías del servidor:', error);
            return [];
        }
    },
    
    async cargarCategoriasOffline() {
        try {
            this.categorias = await OfflineDB.cargarCategorias();
            console.log('🏷️ Categorías cargadas offline:', this.categorias.length);
            this.actualizarFiltrosCategorias();
        } catch (error) {
            console.error('Error cargando categorías offline:', error);
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
    
    // ===== PRODUCTOS (CORREGIDO) =====
    async cargarProductosDelServidor() {
        try {
            console.log('📥 Solicitando productos al servidor...');
            const response = await fetch(`${API_URL}/api/productos`);
            const productos = await response.json();
            console.log('📦 Productos recibidos del servidor:', productos.length);
            
            if (productos.length > 0) {
                console.log('📦 IDs de productos:', productos.map(p => p.id));
            }
            
            // Obtener ventas pendientes para ajustar stock
            const pendientes = this.usuario ? await OfflineDB.obtenerVentasPendientes(this.usuario.id) : [];
            
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
            console.error('Error cargando productos del servidor:', error);
            return [];
        }
    },
    
    async cargarProductosOffline() {
        try {
            this.productos = await OfflineDB.cargarProductos();
            console.log('📦 Productos cargados offline:', this.productos.length);
            
            if (this.productos.length > 0) {
                console.log('📦 IDs en memoria:', this.productos.map(p => p.id));
            }
            
            if (this.usuario) {
                this.renderizarProductos();
                this.cargarInventario();
                this.actualizarDashboard();
            }
        } catch (error) {
            console.error('Error cargando productos offline:', error);
            this.productos = [];
        }
    },
    
    renderizarProductos() {
        const container = document.getElementById('productoContainer');
        const countSpan = document.getElementById('productCount');
        const totalProductosSpan = document.getElementById('totalProductosCount');
        
        if (!container) return;
        
        if (countSpan) countSpan.textContent = `(${this.productos.length} productos)`;
        if (totalProductosSpan) totalProductosSpan.textContent = this.productos.length;
        
        if (this.productos.length === 0) {
            container.innerHTML = '<div class="empty-message" style="text-align:center; padding:40px;">No hay productos disponibles</div>';
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
    
    // ===== CARRITO Y VENTAS (CORREGIDO) =====
    agregarAlCarrito(productoId) {
        console.log('🔍 Buscando producto con ID:', productoId);
        console.log('📦 Productos disponibles:', this.productos.map(p => ({ id: p.id, nombre: p.nombre })));
        
        const producto = this.productos.find(p => p.id === productoId);
        
        if (!producto) {
            console.error('❌ Producto no encontrado en memoria. ID:', productoId);
            console.log('📦 IDs en memoria:', this.productos.map(p => p.id));
            this.mostrarNotificacion('❌ Producto no encontrado');
            return;
        }
        
        console.log('✅ Producto encontrado:', producto.nombre);
        
        const cantidadInput = document.getElementById(`cantidad-${productoId}`);
        const cantidad = parseInt(cantidadInput?.value || '1');
        
        if (isNaN(cantidad) || cantidad < 1) {
            this.mostrarNotificacion('❌ Cantidad inválida');
            return;
        }
        
        if (cantidad > producto.stock) {
            this.mostrarNotificacion('❌ Stock insuficiente (solo hay ' + producto.stock + ')');
            return;
        }
        
        const itemExistente = this.carrito.find(item => item.id === productoId);
        
        if (itemExistente) {
            if (itemExistente.cantidad + cantidad > producto.stock) {
                this.mostrarNotificacion('❌ Stock insuficiente para agregar más');
                return;
            }
            itemExistente.cantidad += cantidad;
            console.log('🛒 Cantidad actualizada:', itemExistente.cantidad);
        } else {
            this.carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: cantidad,
                stock: producto.stock,
                categoria: producto.categoria
            });
            console.log('🛒 Producto agregado al carrito:', producto.nombre);
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
            if (container) container.innerHTML = '<div class="empty-message">No hay productos en la venta</div>';
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
            this.mostrarNotificacion('❌ No hay productos en el carrito');
            return;
        }
        
        const cliente = document.getElementById('clientName')?.value.trim() || 'Cliente General';
        const total = this.carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
        
        // Verificar stock suficiente
        for (const item of this.carrito) {
            const producto = this.productos.find(p => p.id === item.id);
            if (!producto) {
                this.mostrarNotificacion(`❌ Producto ${item.nombre} no encontrado en inventario`);
                return;
            }
            if (item.cantidad > producto.stock) {
                this.mostrarNotificacion(`❌ Stock insuficiente para ${item.nombre} (disponible: ${producto.stock})`);
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
                    console.log('📤 Actualizando stock en servidor:', item.id, 'nuevo stock:', producto.stock - item.cantidad);
                    
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
                        console.error('❌ Error en respuesta del servidor:', await response.text());
                        exito = false;
                        break;
                    }
                    
                    const data = await response.json();
                    console.log('✅ Producto actualizado en servidor:', data);
                    
                    producto.stock -= item.cantidad;
                } catch (error) {
                    console.error('❌ Error actualizando stock:', error);
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
            } else {
                this.mostrarNotificacion('❌ Error al procesar la venta');
            }
        } else {
            await OfflineDB.guardarVentaPendiente(venta);
            this.ventasPendientes.push(venta);
            this.mostrarNotificacion(`⏳ Venta guardada offline - Se sincronizará automáticamente`);
            
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
        
        console.log(`🔄 Sincronizando ${pendientes.length} ventas pendientes...`);
        this.sincronizando = true;
        this.actualizarEstadoConexion();
        
        let sincronizadas = 0;
        
        for (const venta of pendientes) {
            try {
                console.log('🔄 Procesando venta pendiente:', venta.id);
                
                for (const item of venta.productos) {
                    // Obtener producto actual del servidor
                    const prodResponse = await fetch(`${API_URL}/api/dueno/productos`);
                    if (!prodResponse.ok) {
                        throw new Error('Error obteniendo productos del servidor');
                    }
                    
                    const productosServidor = await prodResponse.json();
                    const productoServidor = productosServidor.find(p => p.id === item.id);
                    
                    if (!productoServidor) {
                        console.warn('⚠️ Producto no encontrado en servidor:', item.id);
                        continue;
                    }
                    
                    console.log('📤 Actualizando producto en servidor:', item.id, 'stock actual:', productoServidor.stock);
                    
                    const updateResponse = await fetch(`${API_URL}/api/dueno/productos/${item.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nombre: productoServidor.nombre,
                            precio: productoServidor.precio,
                            stock: productoServidor.stock - item.cantidad,
                            categoria: productoServidor.categoria
                        })
                    });
                    
                    if (!updateResponse.ok) {
                        throw new Error(`Error actualizando producto ${item.id}`);
                    }
                }
                
                venta.estado = 'completada';
                await OfflineDB.guardarVentaCompletada(venta);
                await OfflineDB.eliminarVentaPendiente(venta.id);
                this.ventas.push(venta);
                sincronizadas++;
                
            } catch (error) {
                console.error('Error sincronizando venta:', venta.id, error);
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
            console.log('📊 Ventas cargadas:', this.ventas.length);
            this.cargarVentasRecientes();
            this.cargarTodasLasVentas();
        } catch (error) {
            console.error('Error cargando ventas:', error);
            this.ventas = [];
        }
    },
    
    async cargarVentasPendientesLocales() {
        if (!this.usuario) return;
        
        try {
            this.ventasPendientes = await OfflineDB.obtenerVentasPendientes(this.usuario.id);
            console.log('⏳ Ventas pendientes:', this.ventasPendientes.length);
            this.actualizarVistasPendientes();
        } catch (error) {
            console.error('Error cargando ventas pendientes:', error);
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
                <small>${this.online ? 'Pendientes de sincronizar' : 'Sin conexión - se sincronizarán automáticamente'}</small>
            </div>
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.2); border:none; color:white;" onclick="event.stopPropagation(); App.forzarSincronizacion()">
                ${this.online ? '🔄 Sincronizar' : '📱 Esperando conexión...'}
            </button>
        `;
        
        banner.onclick = () => this.mostrarDetallePendientes();
        
        const header = document.querySelector('header');
        if (header) {
            header.insertAdjacentElement('afterend', banner);
        }
    },
    
    mostrarDetallePendientes() {
        if (this.ventasPendientes.length === 0) {
            this.mostrarNotificacion('No hay ventas pendientes');
            return;
        }
        
        let mensaje = '📋 VENTAS PENDIENTES:\n\n';
        let total = 0;
        
        this.ventasPendientes.forEach((v, i) => {
            mensaje += `${i+1}. ${v.cliente} - $${v.total.toFixed(2)}\n`;
            v.productos.forEach(p => {
                mensaje += `   • ${p.nombre} x${p.cantidad}\n`;
            });
            total += v.total;
        });
        
        mensaje += `\n💰 TOTAL PENDIENTE: $${total.toFixed(2)}`;
        alert(mensaje);
    },
    
    async forzarSincronizacion() {
        if (!this.online) {
            this.mostrarNotificacion('❌ Sin conexión a internet');
            return;
        }
        
        if (this.ventasPendientes.length === 0) {
            this.mostrarNotificacion('✅ No hay ventas pendientes');
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
            const splash = document.getElementById('splashScreen');
            if (splash) {
                splash.classList.add('hidden');
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 500);
            }
            document.getElementById('loginPanel')?.classList.add('visible');
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
                console.error('Error al cargar usuario guardado:', e);
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
            this.showError('Necesitas conexión a internet para iniciar sesión');
            return;
        }
        
        const btn = document.getElementById('btnLogin');
        btn.disabled = true;
        btn.textContent = '🔐 Verificando...';
        
        try {
            console.log('🔑 Intentando login:', usuario);
            
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            });
            
            const data = await response.json();
            console.log('📥 Respuesta login:', data);
            
            if (response.ok && data.success) {
                this.usuario = data.usuario;
                localStorage.setItem('vendedora_activa', JSON.stringify(this.usuario));
                
                await this.registrarActividad();
                this.actualizarInfoUsuario();
                this.setupUserMenu();
                this.showVentaPanel();
                
                // Cargar datos del servidor
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
            console.error('Error en login:', error);
            this.showError('Error de conexión al servidor');
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
        
        const section = document.getElementById(`${page}Section`);
        if (section) section.classList.add('active');
        
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
        
        if (searchInput) searchInput.addEventListener('input', performSearch);
        if (searchBtn) searchBtn.addEventListener('click', performSearch);
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
        
        if (floatingBtn) {
            floatingBtn.addEventListener('click', () => {
                if (panel) panel.classList.toggle('active');
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (panel) panel.classList.remove('active');
            });
        }
        
        if (ventaActualCard) {
            ventaActualCard.addEventListener('click', () => {
                if (panel) panel.classList.toggle('active');
            });
        }
        
        const clearBtn = document.getElementById('clearSaleBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.limpiarCarrito());
        }
        
        const completeBtn = document.getElementById('completeSaleBtn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completarVenta());
        }
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
            container.innerHTML = '<div class="empty-message">No hay ventas registradas</div>';
            return;
        }
        
        const recientes = [...todas].reverse().slice(0, 5);
        let html = '';
        
        recientes.forEach(v => {
            const fecha = new Date(v.fecha).toLocaleString();
            html += `
                <div class="history-item" style="${v.estado === 'pendiente' ? 'border-left:4px solid #f39c12; background:#fff3e0;' : ''}">
                    <div>
                        <div style="font-weight:600;">${v.cliente}</div>
                        <div style="font-size:0.75rem; color:#666;">${fecha}</div>
                    </div>
                    <div>${v.productos.reduce((s, i) => s + i.cantidad, 0)} productos</div>
                    <div style="color:var(--accent-color);">$${v.total.toFixed(2)}</div>
                    <div><span class="status ${v.estado === 'pendiente' ? 'status-warning' : 'status-completed'}">
                        ${v.estado === 'pendiente' ? 'Pendiente' : 'Completada'}
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
            if (container) container.innerHTML = '<div class="empty-message">No hay ventas completadas</div>';
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
                        <div style="font-size:0.75rem; color:#666;">${fecha}</div>
                    </div>
                    <div>${v.productos.reduce((s, i) => s + i.cantidad, 0)} productos</div>
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
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">No hay productos en inventario</td></tr>';
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
            if (p.stock === 0) {
                estado = 'Agotado';
                clase = 'status-danger';
            } else if (p.stock < 5) {
                estado = 'Stock Bajo';
                clase = 'status-warning';
            }
            
            html += `<tr>
                <td>${p.nombre}</td>
                <td>${catNombre}</td>
                <td>$${p.precio.toFixed(2)}</td>
                <td>${p.stock}</td>
                <td><span class="${clase}">${estado}</span></td>
            </tr>`;
        });
        
        if (tableBody) tableBody.innerHTML = html;
    },
    
    // ===== REPORTES =====
    setupReportes() {
        const hoy = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('reportDate');
        if (dateInput) dateInput.value = hoy;
        
        const generateBtn = document.getElementById('generateReportBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generarReporte(dateInput?.value || hoy);
            });
        }
        
        const pdfBtn = document.getElementById('exportPDFBtn');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => this.generarReportePDF());
        }
        
        const excelBtn = document.getElementById('exportExcelBtn');
        if (excelBtn) {
            excelBtn.addEventListener('click', () => this.generarReporteExcel());
        }
        
        // Agregar botón para enviar al dueño si no existe
        const exportSection = document.querySelector('.export-section .export-buttons');
        if (exportSection && !document.getElementById('enviarDueñoBtn')) {
            const enviarBtn = document.createElement('button');
            enviarBtn.id = 'enviarDueñoBtn';
            enviarBtn.className = 'btn btn-primary';
            enviarBtn.innerHTML = '📤 Enviar al Dueño';
            enviarBtn.style.marginTop = '10px';
            enviarBtn.onclick = () => this.enviarReporteAlDueño();
            exportSection.appendChild(enviarBtn);
        }
        
        const exportInventoryBtn = document.getElementById('exportInventoryBtn');
        if (exportInventoryBtn) {
            exportInventoryBtn.addEventListener('click', () => {
                this.mostrarNotificacion('📤 Exportando inventario...');
                setTimeout(() => this.mostrarNotificacion('✅ Inventario exportado'), 1500);
            });
        }
        
        const refreshInventoryBtn = document.getElementById('refreshInventoryBtn');
        if (refreshInventoryBtn) {
            refreshInventoryBtn.addEventListener('click', () => {
                this.cargarProductosDelServidor();
                this.mostrarNotificacion('🔄 Inventario actualizado');
            });
        }
    },
    
    generarReporte(fecha) {
        const ventas = this.ventas.filter(v => v.fecha.split('T')[0] === fecha);
        const pendientes = this.ventasPendientes.filter(v => v.fecha.split('T')[0] === fecha);
        const total = ventas.reduce((s, v) => s + v.total, 0);
        const totalPend = pendientes.reduce((s, v) => s + v.total, 0);
        
        const dailyTotal = document.getElementById('dailyTotal');
        const dailyCount = document.getElementById('dailySalesCount');
        const dailyAvg = document.getElementById('dailyAvg');
        const categorySales = document.getElementById('categorySales');
        const bestProduct = document.getElementById('bestProduct');
        const bestHour = document.getElementById('bestHour');
        const topCategory = document.getElementById('topCategory');
        
        if (dailyTotal) dailyTotal.textContent = `$${(total + totalPend).toFixed(2)}`;
        if (dailyCount) dailyCount.textContent = ventas.length;
        if (dailyAvg) dailyAvg.textContent = ventas.length ? `$${(total/ventas.length).toFixed(2)}` : '$0.00';
        
        if (categorySales) {
            let cats = '';
            this.categorias.forEach(c => {
                const ventasCat = ventas.filter(v => v.productos.some(p => p.categoria === c.id))
                                        .reduce((s, v) => s + v.total, 0);
                cats += `<div class="category-sale-item"><span>${c.nombre}</span><span>$${ventasCat.toFixed(2)}</span></div>`;
            });
            
            categorySales.innerHTML = `
                <div style="color:#f39c12; margin-bottom:8px;">⏳ Pendientes: $${totalPend.toFixed(2)}</div>
                ${cats}
            `;
        }
        
        if (bestProduct) bestProduct.textContent = this.productos[0]?.nombre || '-';
        if (bestHour) bestHour.textContent = '15:00 - 17:00';
        if (topCategory) topCategory.textContent = this.categorias[0]?.nombre || '-';
    },
    
    async generarReportePDF() {
        const fecha = document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0];
        const ventas = this.ventas.filter(v => v.fecha.split('T')[0] === fecha);
        const pendientes = this.ventasPendientes.filter(v => v.fecha.split('T')[0] === fecha);
        const total = ventas.reduce((s, v) => s + v.total, 0);
        const totalPend = pendientes.reduce((s, v) => s + v.total, 0);
        
        let texto = `📊 REPORTE DE VENTAS - ${fecha}\n`;
        texto += `================================\n`;
        texto += `Vendedora: ${this.usuario?.nombre || 'N/A'}\n`;
        texto += `Tienda: ${this.usuario?.tienda || 'N/A'}\n`;
        texto += `\n📦 RESUMEN:\n`;
        texto += `Ventas completadas: ${ventas.length}\n`;
        texto += `Total completado: $${total.toFixed(2)}\n`;
        texto += `Ventas pendientes: ${pendientes.length}\n`;
        texto += `Total pendiente: $${totalPend.toFixed(2)}\n`;
        texto += `\n🛒 DETALLE DE VENTAS:\n`;
        
        ventas.forEach((v, i) => {
            texto += `\n${i+1}. ${v.cliente} - $${v.total.toFixed(2)}\n`;
            v.productos.forEach(p => {
                texto += `   • ${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toFixed(2)}\n`;
            });
        });
        
        if (pendientes.length > 0) {
            texto += `\n⏳ VENTAS PENDIENTES:\n`;
            pendientes.forEach((v, i) => {
                texto += `\n${i+1}. ${v.cliente} - $${v.total.toFixed(2)}\n`;
                v.productos.forEach(p => {
                    texto += `   • ${p.nombre} x${p.cantidad}\n`;
                });
            });
        }
        
        const blob = new Blob([texto], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${fecha}_${this.usuario?.nombre.replace(/\s/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.mostrarNotificacion('📄 Reporte PDF generado');
    },
    
    async generarReporteExcel() {
        const fecha = document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0];
        const ventas = this.ventas.filter(v => v.fecha.split('T')[0] === fecha);
        const pendientes = this.ventasPendientes.filter(v => v.fecha.split('T')[0] === fecha);
        
        let csv = '"Fecha","Cliente","Productos","Total","Estado"\n';
        
        ventas.forEach(v => {
            const fechaStr = new Date(v.fecha).toLocaleString();
            const prodStr = v.productos.map(p => `${p.nombre} x${p.cantidad}`).join('; ');
            csv += `"${fechaStr}","${v.cliente}","${prodStr}","${v.total.toFixed(2)}","Completada"\n`;
        });
        
        pendientes.forEach(v => {
            const fechaStr = new Date(v.fecha).toLocaleString();
            const prodStr = v.productos.map(p => `${p.nombre} x${p.cantidad}`).join('; ');
            csv += `"${fechaStr}","${v.cliente}","${prodStr}","${v.total.toFixed(2)}","Pendiente"\n`;
        });
        
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${fecha}_${this.usuario?.nombre.replace(/\s/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.mostrarNotificacion('📊 Reporte Excel generado');
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
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.mostrarNotificacion('✅ Reporte enviado al dueño');
            } else {
                throw new Error(data.error || 'Error al enviar');
            }
        } catch (error) {
            console.error('Error enviando reporte:', error);
            this.mostrarNotificacion('❌ Error al enviar reporte');
        }
    },
    
    // ===== UTILIDADES =====
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
        
        if (loginPanel) {
            loginPanel.style.display = 'block';
            setTimeout(() => loginPanel.classList.add('visible'), 50);
        }
        if (ventaPanel) ventaPanel.style.display = 'none';
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
    
    actualizarInfoUsuario() {
        if (!this.usuario) return;
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = this.usuario.nombre || 'Vendedora';
        if (userAvatar) userAvatar.textContent = (this.usuario.nombre?.charAt(0) || 'V').toUpperCase();
    },
    
    setupEventListeners() {
        const loginBtn = document.getElementById('btnLogin');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }
        
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const loginPanel = document.getElementById('loginPanel');
                if (loginPanel && loginPanel.style.display !== 'none') {
                    this.login();
                }
            }
        });
    },
    
    showError(mensaje, tipo = 'error') {
        const errorDiv = document.getElementById('loginError');
        if (!errorDiv) return;
        
        if (tipo === 'clear') {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        } else {
            errorDiv.style.display = 'block';
            errorDiv.textContent = mensaje;
        }
    }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
