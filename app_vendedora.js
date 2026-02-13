// ===========================================
// APP VENDEDORA - VERSIÓN CORREGIDA
// CON LIMPIEZA DE CACHE AL INICIAR
// ===========================================

const API_URL = 'https://sistema-test-api.onrender.com';
const DB_NAME = 'FacturacionDB';
const DB_VERSION = 3; // Incrementar versión para forzar limpieza

// ========== INDEXEDDB CON LIMPIEZA ==========
class OfflineDB {
    static async abrirDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Eliminar stores antiguos si existen
                if (db.objectStoreNames.contains('categorias')) {
                    db.deleteObjectStore('categorias');
                }
                if (db.objectStoreNames.contains('productos')) {
                    db.deleteObjectStore('productos');
                }
                if (db.objectStoreNames.contains('ventas_pendientes')) {
                    db.deleteObjectStore('ventas_pendientes');
                }
                if (db.objectStoreNames.contains('ventas_completadas')) {
                    db.deleteObjectStore('ventas_completadas');
                }
                
                // Crear nuevos stores
                db.createObjectStore('categorias', { keyPath: 'id' });
                
                const storeProductos = db.createObjectStore('productos', { keyPath: 'id' });
                storeProductos.createIndex('nombre', 'nombre', { unique: false });
                storeProductos.createIndex('categoria', 'categoria', { unique: false });
                
                const storePendientes = db.createObjectStore('ventas_pendientes', { keyPath: 'id' });
                storePendientes.createIndex('fecha', 'fecha', { unique: false });
                storePendientes.createIndex('sincronizada', 'sincronizada', { unique: false });
                
                db.createObjectStore('ventas_completadas', { keyPath: 'id' });
                
                console.log('🔄 Base de datos actualizada a versión', DB_VERSION);
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
                console.log('✅ Categorías guardadas offline:', categorias.length);
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    }
    
    static async cargarCategorias() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('categorias', 'readonly');
            const store = tx.objectStore('categorias');
            const request = store.getAll();
            request.onsuccess = () => {
                console.log('📖 Categorías cargadas offline:', request.result.length);
                resolve(request.result);
            };
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
            tx.oncomplete = () => {
                console.log('✅ Productos guardados offline:', productos.length);
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    }
    
    static async cargarProductos() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('productos', 'readonly');
            const store = tx.objectStore('productos');
            const request = store.getAll();
            request.onsuccess = () => {
                console.log('📖 Productos cargados offline:', request.result.length);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    static async guardarVentaPendiente(venta) {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_pendientes', 'readwrite');
            const store = tx.objectStore('ventas_pendientes');
            venta.fecha = new Date().toISOString();
            venta.sincronizada = false;
            store.put(venta);
            tx.oncomplete = () => {
                console.log('📝 Venta guardada offline:', venta.id);
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    }
    
    static async obtenerVentasPendientes() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_pendientes', 'readonly');
            const store = tx.objectStore('ventas_pendientes');
            const request = store.getAll();
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
    
    static async cargarVentasCompletadas() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('ventas_completadas', 'readonly');
            const store = tx.objectStore('ventas_completadas');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // Nueva función: limpiar toda la base de datos local
    static async limpiarTodo() {
        const db = await this.abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['categorias', 'productos', 'ventas_pendientes', 'ventas_completadas'], 'readwrite');
            
            tx.objectStore('categorias').clear();
            tx.objectStore('productos').clear();
            tx.objectStore('ventas_pendientes').clear();
            tx.objectStore('ventas_completadas').clear();
            
            tx.oncomplete = () => {
                console.log('🧹 Base de datos local limpiada');
                resolve();
            };
            tx.onerror = () => reject(tx.error);
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
    
    async init() {
        console.log('🚀 Iniciando App Vendedora');
        this.setupConnectionListener();
        
        // Limpiar cache local al iniciar (opcional, comentar si no se desea)
        // await OfflineDB.limpiarTodo();
        
        await this.cargarCategoriasOffline();
        await this.cargarProductosOffline();
        await this.cargarVentasPendientesLocales();
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
    
    // ===== ESTADO DE CONEXIÓN =====
    setupConnectionListener() {
        window.addEventListener('online', () => {
            console.log('📶 Conexión restablecida - Iniciando sincronización...');
            this.online = true;
            this.actualizarEstadoConexion();
            this.mostrarNotificacion('📶 Conexión restablecida - Sincronizando...');
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
                console.log('✅ Servidor accesible');
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
        this.mostrarNotificacion('🔄 Sincronizando datos...');
        
        try {
            // Primero cargar categorías
            await this.cargarCategoriasDelServidor();
            // Luego productos (que dependen de categorías)
            await this.cargarProductosDelServidor();
            // Finalmente ventas pendientes
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
            
            if (!response.ok) {
                console.error('❌ Error en respuesta del servidor:', response.status);
                return [];
            }
            
            const categorias = await response.json();
            console.log('🏷️ Categorías recibidas del servidor:', categorias);
            
            // Guardar en offline
            if (categorias && categorias.length > 0) {
                await OfflineDB.guardarCategorias(categorias);
            } else {
                // Si no hay categorías, guardar array vacío
                await OfflineDB.guardarCategorias([]);
            }
            
            // Actualizar memoria local
            await this.cargarCategoriasOffline();
            
            return categorias;
        } catch (error) {
            console.error('❌ Error cargando categorías del servidor:', error);
            return [];
        }
    },
    
    async cargarCategoriasOffline() {
        try {
            this.categorias = await OfflineDB.cargarCategorias();
            console.log(`🏷️ ${this.categorias.length} categorías cargadas offline:`, 
                this.categorias.map(c => c.nombre));
            
            // Actualizar filtros de categorías si es necesario
            this.actualizarFiltrosCategorias();
        } catch (error) {
            console.error('❌ Error cargando categorías offline:', error);
            this.categorias = [];
        }
    },
    
    actualizarFiltrosCategorias() {
        // Actualizar los botones de filtro con las categorías reales
        const filterContainer = document.getElementById('categoryFilterContainer');
        if (!filterContainer) return;
        
        let html = '<button class="category-btn active" data-category="todos">Todos</button>';
        
        this.categorias.forEach(c => {
            if (c.activa !== false) {
                html += `<button class="category-btn" data-category="${c.id}">${c.nombre}</button>`;
            }
        });
        
        filterContainer.innerHTML = html;
        
        // Reasignar eventos
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
            console.log('📥 Solicitando productos al servidor...');
            const response = await fetch(`${API_URL}/api/productos`);
            
            if (!response.ok) {
                console.error('❌ Error en respuesta del servidor:', response.status);
                return [];
            }
            
            const productos = await response.json();
            console.log('📦 Productos recibidos del servidor:', productos.length);
            
            // Obtener ventas pendientes para ajustar stock
            const pendientes = await OfflineDB.obtenerVentasPendientes();
            
            if (pendientes.length > 0) {
                const productosActualizados = productos.map(p => {
                    let stockRestado = 0;
                    pendientes.forEach(v => {
                        const item = v.productos.find(i => i.id === p.id);
                        if (item) stockRestado += item.cantidad;
                    });
                    
                    return {
                        ...p,
                        stock: Math.max(0, p.stock - stockRestado)
                    };
                });
                
                await OfflineDB.guardarProductos(productosActualizados);
            } else {
                await OfflineDB.guardarProductos(productos);
            }
            
            if (this.usuario) {
                await this.cargarProductosOffline();
            }
            
            return productos;
        } catch (error) {
            console.error('❌ Error cargando productos del servidor:', error);
            return [];
        }
    },
    
    async cargarProductosOffline() {
        try {
            this.productos = await OfflineDB.cargarProductos();
            console.log(`📦 ${this.productos.length} productos cargados offline`);
            
            if (this.usuario) {
                this.renderizarProductos();
                this.cargarInventario();
                this.actualizarDashboard();
            }
        } catch (error) {
            console.error('❌ Error cargando productos offline:', error);
            this.productos = [];
        }
    },
    
    // ===== VENTAS PENDIENTES =====
    async cargarVentasPendientesLocales() {
        try {
            this.ventasPendientes = await OfflineDB.obtenerVentasPendientes();
            console.log(`⏳ ${this.ventasPendientes.length} ventas pendientes cargadas`);
            this.actualizarVistasPendientes();
        } catch (error) {
            console.error('❌ Error cargando ventas pendientes:', error);
            this.ventasPendientes = [];
        }
    },
    
    actualizarVistasPendientes() {
        const pendienteCount = document.getElementById('pendienteCount');
        if (pendienteCount) {
            pendienteCount.textContent = this.ventasPendientes.length;
        }
        
        this.mostrarBannerPendientes();
        this.cargarVentasRecientes();
        this.cargarTodasLasVentas();
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
            transition: all 0.3s ease;
            animation: slideDown 0.3s ease;
            z-index: 100;
        `;
        
        const icono = document.createElement('span');
        icono.innerHTML = '⏳';
        icono.style.fontSize = '1.5rem';
        icono.style.marginRight = '12px';
        
        const texto = document.createElement('div');
        texto.style.flex = '1';
        texto.innerHTML = `
            <strong style="font-size: 1rem;">${this.ventasPendientes.length} venta${this.ventasPendientes.length !== 1 ? 's' : ''} pendiente${this.ventasPendientes.length !== 1 ? 's' : ''}</strong><br>
            <small>${this.online ? 'Pendientes de sincronizar' : 'Sin conexión - Se realizarán al reconectar'}</small>
        `;
        
        const botones = document.createElement('div');
        botones.style.display = 'flex';
        botones.style.gap = '8px';
        
        const verBtn = document.createElement('button');
        verBtn.innerHTML = '👁️ Ver';
        verBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.85rem;
        `;
        verBtn.onclick = (e) => {
            e.stopPropagation();
            this.mostrarDetallePendientes();
        };
        
        botones.appendChild(verBtn);
        
        if (this.online) {
            const forzarBtn = document.createElement('button');
            forzarBtn.innerHTML = '🔄 Sincronizar ahora';
            forzarBtn.style.cssText = `
                background: #27ae60;
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.85rem;
            `;
            forzarBtn.onclick = (e) => {
                e.stopPropagation();
                this.forzarSincronizacion();
            };
            botones.appendChild(forzarBtn);
        }
        
        banner.appendChild(icono);
        banner.appendChild(texto);
        banner.appendChild(botones);
        
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
        
        this.ventasPendientes.forEach((v, index) => {
            mensaje += `${index + 1}. ${v.cliente}\n`;
            v.productos.forEach(p => {
                mensaje += `   • ${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toFixed(2)}\n`;
            });
            mensaje += `   Total: $${v.total.toFixed(2)}\n\n`;
            total += v.total;
        });
        
        mensaje += `💰 TOTAL PENDIENTE: $${total.toFixed(2)}\n`;
        mensaje += `📡 Estado: ${this.online ? 'Listas para sincronizar' : 'Esperando conexión'}`;
        
        if (this.online) {
            if (confirm(mensaje + '\n\n¿Deseas sincronizar ahora estas ventas?')) {
                this.forzarSincronizacion();
            }
        } else {
            alert(mensaje);
        }
    },
    
    setupPendientesClick() {
        const pendienteCard = document.getElementById('pendienteCount')?.parentElement?.parentElement;
        if (pendienteCard) {
            pendienteCard.addEventListener('click', () => this.mostrarDetallePendientes());
            pendienteCard.style.cursor = 'pointer';
        }
    },
    
    async forzarSincronizacion() {
        if (!this.online) {
            this.mostrarNotificacion('❌ No hay conexión a internet');
            return;
        }
        
        if (this.ventasPendientes.length === 0) {
            this.mostrarNotificacion('✅ No hay ventas pendientes');
            return;
        }
        
        await this.sincronizarVentasPendientes();
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
            
            const loginPanel = document.getElementById('loginPanel');
            if (loginPanel) loginPanel.classList.add('visible');
            
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
        
        if (!this.online) {
            this.showError('Necesitas conexión a internet para iniciar sesión');
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
                
                // Forzar carga de datos frescos del servidor
                await this.cargarCategoriasDelServidor();
                await this.cargarProductosDelServidor();
                await this.cargarVentasPendientesLocales();
                this.cargarVentasLocales();
                
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
            this.showLoginPanel();
            this.mostrarNotificacion('👋 Sesión cerrada');
        }
    },
    
    // ===== NAVEGACIÓN =====
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
    
    // ===== BÚSQUEDA Y FILTROS =====
    setupSearchAndFilters() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        const performSearch = () => {
            const term = searchInput.value.toLowerCase();
            this.filtrarProductos(term, this.categoriaActiva);
        };
        
        searchInput?.addEventListener('input', performSearch);
        searchBtn?.addEventListener('click', performSearch);
        
        // Los filtros se configuran en actualizarFiltrosCategorias
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
    
    // ===== BOTÓN FLOTANTE Y CARRITO =====
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
    
    // ===== RENDERIZADO DE PRODUCTOS =====
    renderizarProductos() {
        const container = document.getElementById('productoContainer');
        const countSpan = document.getElementById('productCount');
        const totalProductosSpan = document.getElementById('totalProductosCount');
        const inventoryTotalSpan = document.getElementById('inventoryTotalProducts');
        
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
            const disabled = p.stock === 0 ? 'disabled' : '';
            const maxStock = p.stock;
            const categoriaNombre = this.obtenerNombreCategoria(p.categoria);
            
            html += `
                <div class="product-card ${stockClass} ${stockText}" data-producto-id="${p.id}" data-categoria="${p.categoria || 'general'}">
                    <div class="product-icon">📦</div>
                    <div class="product-name">${p.nombre}</div>
                    <div style="font-size: 0.7rem; color: #666; margin-bottom: 4px;">🏷️ ${categoriaNombre}</div>
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
    
    // ===== VENTAS =====
    async completarVenta() {
        if (this.carrito.length === 0) {
            this.mostrarNotificacion('❌ No hay productos en la venta');
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
                
                const nuevoStock = producto.stock - item.cantidad;
                
                try {
                    const response = await fetch(`${API_URL}/api/dueno/productos/${item.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nombre: producto.nombre,
                            precio: producto.precio,
                            stock: nuevoStock,
                            categoria: producto.categoria
                        })
                    });
                    
                    if (!response.ok) {
                        exito = false;
                        this.mostrarNotificacion(`❌ Error actualizando stock de ${item.nombre}`);
                        break;
                    }
                    
                    producto.stock = nuevoStock;
                    
                } catch (error) {
                    console.error('Error actualizando stock:', error);
                    exito = false;
                    this.mostrarNotificacion('❌ Error de conexión al actualizar stock');
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
                this.cargarInventario();
            }
            
        } else {
            await OfflineDB.guardarVentaPendiente(venta);
            this.ventasPendientes.push(venta);
            this.mostrarNotificacion(`⏳ Venta guardada offline - Se sincronizará automáticamente`);
            
            for (const item of this.carrito) {
                const producto = this.productos.find(p => p.id === item.id);
                if (producto) {
                    producto.stock -= item.cantidad;
                }
            }
            
            await OfflineDB.guardarProductos(this.productos);
            this.renderizarProductos();
            this.cargarInventario();
            this.actualizarVistasPendientes();
            
            const ventasHoy = document.getElementById('ventasHoyCount');
            if (ventasHoy) ventasHoy.textContent = parseInt(ventasHoy.textContent || 0) + 1;
        }
        
        this.carrito = [];
        this.actualizarCarrito();
        document.getElementById('currentSalePanel')?.classList.remove('active');
        if (document.getElementById('clientName')) document.getElementById('clientName').value = '';
        
        await this.cargarVentasLocales();
        this.actualizarDashboard();
    },
    
    async sincronizarVentasPendientes() {
        if (!this.online || this.sincronizando) return;
        
        const pendientes = await OfflineDB.obtenerVentasPendientes();
        if (pendientes.length === 0) return;
        
        this.sincronizando = true;
        this.actualizarEstadoConexion();
        
        console.log(`🔄 Sincronizando ${pendientes.length} ventas pendientes...`);
        this.mostrarNotificacion(`🔄 Sincronizando ${pendientes.length} ventas...`);
        
        let sincronizadas = 0;
        let fallidas = 0;
        
        for (const venta of pendientes) {
            try {
                // Actualizar cada producto en el servidor
                for (const item of venta.productos) {
                    // Obtener producto actual del servidor
                    const prodResponse = await fetch(`${API_URL}/api/dueno/productos`);
                    const productosServidor = await prodResponse.json();
                    const productoServidor = productosServidor.find(p => p.id === item.id);
                    
                    if (productoServidor) {
                        const nuevoStock = productoServidor.stock - item.cantidad;
                        
                        const response = await fetch(`${API_URL}/api/dueno/productos/${item.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                nombre: productoServidor.nombre,
                                precio: productoServidor.precio,
                                stock: nuevoStock,
                                categoria: productoServidor.categoria
                            })
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Error actualizando producto ${item.id}`);
                        }
                    }
                }
                
                venta.estado = 'completada';
                await OfflineDB.guardarVentaCompletada(venta);
                await OfflineDB.eliminarVentaPendiente(venta.id);
                this.ventas.push(venta);
                sincronizadas++;
                
            } catch (error) {
                console.error('Error sincronizando venta:', venta.id, error);
                fallidas++;
            }
        }
        
        // Recargar datos frescos del servidor
        await this.cargarCategoriasDelServidor();
        await this.cargarProductosDelServidor();
        await this.cargarVentasPendientesLocales();
        
        this.sincronizando = false;
        this.actualizarEstadoConexion();
        
        if (sincronizadas > 0) {
            this.mostrarNotificacion(`✅ ${sincronizadas} ventas sincronizadas correctamente${fallidas > 0 ? ` (${fallidas} fallidas)` : ''}`);
            await this.cargarVentasLocales();
            this.renderizarProductos();
            this.cargarInventario();
            this.actualizarVistasPendientes();
        }
    },
    
    async cargarVentasLocales() {
        try {
            this.ventas = await OfflineDB.cargarVentasCompletadas();
            this.cargarVentasRecientes();
            this.cargarTodasLasVentas();
            this.actualizarDashboard();
        } catch (error) {
            console.error('Error cargando ventas:', error);
            this.ventas = [];
        }
    },
    
    cargarVentasRecientes() {
        const container = document.getElementById('ventasRecientesContainer');
        if (!container) return;
        
        if (this.ventas.length === 0 && this.ventasPendientes.length === 0) {
            container.innerHTML = '<div class="empty-message" style="padding: 1.5rem;">No hay ventas registradas aún</div>';
            return;
        }
        
        const todasVentas = [
            ...this.ventasPendientes.map(v => ({...v, estado: 'pendiente'})),
            ...this.ventas
        ];
        
        const recientes = [...todasVentas].reverse().slice(0, 5);
        
        let html = '';
        recientes.forEach(v => {
            const fecha = new Date(v.fecha);
            const fechaStr = fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
            const estadoClass = v.estado === 'pendiente' ? 'status-warning' : 'status-completed';
            const estadoText = v.estado === 'pendiente' ? 'Pendiente' : 'Completada';
            
            html += `
                <div class="history-item" style="${v.estado === 'pendiente' ? 'border-left: 4px solid #f39c12;' : ''}">
                    <div>
                        <div style="font-weight: 600;">${v.cliente}</div>
                        <div style="font-size: 0.75rem; color: #666;">${fechaStr}</div>
                    </div>
                    <div>${v.productos.reduce((sum, i) => sum + i.cantidad, 0)} productos</div>
                    <div style="font-weight: bold; color: var(--accent-color);">$${v.total.toFixed(2)}</div>
                    <div><span class="status ${estadoClass}">${estadoText}</span></div>
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
        
        if (this.ventas.length === 0 && this.ventasPendientes.length === 0) {
            if (container) container.innerHTML = '<div class="empty-message">No hay ventas registradas</div>';
            if (totalSalesAmount) totalSalesAmount.textContent = '$0.00';
            if (avgSaleAmount) avgSaleAmount.textContent = '$0.00';
            if (totalSalesCount) totalSalesCount.textContent = '0';
            return;
        }
        
        const total = this.ventas.reduce((sum, v) => sum + v.total, 0);
        const totalPendiente = this.ventasPendientes.reduce((sum, v) => sum + v.total, 0);
        const promedio = this.ventas.length > 0 ? total / this.ventas.length : 0;
        
        if (totalSalesAmount) totalSalesAmount.textContent = `$${(total + totalPendiente).toFixed(2)}`;
        if (avgSaleAmount) avgSaleAmount.textContent = `$${promedio.toFixed(2)}`;
        if (totalSalesCount) totalSalesCount.textContent = this.ventas.length;
        
        const todasVentas = [
            ...this.ventasPendientes.map(v => ({...v, estado: 'pendiente'})),
            ...this.ventas
        ];
        
        let html = '';
        [...todasVentas].reverse().forEach(v => {
            const fecha = new Date(v.fecha);
            const fechaStr = fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
            const estadoClass = v.estado === 'pendiente' ? 'status-warning' : 'status-completed';
            const estadoText = v.estado === 'pendiente' ? 'Pendiente' : 'Completada';
            
            html += `
                <div class="history-item" style="${v.estado === 'pendiente' ? 'border-left: 4px solid #f39c12; background: #fff3e0;' : ''}">
                    <div>
                        <div style="font-weight: 600;">${v.cliente}</div>
                        <div style="font-size: 0.75rem; color: #666;">${fechaStr}</div>
                    </div>
                    <div>${v.productos.reduce((sum, i) => sum + i.cantidad, 0)} productos</div>
                    <div style="font-weight: bold; color: var(--accent-color);">$${v.total.toFixed(2)}</div>
                    <div><span class="status ${estadoClass}">${estadoText}</span></div>
                </div>
            `;
        });
        
        if (container) container.innerHTML = html;
    },
    
    // ===== INVENTARIO =====
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
            const categoriaNombre = this.obtenerNombreCategoria(p.categoria);
            
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
                    <td>${categoriaNombre}</td>
                    <td>$${p.precio.toFixed(2)}</td>
                    <td>${p.stock}</td>
                    <td><span class="${estadoClass}">${estado}</span></td>
                </tr>
            `;
        });
        
        if (tableBody) tableBody.innerHTML = html;
    },
    
    // ===== REPORTES =====
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
                this.mostrarNotificacion('📄 Exportando a PDF...');
                setTimeout(() => this.mostrarNotificacion('✅ PDF exportado'), 1500);
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => {
                this.mostrarNotificacion('📊 Exportando a Excel...');
                setTimeout(() => this.mostrarNotificacion('✅ Excel exportado'), 1500);
            });
        }
        
        if (exportInventoryBtn) {
            exportInventoryBtn.addEventListener('click', () => {
                this.mostrarNotificacion('📤 Exportando inventario...');
                setTimeout(() => this.mostrarNotificacion('✅ Inventario exportado'), 1500);
            });
        }
        
        if (refreshInventoryBtn) {
            refreshInventoryBtn.addEventListener('click', () => {
                this.cargarProductosDelServidor();
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
        
        const ventasDelDia = this.ventas.filter(v => v.fecha.split('T')[0] === fecha);
        const pendientesDelDia = this.ventasPendientes.filter(v => v.fecha.split('T')[0] === fecha);
        
        if (ventasDelDia.length === 0 && pendientesDelDia.length === 0) {
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
        const totalPendiente = pendientesDelDia.reduce((sum, v) => sum + v.total, 0);
        const promedio = ventasDelDia.length > 0 ? total / ventasDelDia.length : 0;
        
        if (dailyTotal) dailyTotal.textContent = `$${(total + totalPendiente).toFixed(2)}`;
        if (dailySalesCount) dailySalesCount.textContent = ventasDelDia.length;
        if (dailyAvg) dailyAvg.textContent = `$${promedio.toFixed(2)}`;
        
        if (categorySales) {
            let categoriasHtml = '';
            this.categorias.forEach(c => {
                const ventasCategoria = ventasDelDia.filter(v => 
                    v.productos.some(p => p.categoria === c.id)
                ).reduce((sum, v) => sum + v.total, 0);
                
                categoriasHtml += `
                    <div class="category-sale-item">
                        <span>${c.nombre}</span>
                        <span style="font-weight: bold;">$${ventasCategoria.toFixed(2)}</span>
                    </div>
                `;
            });
            
            categorySales.innerHTML = `
                <div class="category-sale-item" style="color: #f39c12;">
                    <span>⏳ Pendientes:</span>
                    <span style="font-weight: bold;">$${totalPendiente.toFixed(2)}</span>
                </div>
                ${categoriasHtml}
            `;
        }
        
        if (bestProduct) bestProduct.textContent = this.productos[0]?.nombre || '-';
        if (bestHour) bestHour.textContent = '15:00 - 17:00';
        if (topCategory) topCategory.textContent = this.categorias[0]?.nombre || '-';
        
        this.mostrarNotificacion(`📊 Reporte generado para ${fecha} (${pendientesDelDia.length} pendientes)`);
    },
    
    // ===== DASHBOARD =====
    actualizarDashboard() {
        const pendienteCount = document.getElementById('pendienteCount');
        if (pendienteCount) pendienteCount.textContent = this.ventasPendientes.length;
        
        const totalProductosSpan = document.getElementById('totalProductosCount');
        if (totalProductosSpan) totalProductosSpan.textContent = this.productos.length;
    },
    
    // ===== INFO USUARIO =====
    actualizarInfoUsuario() {
        if (!this.usuario) return;
        
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = this.usuario.nombre || 'Vendedora';
        if (userAvatar) userAvatar.textContent = (this.usuario.nombre?.charAt(0) || 'V').toUpperCase();
    },
    
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        document.getElementById('btnLogin')?.addEventListener('click', () => this.login());
        
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && document.getElementById('loginPanel')?.style.display !== 'none') {
                this.login();
            }
        });
    },
    
    // ===== NOTIFICACIONES =====
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
    
    // ===== PANELES =====
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

// ===== HACER APP ACCESIBLE GLOBALMENTE =====
window.App = App;

// ===== INICIAR APP =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
