// script.js
// API de PRODUCTOS - FakeStoreAPI (para obtener productos con imágenes)
const PRODUCTS_ENDPOINT = 'https://fakestoreapi.com/products';

// API de LOGIN - EscuelaJS (para autenticación de usuarios)
const USERS_ENDPOINT = 'https://api.escuelajs.co/api/v1/users';

/* --------------------------
  Helper: Descripciones personalizadas
---------------------------*/
// Función que crea descripciones personalizadas para los productos
function makeCustomDescription(product){
  // Combina la categoría con los primeros 100 caracteres de la descripción
  return `Producto premium: ${product.category}. ${product.description?.substring(0, 100)}...`;
}

/* --------------------------
  Gestión de Modales - Controla la apertura/cierre de ventanas modales
---------------------------*/
const modalManager = {
  // Abre un modal por su ID
  abrirModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden'); // Muestra el modal
    document.body.style.overflow = 'hidden'; // Evita scroll en el fondo
  },
  
  // Cierra un modal por su ID
  cerrarModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('hidden'); // Oculta el modal
    document.body.style.overflow = 'auto'; // Restaura el scroll
  },
  
  // Cierra todos los modales de la página
  cerrarTodosModales() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
    document.body.style.overflow = 'auto';
  },
  
  // Configura todos los event listeners para los modales
  setupModalListeners() {
    // Cerrar modales al hacer click fuera del contenido
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.cerrarModal(modal.id);
        }
      });
    });
    
    // Botones de cerrar específicos para cada modal
    document.getElementById('cerrar-carrito').addEventListener('click', () => {
      this.cerrarModal('carrito-modal');
    });
    
    document.getElementById('cerrar-login').addEventListener('click', () => {
      this.cerrarModal('login-modal');
    });
    
    document.getElementById('cerrar-confirmar').addEventListener('click', () => {
      this.cerrarModal('confirmar-modal');
    });
    
    document.getElementById('cancelar-compra').addEventListener('click', () => {
      this.cerrarModal('confirmar-modal');
    });
    
    // Botones de abrir modales
    document.getElementById('carrito-btn').addEventListener('click', () => {
      this.abrirModal('carrito-modal');
    });
    
    document.getElementById('login-btn').addEventListener('click', () => {
      this.abrirModal('login-modal');
    });
  }
};

/* --------------------------
  Carrito: Objeto que gestiona el carrito de compras con estado y métodos
---------------------------*/
const carrito = {
  items: [], // Array que almacena los productos en el carrito
  
  // Agrega un producto al carrito o incrementa su cantidad si ya existe
  agregarItem(product){
    const found = this.items.find(i => i.id === product.id);
    if(found){
      found.qty += 1; // Incrementa cantidad si ya existe
    } else {
      // Agrega nuevo producto al carrito
      this.items.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        qty: 1,
        img: product.image,
        customDescription: product.customDescription
      });
    }
    this.save(); // Guarda en localStorage
    this.renderizarCarrito(); // Actualiza la vista
    this.mostrarNotificacion('Producto añadido al carrito'); // Muestra notificación
  },
  
  // Elimina un producto del carrito por su ID
  removerItem(productId){
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
    this.renderizarCarrito();
    this.mostrarNotificacion('Producto eliminado');
  },
  
  // Cambia la cantidad de un producto específico
  cambiarCantidad(productId, qty){
    const item = this.items.find(i => i.id === productId);
    if(!item) return;
    item.qty = qty;
    if(item.qty <= 0) this.removerItem(productId); // Elimina si cantidad es 0 o menos
    this.save();
    this.renderizarCarrito();
  },
  
  // Incrementa en 1 la cantidad de un producto
  aumentarCantidad(productId) {
    const item = this.items.find(i => i.id === productId);
    if (item) {
      item.qty += 1;
      this.save();
      this.renderizarCarrito();
    }
  },
  
  // Disminuye en 1 la cantidad de un producto (mínimo 1)
  disminuirCantidad(productId) {
    const item = this.items.find(i => i.id === productId);
    if (item && item.qty > 1) {
      item.qty -= 1;
      this.save();
      this.renderizarCarrito();
    }
  },
  
  // Calcula el total de la compra sumando todos los items
  calcularTotal(){
    return this.items.reduce((acc, it) => acc + it.price * it.qty, 0);
  },
  
  // Calcula la cantidad total de productos en el carrito
  obtenerCantidadTotal(){
    return this.items.reduce((total, item) => total + item.qty, 0);
  },
  
  // Verifica si el carrito tiene items
  tieneItems(){
    return this.items.length > 0;
  },
  
  // Muestra una notificación temporal en la esquina superior derecha
  mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 1001;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notificacion);
    
    // Elimina la notificación después de 2 segundos
    setTimeout(() => {
      notificacion.remove();
    }, 2000);
  },
  
  // Renderiza la interfaz del carrito en el modal
  renderizarCarrito(){
    const container = document.getElementById('carrito-items');
    const totalElement = document.getElementById('carrito-total');
    const vaciarBtn = document.getElementById('vaciar-carrito');
    const comprarBtn = document.getElementById('comprar-btn');
    
    container.innerHTML = ''; // Limpia el contenedor
    
    // Si el carrito está vacío, muestra mensaje y oculta botones
    if(!this.tieneItems()){
      container.innerHTML = '<p class="carrito-vacio">El carrito está vacío</p>';
      totalElement.textContent = 'Total: $0.00';
      vaciarBtn.style.display = 'none';
      comprarBtn.style.display = 'none';
      this.actualizarContadorCarrito();
      return;
    }
    
    // Muestra botones si hay items
    vaciarBtn.style.display = 'block';
    comprarBtn.style.display = 'block';
    
    // Renderiza cada item del carrito
    this.items.forEach(it => {
      const div = document.createElement('div');
      div.className = 'carrito-item';
      div.innerHTML = `
        <img src="${it.img}" alt="${escapeHtml(it.title)}" class="carrito-item-img">
        <div class="meta">
          <h4>${escapeHtml(it.title)}</h4>
          <p class="carrito-desc">${escapeHtml(it.customDescription)}</p>
          <small>$${it.price.toFixed(2)} c/u</small>
          <div class="carrito-subtotal">
            Subtotal: $${(it.price * it.qty).toFixed(2)}
          </div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn minus" data-id="${it.id}">−</button>
          <input type="number" min="1" value="${it.qty}" data-id="${it.id}" class="item-qty">
          <button class="qty-btn plus" data-id="${it.id}">+</button>
          <button class="remove" data-id="${it.id}">🗑️</button>
        </div>
      `;
      container.appendChild(div);
    });

    // Calcula y muestra el total
    const total = this.calcularTotal();
    totalElement.innerHTML = `
      <div class="total-info">
        <div class="total-line">Subtotal: $${total.toFixed(2)}</div>
        <div class="total-line">Productos: ${this.obtenerCantidadTotal()}</div>
        <div class="total-final">Total: $${total.toFixed(2)}</div>
      </div>
    `;
    
    this.actualizarContadorCarrito();
    this.agregarEventListenersCarrito();
  },
  
  // Actualiza el contador de productos en el icono del carrito
  actualizarContadorCarrito() {
    const contador = document.getElementById('carrito-contador');
    const cantidad = this.obtenerCantidadTotal();
    contador.textContent = cantidad > 0 ? cantidad.toString() : '';
    contador.style.display = cantidad > 0 ? 'flex' : 'none';
  },
  
  // Agrega event listeners a los controles de cantidad del carrito
  agregarEventListenersCarrito() {
    // Botones de incrementar cantidad
    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.dataset.id);
        this.aumentarCantidad(id);
      });
    });
    
    // Botones de disminuir cantidad
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.dataset.id);
        this.disminuirCantidad(id);
      });
    });
    
    // Inputs de cantidad (cambio manual)
    document.querySelectorAll('.item-qty').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = Number(e.target.dataset.id);
        const qty = Math.max(1, Number(e.target.value) || 1); // Mínimo 1
        this.cambiarCantidad(id, qty);
      });
    });
    
    // Botones de eliminar producto
    document.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.dataset.id);
        if (confirm('¿Eliminar este producto?')) {
          this.removerItem(id);
        }
      });
    });
  },
  
  // Prepara la compra mostrando el modal de confirmación
  procesarCompra() {
    if (!this.tieneItems()) {
      alert('El carrito está vacío');
      return;
    }
    
    const mensaje = `¿Confirmas la compra de ${this.obtenerCantidadTotal()} productos por un total de $${this.calcularTotal().toFixed(2)}?`;
    document.getElementById('mensaje-confirmacion').textContent = mensaje;
    
    modalManager.cerrarModal('carrito-modal');
    modalManager.abrirModal('confirmar-modal');
  },
  
  // Confirma y procesa la compra (simulación)
  confirmarCompra() {
    // Simular proceso de compra
    this.mostrarNotificacion('¡Compra realizada con éxito!');
    
    // Limpiar carrito después de la compra
    this.items = [];
    this.save();
    this.renderizarCarrito();
    
    modalManager.cerrarModal('confirmar-modal');
  },
  
  // Guarda el carrito en localStorage
  save(){
    try{
      localStorage.setItem('carrito_v1', JSON.stringify(this.items));
    }catch(e){ console.warn('No se pudo guardar carrito', e); }
  },
  
  // Carga el carrito desde localStorage
  load(){
    try{
      const raw = localStorage.getItem('carrito_v1');
      if(raw) this.items = JSON.parse(raw);
    }catch(e){ console.warn('No se pudo cargar carrito', e); }
  },
  
  // Vacía todo el carrito previa confirmación
  clear(){
    if(this.tieneItems() && confirm('¿Vaciar todo el carrito?')) {
      this.items = [];
      this.save();
      this.renderizarCarrito();
      this.mostrarNotificacion('Carrito vaciado');
    }
  }
};

// Función de utilidad para escapar HTML y prevenir inyección
function escapeHtml(str){
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

/* --------------------------
  Renderizado de productos - Obtiene y muestra los productos en el catálogo
---------------------------*/
async function fetchAndRenderProducts(){
  const container = document.getElementById('catalogo-productos');
  container.innerHTML = '<p class="cargando">Cargando productos...</p>';
  
  try{
    // Fetch a la API de productos
    const res = await fetch(PRODUCTS_ENDPOINT);
    if(!res.ok) throw new Error('Error al obtener productos');
    const products = await res.json();

    container.innerHTML = ''; // Limpia el loading
    
    // Crea una tarjeta para cada producto
    products.forEach(p => {
      p.customDescription = makeCustomDescription(p); // Añade descripción personalizada

      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">
        <h3>${escapeHtml(p.title)}</h3>
        <p class="description">${escapeHtml(p.customDescription)}</p>
        <div class="price">$${Number(p.price).toFixed(2)}</div>
        <div class="actions">
          <button data-id="${p.id}" class="add-to-cart">🛒 Añadir al carrito</button>
          <small class="muted">${escapeHtml(p.category)}</small>
        </div>
      `;
      container.appendChild(card);
    });

    // Agrega event listeners a los botones "Añadir al carrito"
    container.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.dataset.id);
        const product = products.find(x => x.id === id);
        carrito.agregarItem(product);
      });
    });

  } catch(err){
    console.error(err);
    container.innerHTML = `<p class="error">Error cargando productos. Intenta recargar la página.</p>`;
  }
}

/* --------------------------
  Sistema de Autenticación - Maneja login/logout de usuarios
---------------------------*/
function setupAuth(){
  const loginForm = document.getElementById('login-form');
  const userInfo = document.getElementById('user-info');
  const welcome = document.getElementById('welcome');
  const logoutBtn = document.getElementById('logout-btn');
  const loginBtn = document.getElementById('login-btn');

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  // Cierra el modal de login al cargar la página (medida de seguridad)
  modalManager.cerrarModal('login-modal');

  // Verifica si hay un usuario guardado en localStorage
  const savedUser = localStorage.getItem('demo_user');
  if(savedUser){
    const u = JSON.parse(savedUser);
    showUser(u.name); // Muestra la información del usuario
  }

  // Maneja el envío del formulario de login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if(!email || !password) return alert('Pon email y contraseña.');

    try{
      // Obtiene todos los usuarios de la API
      const res = await fetch(USERS_ENDPOINT);
      if(!res.ok) throw new Error('Error al verificar usuarios');
      const users = await res.json();

      // Busca el usuario con las credenciales proporcionadas
      const user = users.find(u => u.email === email && u.password === password);
      
      if(user){
        // Simula la generación de un token
        const mockToken = 'token_' + Date.now() + '_' + user.id;
        
        // Guarda la información del usuario en localStorage
        localStorage.setItem('demo_user', JSON.stringify({ 
          username: user.email, 
          name: user.name,
          token: mockToken 
        }));
        
        showUser(user.name);
        modalManager.cerrarModal('login-modal');
        alert(`¡Bienvenido ${user.name}!`);
      } else {
        alert('Credenciales incorrectas. Usa: john@mail.com / changeme');
      }
    }catch(err){
      console.error(err);
      alert('Error de conexión. Intenta más tarde.');
    }
  });

  // Maneja el logout del usuario
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('demo_user'); // Elimina datos de usuario
    hideUser(); // Oculta información del usuario
    alert('Sesión cerrada correctamente.');
  });

  // Muestra la información del usuario logueado
  function showUser(name){
    loginBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    welcome.textContent = `Hola ${name}`;
  }
  
  // Oculta la información del usuario y limpia el formulario
  function hideUser(){
    loginBtn.classList.remove('hidden');
    userInfo.classList.add('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
  }
}

/* --------------------------
  Inicialización de la aplicación - Se ejecuta cuando el DOM está listo
---------------------------*/
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar sistema de modales
  modalManager.setupModalListeners();
  
  // Cargar carrito desde localStorage y renderizarlo
  carrito.load();
  carrito.renderizarCarrito();
  
  // Configurar sistema de autenticación
  setupAuth();
  
  // Cargar y mostrar productos del catálogo
  await fetchAndRenderProducts();

  // Event listeners adicionales para botones del carrito
  document.getElementById('vaciar-carrito').addEventListener('click', () => {
    carrito.clear(); // Vacía el carrito
  });
  
  document.getElementById('comprar-btn').addEventListener('click', () => {
    carrito.procesarCompra(); // Inicia proceso de compra
  });
  
  document.getElementById('confirmar-compra').addEventListener('click', () => {
    carrito.confirmarCompra(); // Confirma la compra
  });
});