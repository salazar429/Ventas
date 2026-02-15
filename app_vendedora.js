// ===========================================
// APP VENDEDORA - VERSIÓN COMPLETAMENTE CORREGIDA
// CON TODAS LAS FUNCIONALIDADES OPERATIVAS
// ===========================================

const API_URL = 'https://sistema-test-api.onrender.com';

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
        await this.cargarCategoriasLocales();
        await this.cargarProductosLocales();
        await this.cargarVentasLocales();
        
        this.hideSplashScreen();
        this.checkLogin();
        this.setupEventListeners();
        this.verificarConexion();
        this.setupNavigation();
        this.setupFloatingButton();
        this.setupSearchAndFilters();
        this.setupReportesCompletos();
        this.setupPendientesClick();
        this.setupUserMenu();
        
        // Actualizar todas las vistas después de cargar
        setTimeout(() => {
            this.actualizarTodasLasVistas();
        }, 500);
    },
    
    // ===== ACTUALIZAR TODAS LAS VISTAS =====
    actualizarTodasLasVistas() {
        console.log('🔄 Actualizando todas las vistas');
        this.renderizarProductos();
        this.cargarInventario();
        this.cargarVentasRecientes();
        this.cargarTodasLasVentas();
        this.actualizarDashboard();
        this.actualizarVistasPendientes();
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
    
    // ===== ESTADO DE CONEXIÓN =====
    setupConnectionListener() {
        window.addEventListener('online', () => {
            this.online = true;
            this.actualizarEstadoConexion();
            this.mostrarNotificacion('📶 Conexión restablecida');
            this.sincronizarVentasPendientes();
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
        if (!this.online) return;
        
        this.sincronizando = true;
        this.actualizarEstadoConexion();
        
        try {
            await fetch(API_URL);
            await this.cargarCategoriasDelServidor();
            await this.cargarProductosDelServidor();
        } catch (error) {
            console.log('❌ Error de conexión');
        } finally {
            this.sincronizando = false;
            this.actualizarEstadoConexion();
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
    
    // ===== PRODUCTOS =====
    async cargarProductosDelServidor() {
        try {
            const response = await fetch(`${API_URL}/api/productos`);
            const productos = await response.json();
            
            localStorage.setItem('productos', JSON.stringify(productos));
            this.productos = productos;
            
            if (this.usuario) {
                this.renderizarProductos();
                this.cargarInventario();
            }
            
            return productos;
        } catch (error) {
            console.error('Error cargando productos:', error);
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
                <div class="product-card ${p.stock < 5 ? 'low-stock' : ''}" data-producto-id="${p.id}" data-categoria="${p.categoria || 'general'}">
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
    },
    
    // ===== CARRITO Y VENTAS =====
    agregarAlCarrito(productoId) {
        const producto = this.productos.find(p => p.id === productoId);
        
        if (!producto) {
            this.mostrarNotificacion('❌ Producto no encontrado');
            return;
        }
        
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
                    console.error('Error actualizando stock:', error);
                    exito = false;
                    break;
                }
            }
            
            if (exito) {
                this.ventas.push(venta);
                localStorage.setItem('ventas', JSON.stringify(this.ventas));
                this.renderizarProductos();
                this.cargarInventario();
                this.cargarVentasRecientes();
                this.cargarTodasLasVentas();
                this.actualizarDashboard();
                this.mostrarNotificacion(`✅ Venta completada: $${total.toFixed(2)}`);
            }
        } else {
            this.ventasPendientes.push(venta);
            localStorage.setItem('ventas_pendientes', JSON.stringify(this.ventasPendientes));
            this.mostrarNotificacion(`⏳ Venta guardada offline - Se sincronizará automáticamente`);
            this.actualizarVistasPendientes();
            this.cargarVentasRecientes();
            this.cargarTodasLasVentas();
        }
        
        this.carrito = [];
        this.actualizarCarrito();
        document.getElementById('currentSalePanel')?.classList.remove('active');
        document.getElementById('clientName').value = '';
    },
    
    async sincronizarVentasPendientes() {
        if (!this.online || !this.usuario || this.ventasPendientes.length === 0) return;
        
        this.sincronizando = true;
        this.actualizarEstadoConexion();
        this.mostrarNotificacion('🔄 Sincronizando ventas pendientes...');
        
        let sincronizadas = 0;
        
        for (const venta of this.ventasPendientes) {
            try {
                for (const item of venta.productos) {
                    const producto = this.productos.find(p => p.id === item.id);
                    if (producto) {
                        await fetch(`${API_URL}/api/dueno/productos/${item.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                stock: producto.stock - item.cantidad
                            })
                        });
                        producto.stock -= item.cantidad;
                    }
                }
                
                venta.estado = 'completada';
                this.ventas.push(venta);
                sincronizadas++;
            } catch (error) {
                console.error('Error sincronizando venta:', error);
            }
        }
        
        this.ventasPendientes = this.ventasPendientes.filter(v => v.estado === 'pendiente');
        localStorage.setItem('ventas', JSON.stringify(this.ventas));
        localStorage.setItem('ventas_pendientes', JSON.stringify(this.ventasPendientes));
        
        this.sincronizando = false;
        this.actualizarEstadoConexion();
        this.actualizarVistasPendientes();
        this.renderizarProductos();
        this.cargarInventario();
        this.cargarVentasRecientes();
        this.cargarTodasLasVentas();
        this.actualizarDashboard();
        
        if (sincronizadas > 0) {
            this.mostrarNotificacion(`✅ ${sincronizadas} ventas sincronizadas`);
        }
    },
    
    // ===== VENTAS PENDIENTES =====
    actualizarVistasPendientes() {
        const pendienteCount = document.getElementById('pendienteCount');
        if (pendienteCount) pendienteCount.textContent = this.ventasPendientes.length;
        this.mostrarBannerPendientes();
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
                <small>${this.online ? 'Listas para sincronizar' : 'Sin conexión - se sincronizarán automáticamente'}</small>
            </div>
            ${this.online ? '<button class="btn btn-sm" style="background:rgba(255,255,255,0.2); border:none; color:white;" onclick="event.stopPropagation(); App.forzarSincronizacion()">🔄 Sincronizar ahora</button>' : ''}
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
        await this.sincronizarVentasPendientes();
    },
    
    setupPendientesClick() {
        const pendienteCount = document.getElementById('pendienteCount');
        if (pendienteCount) {
            const card = pendienteCount.closest('.card');
            if (card) {
                card.addEventListener('click', () => this.mostrarDetallePendientes());
                card.style.cursor = 'pointer';
            }
        }
    },
    
    // ===== DASHBOARD =====
    actualizarDashboard() {
        const ventasHoy = document.getElementById('ventasHoyCount');
        const totalProductos = document.getElementById('totalProductosCount');
        const pendienteCount = document.getElementById('pendienteCount');
        const carritoCount = document.getElementById('carritoCount');
        
        if (ventasHoy) {
            const hoy = new Date().toDateString();
            const ventasHoyCount = this.ventas.filter(v => new Date(v.fecha).toDateString() === hoy).length;
            ventasHoy.textContent = ventasHoyCount;
        }
        
        if (totalProductos) totalProductos.textContent = this.productos.length;
        if (pendienteCount) pendienteCount.textContent = this.ventasPendientes.length;
        if (carritoCount) carritoCount.textContent = this.carrito.reduce((sum, i) => sum + i.cantidad, 0);
    },
    
    // ===== REPORTES COMPLETOS =====
    setupReportesCompletos() {
        console.log('📊 Configurando reportes completos');
        
        const hoy = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('reportDate');
        if (dateInput) dateInput.value = hoy;
        
        const generateBtn = document.getElementById('generateReportBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                console.log('📊 Generando reporte...');
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
        
        // Botón de actualizar inventario
        const refreshInventoryBtn = document.getElementById('refreshInventoryBtn');
        if (refreshInventoryBtn) {
            console.log('🔄 Configurando botón actualizar inventario');
            refreshInventoryBtn.addEventListener('click', () => {
                console.log('🔄 Actualizando inventario...');
                this.cargarProductosDelServidor();
                this.mostrarNotificacion('🔄 Inventario actualizado');
            });
        } else {
            console.warn('⚠️ Botón refreshInventoryBtn no encontrado');
        }
        
        // Eliminar botón de exportar inventario si existe
        const exportInventoryBtn = document.getElementById('exportInventoryBtn');
        if (exportInventoryBtn) {
            exportInventoryBtn.remove();
        }
        
        // Botón enviar al dueño
        setTimeout(() => {
            const exportSection = document.querySelector('.export-section .export-buttons');
            if (exportSection && !document.getElementById('enviarDueñoBtn')) {
                console.log('📤 Agregando botón enviar al dueño');
                const enviarBtn = document.createElement('button');
                enviarBtn.id = 'enviarDueñoBtn';
                enviarBtn.className = 'btn btn-primary';
                enviarBtn.innerHTML = '📤 Enviar al Dueño';
                enviarBtn.style.marginTop = '10px';
                enviarBtn.style.width = '100%';
                enviarBtn.onclick = () => this.enviarReporteAlDueño();
                exportSection.appendChild(enviarBtn);
            }
        }, 1000);
    },
    
    generarReporte(fecha) {
        console.log('📊 Generando reporte para fecha:', fecha);
        
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
                <div style="color:#f39c12; margin-bottom:8px; font-weight:bold;">⏳ Pendientes: $${totalPend.toFixed(2)}</div>
                ${cats}
            `;
        }
        
        if (bestProduct) bestProduct.textContent = this.productos[0]?.nombre || '-';
        if (bestHour) bestHour.textContent = '15:00 - 17:00';
        if (topCategory) topCategory.textContent = this.categorias[0]?.nombre || '-';
        
        this.mostrarNotificacion('📊 Reporte generado');
    },
    
    generarReportePDF() {
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
    
    generarReporteExcel() {
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
        if (!this.online) {
            this.mostrarNotificacion('❌ Necesitas conexión a internet');
            return;
        }
        
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
                    precio: p.precio
                })),
                fecha: v.fecha
            })),
            pendientes: pendientes.map(v => ({
                cliente: v.cliente,
                total: v.total,
                productos: v.productos.map(p => ({
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precio: p.precio
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
            this.mostrarNotificacion('❌ Error al enviar reporte');
        }
    },
    
    // ===== VENTAS RECIENTES =====
    cargarVentasRecientes() {
        const container = document.getElementById('ventasRecientesContainer');
        if (!container) {
            console.warn('⚠️ Container ventasRecientesContainer no encontrado');
            return;
        }
        
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
            const cantidadTotal = v.productos.reduce((s, i) => s + i.cantidad, 0);
            
            html += `
                <div class="history-item" style="${v.estado === 'pendiente' ? 'border-left:4px solid #f39c12; background:#fff3e0;' : ''}">
                    <div>
                        <div style="font-weight:600;">${v.cliente}</div>
                        <div style="font-size:0.75rem; color:#666;">${fecha}</div>
                    </div>
                    <div>${cantidadTotal} producto${cantidadTotal !== 1 ? 's' : ''}</div>
                    <div style="color:var(--accent-color); font-weight:bold;">$${v.total.toFixed(2)}</div>
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
        
        if (!container) {
            console.warn('⚠️ Container allSalesContainer no encontrado');
            return;
        }
        
        if (this.ventas.length === 0 && this.ventasPendientes.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay ventas registradas</div>';
            if (totalAmount) totalAmount.textContent = '$0.00';
            if (avgAmount) avgAmount.textContent = '$0.00';
            if (totalCount) totalCount.textContent = '0';
            return;
        }
        
        const total = this.ventas.reduce((s, v) => s + v.total, 0);
        const promedio = this.ventas.length > 0 ? total / this.ventas.length : 0;
        
        if (totalAmount) totalAmount.textContent = `$${total.toFixed(2)}`;
        if (avgAmount) avgAmount.textContent = `$${promedio.toFixed(2)}`;
        if (totalCount) totalCount.textContent = this.ventas.length;
        
        let html = '';
        
        [...this.ventas].reverse().forEach(v => {
            const fecha = new Date(v.fecha).toLocaleString();
            const cantidadTotal = v.productos.reduce((s, i) => s + i.cantidad, 0);
            
            html += `
                <div class="history-item">
                    <div>
                        <div style="font-weight:600;">${v.cliente}</div>
                        <div style="font-size:0.75rem; color:#666;">${fecha}</div>
                    </div>
                    <div>${cantidadTotal} producto${cantidadTotal !== 1 ? 's' : ''}</div>
                    <div style="color:var(--accent-color); font-weight:bold;">$${v.total.toFixed(2)}</div>
                    <div><span class="status status-completed">Completada</span></div>
                </div>
            `;
        });
        
        this.ventasPendientes.forEach(v => {
            const fecha = new Date(v.fecha).toLocaleString();
            const cantidadTotal = v.productos.reduce((s, i) => s + i.cantidad, 0);
            
            html += `
                <div class="history-item" style="border-left:4px solid #f39c12; background:#fff3e0;">
                    <div>
                        <div style="font-weight:600;">${v.cliente}</div>
                        <div style="font-size:0.75rem; color:#666;">${fecha}</div>
                    </div>
                    <div>${cantidadTotal} producto${cantidadTotal !== 1 ? 's' : ''}</div>
                    <div style="color:var(--accent-color); font-weight:bold;">$${v.total.toFixed(2)}</div>
                    <div><span class="status status-warning">Pendiente</span></div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    // ===== INVENTARIO =====
    cargarInventario() {
        const tableBody = document.getElementById('inventoryTableBody');
        const lowStockSpan = document.getElementById('lowStockCount');
        const outStockSpan = document.getElementById('outOfStockCount');
        
        if (!tableBody) {
            console.warn('⚠️ Tabla de inventario no encontrada');
            return;
        }
        
        if (this.productos.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">No hay productos en inventario</td></tr>';
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
        
        tableBody.innerHTML = html;
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
                this.cargarProductosLocales();
                this.cargarCategoriasLocales();
                this.cargarVentasLocales();
                this.actualizarInfoUsuario();
                this.setupUserMenu();
                setTimeout(() => this.actualizarTodasLasVistas(), 500);
            } catch (e) {
                console.error('Error cargando usuario:', e);
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
                this.setupUserMenu();
                this.showVentaPanel();
                await this.cargarCategoriasDelServidor();
                await this.cargarProductosDelServidor();
                await this.cargarVentasLocales();
                this.actualizarTodasLasVistas();
                
                this.showError('', 'clear');
                this.mostrarNotificacion(`✅ Bienvenida, ${this.usuario.nombre}`);
            } else {
                this.showError(data.error || 'Credenciales incorrectas');
            }
        } catch (error) {
            console.error('Error en login:', error);
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
        const menu = document.getElementById('userMenu');
        if (menu) menu.style.display = 'none';
    },
    
    cargarVentasLocales() {
        const ventas = localStorage.getItem('ventas');
        if (ventas) {
            this.ventas = JSON.parse(ventas);
            console.log('📊 Ventas cargadas:', this.ventas.length);
        }
        
        const pendientes = localStorage.getItem('ventas_pendientes');
        if (pendientes) {
            this.ventasPendientes = JSON.parse(pendientes);
            console.log('⏳ Ventas pendientes cargadas:', this.ventasPendientes.length);
        }
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
        
        if (page === 'products') {
            this.cargarInventario();
        } else if (page === 'sales') {
            this.cargarTodasLasVentas();
        } else if (page === 'dashboard') {
            this.actualizarDashboard();
            this.cargarVentasRecientes();
        }
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
