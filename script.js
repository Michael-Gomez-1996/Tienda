// script.js
// API de PRODUCTOS - FakeStoreAPI (con imágenes funcionando)
const PRODUCTS_ENDPOINT = 'https://fakestoreapi.com/products';

// API de LOGIN - EscuelaJS (la que ya funciona)
const USERS_ENDPOINT = 'https://api.escuelajs.co/api/v1/users';

/* --------------------------
  Helper: custom descriptions
---------------------------*/
function makeCustomDescription(product){
  return `Producto premium: ${product.category}. ${product.description?.substring(0, 100)}...`;
}

/* --------------------------
  Gestión de Modales
---------------------------*/
const modalManager = {
  abrirModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },
  
  cerrarModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  },
  
  cerrarTodosModales() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
    document.body.style.overflow = 'auto';
  },
  
  setupModalListeners() {
    // Cerrar modales al hacer click fuera
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.cerrarModal(modal.id);
        }
      });
    });
    
    // Botones de cerrar
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
    
    // Botones de abrir
    document.getElementById('carrito-btn').addEventListener('click', () => {
      this.abrirModal('carrito-modal');
    });
    
    document.getElementById('login-btn').addEventListener('click', () => {
      this.abrirModal('login-modal');
    });
  }
};

/* --------------------------
  Carrito: objeto con estado y métodos
---------------------------*/
const carrito = {
  items: [],
  
  agregarItem(product){
    const found = this.items.find(i => i.id === product.id);
    if(found){
      found.qty += 1;
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        qty: 1,
        img: product.image,
        customDescription: product.customDescription
      });
    }
    this.save();
    this.renderizarCarrito();
    this.mostrarNotificacion('Producto añadido al carrito');
  },
  
  removerItem(productId){
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
    this.renderizarCarrito();
    this.mostrarNotificacion('Producto eliminado');
  },
  
  cambiarCantidad(productId, qty){
    const item = this.items.find(i => i.id === productId);
    if(!item) return;
    item.qty = qty;
    if(item.qty <= 0) this.removerItem(productId);
    this.save();
    this.renderizarCarrito();
  },
  
  aumentarCantidad(productId) {
    const item = this.items.find(i => i.id === productId);
    if (item) {
      item.qty += 1;
      this.save();
      this.renderizarCarrito();
    }
  },
  
  disminuirCantidad(productId) {
    const item = this.items.find(i => i.id === productId);
    if (item && item.qty > 1) {
      item.qty -= 1;
      this.save();
      this.renderizarCarrito();
    }
  },
  
  calcularTotal(){
    return this.items.reduce((acc, it) => acc + it.price * it.qty, 0);
  },
  
  obtenerCantidadTotal(){
    return this.items.reduce((total, item) => total + item.qty, 0);
  },
  
  tieneItems(){
    return this.items.length > 0;
  },
  
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
    
    setTimeout(() => {
      notificacion.remove();
    }, 2000);
  },
  
  renderizarCarrito(){
    const container = document.getElementById('carrito-items');
    const totalElement = document.getElementById('carrito-total');
    const vaciarBtn = document.getElementById('vaciar-carrito');
    const comprarBtn = document.getElementById('comprar-btn');
    
    container.innerHTML = '';
    
    if(!this.tieneItems()){
      container.innerHTML = '<p class="carrito-vacio">El carrito está vacío</p>';
      totalElement.textContent = 'Total: $0.00';
      vaciarBtn.style.display = 'none';
      comprarBtn.style.display = 'none';
      this.actualizarContadorCarrito();
      return;
    }
    
    vaciarBtn.style.display = 'block';
    comprarBtn.style.display = 'block';
    
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
  
  actualizarContadorCarrito() {
    const contador = document.getElementById('carrito-contador');
    const cantidad = this.obtenerCantidadTotal();
    contador.textContent = cantidad > 0 ? cantidad.toString() : '';
    contador.style.display = cantidad > 0 ? 'flex' : 'none';
  },
  
  agregarEventListenersCarrito() {
    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.dataset.id);
        this.aumentarCantidad(id);
      });
    });
    
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.dataset.id);
        this.disminuirCantidad(id);
      });
    });
    
    document.querySelectorAll('.item-qty').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = Number(e.target.dataset.id);
        const qty = Math.max(1, Number(e.target.value) || 1);
        this.cambiarCantidad(id, qty);
      });
    });
    
    document.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.dataset.id);
        if (confirm('¿Eliminar este producto?')) {
          this.removerItem(id);
        }
      });
    });
  },
  
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
  
  confirmarCompra() {
    // Simular proceso de compra
    this.mostrarNotificacion('¡Compra realizada con éxito!');
    
    // Limpiar carrito
    this.items = [];
    this.save();
    this.renderizarCarrito();
    
    modalManager.cerrarModal('confirmar-modal');
  },
  
  save(){
    try{
      localStorage.setItem('carrito_v1', JSON.stringify(this.items));
    }catch(e){ console.warn('No se pudo guardar carrito', e); }
  },
  
  load(){
    try{
      const raw = localStorage.getItem('carrito_v1');
      if(raw) this.items = JSON.parse(raw);
    }catch(e){ console.warn('No se pudo cargar carrito', e); }
  },
  
  clear(){
    if(this.tieneItems() && confirm('¿Vaciar todo el carrito?')) {
      this.items = [];
      this.save();
      this.renderizarCarrito();
      this.mostrarNotificacion('Carrito vaciado');
    }
  }
};

// escape simple para evitar inyección en strings
function escapeHtml(str){
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

/* --------------------------
  Renderizado de productos
---------------------------*/
async function fetchAndRenderProducts(){
  const container = document.getElementById('catalogo-productos');
  container.innerHTML = '<p class="cargando">Cargando productos...</p>';
  try{
    const res = await fetch(PRODUCTS_ENDPOINT);
    if(!res.ok) throw new Error('Error al obtener productos');
    const products = await res.json();

    container.innerHTML = '';
    products.forEach(p=>{
      p.customDescription = makeCustomDescription(p);

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

    container.querySelectorAll('.add-to-cart').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const id = Number(e.target.dataset.id);
        const product = products.find(x=> x.id === id);
        carrito.agregarItem(product);
      });
    });

  } catch(err){
    console.error(err);
    container.innerHTML = `<p class="error">Error cargando productos. Intenta recargar la página.</p>`;
  }
}

/* --------------------------
  Login
---------------------------*/
function setupAuth(){
  const loginForm = document.getElementById('login-form');
  const userInfo = document.getElementById('user-info');
  const welcome = document.getElementById('welcome');
  const logoutBtn = document.getElementById('logout-btn');
  const loginBtn = document.getElementById('login-btn');

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const savedUser = localStorage.getItem('demo_user');
  if(savedUser){
    const u = JSON.parse(savedUser);
    showUser(u.name);
  }

  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if(!email || !password) return alert('Pon email y contraseña.');

    try{
      const res = await fetch(USERS_ENDPOINT);
      if(!res.ok) throw new Error('Error al verificar usuarios');
      const users = await res.json();

      const user = users.find(u => u.email === email && u.password === password);
      
      if(user){
        const mockToken = 'token_' + Date.now() + '_' + user.id;
        
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

  logoutBtn.addEventListener('click', ()=>{
    localStorage.removeItem('demo_user');
    hideUser();
    alert('Sesión cerrada correctamente.');
  });

  function showUser(name){
    loginBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    welcome.textContent = `Hola ${name}`;
  }
  
  function hideUser(){
    loginBtn.classList.remove('hidden');
    userInfo.classList.add('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
  }
}

/* --------------------------
  Inicialización
---------------------------*/
document.addEventListener('DOMContentLoaded', async ()=> {
  // Inicializar modales
  modalManager.setupModalListeners();
  
  // Inicializar carrito
  carrito.load();
  carrito.renderizarCarrito();
  
  // Configurar autenticación
  setupAuth();
  
  // Cargar productos
  await fetchAndRenderProducts();

  // Event listeners adicionales
  document.getElementById('vaciar-carrito').addEventListener('click', ()=>{
    carrito.clear();
  });
  
  document.getElementById('comprar-btn').addEventListener('click', ()=>{
    carrito.procesarCompra();
  });
  
  document.getElementById('confirmar-compra').addEventListener('click', ()=>{
    carrito.confirmarCompra();
  });
});