(function () {
  const body = document.body;
  const toggle = document.querySelector('[data-theme-toggle]');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function guardSession(basePath, expectedRole, redirectUrl) {
    return fetch(`${basePath}/api/profile_get.php`).then((res) => {
      if (res.status === 401 || res.status === 403) {
        window.location.href = redirectUrl;
        return false;
      }
      return res.json();
    }).then((data) => {
      if (data === false) return false;
      if (!data || !data.success || !data.user || data.user.role !== expectedRole) {
        window.location.href = redirectUrl;
        return false;
      }
      return true;
    }).catch(() => {
      window.location.href = redirectUrl;
      return false;
    });
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      body.setAttribute('data-theme', 'dark');
    } else {
      body.removeAttribute('data-theme');
    }
  }

  const stored = localStorage.getItem('theme');
  if (stored) {
    applyTheme(stored);
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      const isDark = body.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('theme', next);
    });
  }

  // Canvas dotted background
  const canvas = document.getElementById('dotted-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dots = [];
    const spacing = 26;
    const amplitude = 6;
    const speed = 0.0015;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      dots = [];
      for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
          dots.push({ x, y, offset: Math.random() * Math.PI * 2 });
        }
      }
    }

    function draw(time) {
      const isDark = body.getAttribute('data-theme') === 'dark';
      const dotColor = isDark ? 'rgba(200, 200, 200, 0.7)' : 'rgba(0, 0, 0, 0.45)';
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = dotColor;
      dots.forEach((dot) => {
        const wave = Math.sin(time * speed + dot.offset + dot.x * 0.01) * amplitude;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y + wave, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(draw);
  }

  // Basic form validation
  const forms = document.querySelectorAll('[data-validate]');
  forms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      const email = form.querySelector('input[type="email"]');
      const password = form.querySelector('input[type="password"]');
      let valid = true;

      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
        valid = false;
        email.setCustomValidity('Please enter a valid email');
      } else if (email) {
        email.setCustomValidity('');
      }

      if (password && password.value.length < 8) {
        valid = false;
        password.setCustomValidity('Password must be at least 8 characters');
      } else if (password) {
        password.setCustomValidity('');
      }

      if (!valid) {
        e.preventDefault();
        form.reportValidity();
      }
    });
  });

  // Simple API form submit (register/login)
  document.querySelectorAll('form[data-api]').forEach((form) => {
    const endpoint = form.getAttribute('data-api');
    const rolePrompt = form.querySelector('[data-role-prompt]');
    const submitButton = form.querySelector('button[type="submit"]');
    if (endpoint === 'login' && rolePrompt && submitButton) {
      const params = new URLSearchParams(window.location.search);
      const presetRole = params.get('role');
      if (presetRole === 'buyer' || presetRole === 'farmer') {
        const radio = form.querySelector(`input[name="role"][value="${presetRole}"]`);
        if (radio) {
          radio.checked = true;
          rolePrompt.hidden = false;
        }
      }
      submitButton.addEventListener('click', () => {
        rolePrompt.hidden = false;
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const messageEl = form.querySelector('[data-form-message]');
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        if (endpoint === 'login') {
          if (window.location.pathname.endsWith('admin-login.html')) {
            payload.role = 'admin';
          }
          const selectedRole = form.querySelector('input[name="role"]:checked');
          if (rolePrompt) {
            rolePrompt.hidden = false;
          }
          if (!selectedRole && !payload.role) {
            if (messageEl) {
              messageEl.style.display = 'block';
              messageEl.textContent = 'Please select a role to continue.';
            }
            return;
          }
        }
        const basePath = window.location.pathname.includes('/winnie/') ? '/winnie' : '';
        const res = await fetch(`${basePath}/api/${endpoint}.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (messageEl) {
          messageEl.style.display = 'block';
          messageEl.textContent = data.message || (data.success ? 'Success' : 'Request failed');
        }
        if (data.success && endpoint === 'register') {
          const basePath = window.location.pathname.includes('/winnie/') ? '/winnie' : '';
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect');
          const target = redirect ? `${basePath}/${redirect}` : `${basePath}/login.html`;
          window.location.href = target;
        }
        if (data.success && endpoint === 'login') {
          const basePath = window.location.pathname.includes('/winnie/') ? '/winnie' : '';
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect');
          if (redirect) {
            window.location.href = `${basePath}/${redirect}`;
          } else if (data.role === 'farmer') {
            window.location.href = `${basePath}/farmer/dashboard.html`;
          } else if (data.role === 'buyer') {
            window.location.href = `${basePath}/buyer/dashboard.html`;
          } else if (data.role === 'admin') {
            window.location.href = `${basePath}/admin/dashboard.html`;
          } else {
            window.location.href = `${basePath}/products.html`;
          }
        }
      } catch (err) {
        if (messageEl) {
          messageEl.style.display = 'block';
          messageEl.textContent = 'Network error. Please try again.';
        }
      }
    });
  });

  // Simple cart management (UI only)
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (e) {
      return [];
    }
  }

  function setCart(items) {
    localStorage.setItem('cart', JSON.stringify(items));
  }

  function updateCartCount() {
    const countEl = document.querySelector('[data-cart-count]');
    if (!countEl) return;
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEl.textContent = count;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    const item = {
      id: btn.getAttribute('data-id'),
      name: btn.getAttribute('data-name'),
      price: parseFloat(btn.getAttribute('data-price')),
      quantity: 1
    };
    const cart = getCart();
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push(item);
    }
    setCart(cart);
    updateCartCount();
  });

  const cartTable = document.querySelector('[data-cart-table]');
  if (cartTable) {
    const cart = getCart();
    const tbody = cartTable.querySelector('tbody');
    let total = 0;
    tbody.innerHTML = '';
    cart.forEach((item, index) => {
      const line = item.price * item.quantity;
      total += line;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>KES ${item.price.toFixed(2)}</td>
        <td>
          <input type="number" min="1" value="${item.quantity}" data-cart-qty="${index}" />
        </td>
        <td>KES ${line.toFixed(2)}</td>
        <td><button class="btn btn-ghost" data-cart-remove="${index}">Remove</button></td>
      `;
      tbody.appendChild(row);
    });

    const totalEl = document.querySelector('[data-cart-total]');
    if (totalEl) totalEl.textContent = `KES ${total.toFixed(2)}`;

    tbody.addEventListener('input', (e) => {
      const target = e.target;
      if (!target.matches('[data-cart-qty]')) return;
      const index = parseInt(target.getAttribute('data-cart-qty'), 10);
      const cartItems = getCart();
      cartItems[index].quantity = Math.max(1, parseInt(target.value, 10) || 1);
      setCart(cartItems);
      window.location.reload();
    });

    tbody.addEventListener('click', (e) => {
      const target = e.target;
      if (!target.matches('[data-cart-remove]')) return;
      const index = parseInt(target.getAttribute('data-cart-remove'), 10);
      const cartItems = getCart();
      cartItems.splice(index, 1);
      setCart(cartItems);
      window.location.reload();
    });
  }

  updateCartCount();

  // Admin UI helpers (modals, confirmations, sidepanel)
  const modalTriggers = document.querySelectorAll('[data-modal-open]');
  const modalClosers = document.querySelectorAll('[data-modal-close]');
  const modals = document.querySelectorAll('.admin-modal');

  function closeAllModals() {
    modals.forEach((modal) => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const id = trigger.getAttribute('data-modal-open');
      const modal = document.getElementById(id);
      if (!modal) return;
      closeAllModals();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    });
  });

  modalClosers.forEach((closer) => {
    closer.addEventListener('click', () => {
      closeAllModals();
    });
  });

  modals.forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });

  document.addEventListener('click', (e) => {
    const confirmTarget = e.target.closest('[data-confirm]');
    if (!confirmTarget) return;
    const message = confirmTarget.getAttribute('data-confirm') || 'Are you sure?';
    if (!window.confirm(message)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // Render products on home and buyer dashboards
  const productContainers = document.querySelectorAll('[data-products]');
  if (productContainers.length > 0) {
    const basePath = window.location.pathname.includes('/winnie/') ? '/winnie' : '';
    fetch(`${basePath}/api/products.php`)
      .then((res) => res.json())
      .then((products) => {
        productContainers.forEach((container) => {
          container.innerHTML = '';
          products.slice(0, 6).forEach((product) => {
            const card = document.createElement('div');
            card.className = 'ui-card product-card';
            const image = product.image_url ? product.image_url : `${basePath}/icon.png`;
            const description = product.description ? product.description : 'Freshly harvested and ready for delivery.';
            card.innerHTML = `
              <img src="${image}" alt="${product.name}" />
              <span class="badge">${escapeHtml(product.category)}</span>
              <h3>${escapeHtml(product.name)}</h3>
              <p class="helper">${escapeHtml(description)}</p>
              <p class="price">KES ${parseFloat(product.price_kes).toFixed(2)}</p>
              <button class="btn btn-primary" data-add-to-cart data-id="${product.id}" data-name="${escapeHtml(product.name)}" data-price="${product.price_kes}">Add to cart</button>
            `;
            container.appendChild(card);
          });
        });
      })
      .catch(() => {
        productContainers.forEach((container) => {
          container.innerHTML = '<div class="notice">Unable to load products right now.</div>';
        });
      });
  }

  // Farmer/Admin product CRUD (UI only, backed by API endpoints)
  const productForm = document.querySelector('[data-product-form]');
  const productTable = document.querySelector('[data-product-rows]');
  if (productForm && productTable) {
    const basePath = window.location.pathname.includes('/winnie/') ? '/winnie' : '';
    const messageEl = document.querySelector('[data-product-message]');

    async function fetchProducts() {
      const res = await fetch(`${basePath}/api/products.php`);
      const data = await res.json();
      productTable.innerHTML = '';
      data.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${escapeHtml(item.name)}</td>
          <td>KES ${parseFloat(item.price_kes).toFixed(2)}</td>
          <td>${item.quantity}</td>
          <td>${escapeHtml(item.status)}</td>
          <td>
            <button class="btn btn-ghost" data-edit="${item.id}">Edit</button>
            <button class="btn btn-ghost" data-delete="${item.id}">Delete</button>
          </td>
        `;
        row.dataset.product = JSON.stringify(item);
        productTable.appendChild(row);
      });
    }

    function showMessage(text) {
      if (!messageEl) return;
      messageEl.style.display = 'block';
      messageEl.textContent = text;
    }

    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(productForm);
      formData.set('price_kes', parseFloat(formData.get('price_kes') || 0));
      formData.set('quantity', parseInt(formData.get('quantity') || 0, 10));

      const isUpdate = formData.get('product_id') && parseInt(formData.get('product_id'), 10) > 0;
      const endpoint = isUpdate ? 'products_update' : 'products_create';

      try {
        const res = await fetch(`${basePath}/api/${endpoint}.php`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        showMessage(data.message || (data.success ? 'Saved' : 'Request failed'));
        if (data.success) {
          productForm.reset();
          productForm.querySelector('[name=\"product_id\"]').value = '';
          await fetchProducts();
        }
      } catch (err) {
        showMessage('Network error. Please try again.');
      }
    });

    productTable.addEventListener('click', async (e) => {
      const target = e.target;
      if (target.matches('[data-edit]')) {
        const row = target.closest('tr');
        const item = JSON.parse(row.dataset.product);
        productForm.querySelector('[name=\"product_id\"]').value = item.id;
        productForm.querySelector('[name=\"name\"]').value = item.name;
        productForm.querySelector('[name=\"category\"]').value = item.category;
        productForm.querySelector('[name=\"price_kes\"]').value = item.price_kes;
        productForm.querySelector('[name=\"quantity\"]').value = item.quantity;
        productForm.querySelector('[name=\"status\"]').value = item.status;
        productForm.querySelector('[name=\"description\"]').value = item.description || '';
        productForm.querySelector('[name=\"image_url\"]').value = item.image_url || '';
      }
      if (target.matches('[data-delete]')) {
        const id = target.getAttribute('data-delete');
        try {
          const res = await fetch(`${basePath}/api/products_delete.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: id })
          });
          const data = await res.json();
          showMessage(data.message || (data.success ? 'Deleted' : 'Request failed'));
          if (data.success) {
            await fetchProducts();
          }
        } catch (err) {
          showMessage('Network error. Please try again.');
        }
      }
    });

    fetchProducts();
  }

  // Admin dashboard CRUD
  const adminPage = document.querySelector('.admin-page');
  if (adminPage) {
    const basePath = window.location.pathname.includes('/winnie/') ? '/winnie' : '';
    const initAdmin = () => {
      const adminState = {
      farmers: [],
      buyers: [],
      products: [],
      orders: [],
      categories: []
      };
      
      const sidepanel = document.querySelector('[data-sidepanel]');
      const sidepanelBody = document.querySelector('[data-sidepanel-body]');
      const sidepanelClose = document.querySelector('[data-sidepanel-close]');
      
      function openSidepanel(data) {
      if (!sidepanel || !sidepanelBody) return;
      sidepanelBody.textContent = JSON.stringify(data, null, 2);
      }
      
      if (sidepanelClose) {
      sidepanelClose.addEventListener('click', () => {
      if (sidepanelBody) {
      sidepanelBody.textContent = 'No data available';
      }
      });
      }
      
      function showMessage(key, text) {
      const message = document.querySelector(`[data-admin-message="${key}"]`);
      if (!message) return;
      message.style.display = 'block';
      message.textContent = text;
      }
      
      function setEmptyState(key, isEmpty) {
      const notice = document.querySelector(`[data-admin-empty="${key}"]`);
      if (!notice) return;
      notice.style.display = isEmpty ? 'block' : 'none';
      }
      
      function redirectToLogin() {
      const targetRole = role === 'farmer' ? 'farmer' : 'buyer';
      window.location.href = `${basePath}/login.html?role=${targetRole}`;
      }
      
      async function apiGet(endpoint, params = {}) {
      const qs = new URLSearchParams(params);
      const url = `${basePath}/api/${endpoint}${qs.toString() ? `?${qs}` : ''}`;
      const res = await fetch(url);
      if (res.status === 401 || res.status === 403) {
      redirectToLogin();
      return {};
      }
      return res.json();
      }
      
      async function apiPost(endpoint, payload) {
      const res = await fetch(`${basePath}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
      });
      if (res.status === 401 || res.status === 403) {
      redirectToLogin();
      return { success: false, message: 'Unauthorized' };
      }
      return res.json();
      }
      
      function renderFarmers() {
      const tbody = document.querySelector('[data-admin-rows="farmers"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      adminState.farmers.forEach((farmer) => {
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>${farmer.id}</td>
      <td>${escapeHtml(farmer.name)}</td>
      <td>${escapeHtml(farmer.contact)}</td>
      <td>${escapeHtml(farmer.status)}</td>
      <td>${farmer.products_count}</td>
      <td>${escapeHtml(farmer.created_at)}</td>
      <td>
      <button class="btn btn-ghost" data-admin-action="view" data-entity="farmer" data-id="${farmer.id}">View</button>
      <button class="btn btn-ghost" data-admin-action="edit" data-entity="farmer" data-id="${farmer.id}">Edit</button>
      <button class="btn btn-ghost" data-admin-action="suspend" data-entity="farmer" data-id="${farmer.id}">Suspend</button>
      <button class="btn btn-ghost" data-admin-action="delete" data-entity="farmer" data-id="${farmer.id}">Delete</button>
      </td>
      `;
      tbody.appendChild(row);
      });
      setEmptyState('farmers', adminState.farmers.length === 0);
      }
      
      function renderBuyers() {
      const tbody = document.querySelector('[data-admin-rows="buyers"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      adminState.buyers.forEach((buyer) => {
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>${buyer.id}</td>
      <td>${escapeHtml(buyer.name)}</td>
      <td>${escapeHtml(buyer.email)}</td>
      <td>${buyer.orders_count}</td>
      <td>${escapeHtml(buyer.status)}</td>
      <td>${escapeHtml(buyer.created_at)}</td>
      <td>
      <button class="btn btn-ghost" data-admin-action="view" data-entity="buyer" data-id="${buyer.id}">View</button>
      <button class="btn btn-ghost" data-admin-action="edit" data-entity="buyer" data-id="${buyer.id}">Edit</button>
      <button class="btn btn-ghost" data-admin-action="suspend" data-entity="buyer" data-id="${buyer.id}">Suspend</button>
      <button class="btn btn-ghost" data-admin-action="delete" data-entity="buyer" data-id="${buyer.id}">Delete</button>
      </td>
      `;
      tbody.appendChild(row);
      });
      setEmptyState('buyers', adminState.buyers.length === 0);
      }
      
      function renderProducts() {
      const tbody = document.querySelector('[data-admin-rows="products"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      adminState.products.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
      <td><img class="table-thumb" src="${product.image_url || `${basePath}/icon.png`}" alt="${escapeHtml(product.name)}" /></td>
      <td>${product.id}</td>
      <td>${escapeHtml(product.name)}</td>
      <td>${escapeHtml(product.farmer_name || '—')}</td>
      <td>KES ${parseFloat(product.price_kes).toFixed(2)}</td>
      <td>${product.quantity}</td>
      <td>${escapeHtml(product.status)}</td>
      <td>
      <button class="btn btn-ghost" data-admin-action="view" data-entity="product" data-id="${product.id}">View</button>
      <button class="btn btn-ghost" data-admin-action="edit" data-entity="product" data-id="${product.id}">Edit</button>
      <button class="btn btn-ghost" data-admin-action="duplicate" data-entity="product" data-id="${product.id}">Duplicate</button>
      <button class="btn btn-ghost" data-admin-action="delete" data-entity="product" data-id="${product.id}">Delete</button>
      </td>
      `;
      tbody.appendChild(row);
      });
      setEmptyState('products', adminState.products.length === 0);
      }
      
      function renderOrders() {
      const tbody = document.querySelector('[data-admin-rows="orders"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      adminState.orders.forEach((order) => {
      const item = order.items && order.items.length ? order.items[0] : null;
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>#${order.order_id}</td>
      <td>${escapeHtml(order.buyer_name || String(order.buyer_id))}</td>
      <td>${item ? escapeHtml(item.name) : '—'}</td>
      <td>${escapeHtml(order.status)}</td>
      <td>KES ${parseFloat(order.total_price_kes).toFixed(2)}</td>
      <td>${escapeHtml(order.created_at || '')}</td>
      <td>
      <button class="btn btn-ghost" data-admin-action="view" data-entity="order" data-id="${order.order_id}">View</button>
      <button class="btn btn-ghost" data-admin-action="status" data-entity="order" data-id="${order.order_id}">Update status</button>
      <button class="btn btn-ghost" data-admin-action="cancel" data-entity="order" data-id="${order.order_id}">Cancel</button>
      <button class="btn btn-ghost" data-admin-action="refund" data-entity="order" data-id="${order.order_id}">Refund</button>
      </td>
      `;
      tbody.appendChild(row);
      });
      setEmptyState('orders', adminState.orders.length === 0);
      }
      
      function renderCategories() {
      const tbody = document.querySelector('[data-admin-rows="categories"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      adminState.categories.forEach((category) => {
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>${category.id}</td>
      <td>${escapeHtml(category.name)}</td>
      <td>${category.products_count}</td>
      <td>
      <button class="btn btn-ghost" data-admin-action="edit" data-entity="category" data-id="${category.id}">Edit</button>
      <button class="btn btn-ghost" data-admin-action="delete" data-entity="category" data-id="${category.id}">Delete</button>
      </td>
      `;
      tbody.appendChild(row);
      });
      setEmptyState('categories', adminState.categories.length === 0);
      }
      
      function updateMetrics() {
      const metrics = {
      farmers: adminState.farmers.length,
      buyers: adminState.buyers.length,
      products: adminState.products.length,
      orders: adminState.orders.length
      };
      Object.entries(metrics).forEach(([key, value]) => {
      const card = document.querySelector(`[data-admin-metric="${key}"]`);
      if (!card) return;
      const valueEl = card.querySelector('h3');
      const note = card.querySelector('.helper:last-child');
      if (valueEl) valueEl.textContent = value;
      if (note) note.textContent = value === 0 ? 'No data available' : 'Live data';
      });
      }
      
      async function fetchFarmers() {
      const search = document.querySelector('[data-admin-filter="farmers-search"]')?.value || '';
      const status = document.querySelector('[data-admin-filter="farmers-status"]')?.value || '';
      const data = await apiGet('farmers_list.php', { search, status });
      adminState.farmers = Array.isArray(data) ? data : [];
      renderFarmers();
      updateMetrics();
      updateFarmerFilter();
      }
      
      async function fetchBuyers() {
      const search = document.querySelector('[data-admin-filter="buyers-search"]')?.value || '';
      const status = document.querySelector('[data-admin-filter="buyers-status"]')?.value || '';
      const data = await apiGet('buyers_list.php', { search, status });
      adminState.buyers = Array.isArray(data) ? data : [];
      renderBuyers();
      updateMetrics();
      }
      
      async function fetchProducts() {
      const search = document.querySelector('[data-admin-filter="products-search"]')?.value || '';
      const category = document.querySelector('[data-admin-filter="products-category"]')?.value || '';
      const status = document.querySelector('[data-admin-filter="products-status"]')?.value || '';
      const farmerId = document.querySelector('[data-admin-filter="products-farmer"]')?.value || '';
      const data = await apiGet('products.php', {
      include_farmer: '1',
      search,
      category,
      status,
      farmer_id: farmerId
      });
      adminState.products = Array.isArray(data) ? data : [];
      renderProducts();
      updateMetrics();
      }
      
      async function fetchOrders() {
      const data = await apiGet('orders_list.php');
      adminState.orders = Array.isArray(data) ? data : [];
      renderOrders();
      updateMetrics();
      }
      
      async function fetchCategories() {
      const data = await apiGet('categories_list.php');
      adminState.categories = Array.isArray(data) ? data : [];
      renderCategories();
      updateCategoryFilter();
      }
      
      function updateCategoryFilter() {
      const select = document.querySelector('[data-admin-filter="products-category"]');
      if (!select) return;
      const current = select.value;
      select.innerHTML = '<option value=\"\">All categories</option>';
      adminState.categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      select.appendChild(opt);
      });
      select.value = current;
      }
      
      function updateFarmerFilter() {
      const select = document.querySelector('[data-admin-filter="products-farmer"]');
      if (!select) return;
      const current = select.value;
      select.innerHTML = '<option value=\"\">All farmers</option>';
      adminState.farmers.forEach((farmer) => {
      const opt = document.createElement('option');
      opt.value = String(farmer.id);
      opt.textContent = farmer.name;
      select.appendChild(opt);
      });
      select.value = current;
      }
      
      function openModalById(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      closeAllModals();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      }
      
      function fillForm(form, data) {
      if (!form || !data) return;
      Object.keys(data).forEach((key) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) field.value = data[key];
      });
      }
      
      document.addEventListener('click', async (e) => {
      const action = e.target.closest('[data-admin-action]');
      if (!action) return;
      const entity = action.getAttribute('data-entity');
      const actionType = action.getAttribute('data-admin-action');
      const id = parseInt(action.getAttribute('data-id'), 10);
      
      if (actionType === 'view') {
      const record = adminState[`${entity}s`]?.find((item) => (item.id || item.order_id) === id);
      if (record) {
      openSidepanel(record);
      }
      return;
      }
      
      if (entity === 'farmer') {
      const record = adminState.farmers.find((item) => item.id === id);
      if (!record) return;
      if (actionType === 'edit') {
      const form = document.querySelector('[data-admin-form="farmer"]');
      if (form) {
      form.reset();
      fillForm(form, { id: record.id, name: record.name, email: record.contact, status: record.status });
      openModalById('modal-farmer');
      }
      }
      if (actionType === 'suspend') {
      await apiPost('farmers_update.php', { id: record.id, name: record.name, email: record.contact, status: 'suspended' });
      await fetchFarmers();
      }
      if (actionType === 'delete') {
      const impact = window.prompt('Impact: transferProducts, disableProducts, or deleteAll', 'disableProducts');
      if (!impact) return;
      let payload = { id: record.id, impact_action: impact };
      if (impact === 'transferProducts') {
      const transferId = window.prompt('Transfer to farmer ID');
      if (!transferId) return;
      payload.transfer_farmer_id = parseInt(transferId, 10);
      }
      await apiPost('farmers_delete.php', payload);
      await fetchFarmers();
      await fetchProducts();
      }
      }
      
      if (entity === 'buyer') {
      const record = adminState.buyers.find((item) => item.id === id);
      if (!record) return;
      if (actionType === 'edit') {
      const form = document.querySelector('[data-admin-form=\"buyer\"]');
      if (form) {
      form.reset();
      fillForm(form, { id: record.id, name: record.name, email: record.email, status: record.status });
      openModalById('modal-buyer');
      }
      }
      if (actionType === 'suspend') {
      await apiPost('buyers_update.php', { id: record.id, name: record.name, email: record.email, status: 'suspended' });
      await fetchBuyers();
      }
      if (actionType === 'delete') {
      await apiPost('buyers_delete.php', { id: record.id });
      await fetchBuyers();
      }
      }
      
      if (entity === 'product') {
      const record = adminState.products.find((item) => item.id === id);
      if (!record) return;
      if (actionType === 'edit' || actionType === 'duplicate') {
      const form = document.querySelector('[data-admin-form=\"product\"]');
      if (form) {
      form.reset();
      fillForm(form, {
      product_id: actionType === 'duplicate' ? '' : record.id,
      name: record.name,
      category: record.category,
      farmer_id: record.farmer_id || '',
      price_kes: record.price_kes,
      quantity: record.quantity,
      quantity_label: record.quantity_label || '',
      status: record.status,
      description: record.description || ''
      });
      openModalById('modal-product');
      }
      }
      if (actionType === 'delete') {
      await apiPost('products_delete.php', { product_id: record.id });
      await fetchProducts();
      }
      }
      
      if (entity === 'order') {
      const record = adminState.orders.find((item) => item.order_id === id);
      if (!record) return;
      if (actionType === 'status') {
      const nextStatus = window.prompt('Set status: pending, confirmed, completed, cancelled', record.status);
      if (!nextStatus) return;
      await apiPost('orders_update.php', { order_id: record.order_id, status: nextStatus });
      await fetchOrders();
      }
      if (actionType === 'cancel' || actionType === 'refund') {
      await apiPost('orders_update.php', { order_id: record.order_id, status: 'cancelled' });
      await fetchOrders();
      }
      }
      
      if (entity === 'category') {
      const record = adminState.categories.find((item) => item.id === id);
      if (!record) return;
      if (actionType === 'edit') {
      const form = document.querySelector('[data-admin-form=\"category\"]');
      if (form) {
      form.reset();
      fillForm(form, { id: record.id, name: record.name });
      openModalById('modal-category');
      }
      }
      if (actionType === 'delete') {
      await apiPost('categories_delete.php', { id: record.id });
      await fetchCategories();
      }
      }
      });
      
      document.querySelectorAll('[data-admin-form]').forEach((form) => {
      form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = form.getAttribute('data-admin-form');
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      
      if (type === 'farmer') {
      const endpoint = payload.id ? 'farmers_update.php' : 'farmers_create.php';
      const data = await apiPost(endpoint, payload);
      showMessage('farmer', data.message || 'Saved');
      await fetchFarmers();
      }
      
      if (type === 'buyer') {
      const endpoint = payload.id ? 'buyers_update.php' : 'buyers_create.php';
      const data = await apiPost(endpoint, payload);
      showMessage('buyer', data.message || 'Saved');
      await fetchBuyers();
      }
      
      if (type === 'product') {
      const endpoint = payload.product_id ? 'products_update.php' : 'products_create.php';
      const formData = new FormData(form);
      const res = await fetch(`${basePath}/api/${endpoint}`, {
      method: 'POST',
      body: formData
      });
      if (res.status === 401 || res.status === 403) {
      redirectToLogin();
      return;
      }
      const data = await res.json();
      showMessage('product', data.message || 'Saved');
      await fetchProducts();
      }
      
      if (type === 'order') {
      const endpoint = payload.order_id ? 'orders_update.php' : 'orders_create.php';
      const data = await apiPost(endpoint, payload);
      showMessage('order', data.message || 'Saved');
      await fetchOrders();
      }
      
      if (type === 'category') {
      const endpoint = payload.id ? 'categories_update.php' : 'categories_create.php';
      const data = await apiPost(endpoint, payload);
      showMessage('category', data.message || 'Saved');
      await fetchCategories();
      }
      });
      });
      
      document.querySelectorAll('[data-admin-filter]').forEach((filter) => {
      filter.addEventListener('input', () => {
      const key = filter.getAttribute('data-admin-filter');
      if (key && key.startsWith('farmers')) fetchFarmers();
      if (key && key.startsWith('buyers')) fetchBuyers();
      if (key && key.startsWith('products')) fetchProducts();
      if (key && key.startsWith('orders')) fetchOrders();
      });
      filter.addEventListener('change', () => {
      const key = filter.getAttribute('data-admin-filter');
      if (key && key.startsWith('farmers')) fetchFarmers();
      if (key && key.startsWith('buyers')) fetchBuyers();
      if (key && key.startsWith('products')) fetchProducts();
      if (key && key.startsWith('orders')) fetchOrders();
      });
      });
      
      fetchFarmers();
      fetchBuyers();
      fetchCategories();
      fetchProducts();
      fetchOrders();
    };
    guardSession(basePath, 'admin', `${basePath}/admin-login.html`).then((ok) => { if (ok) initAdmin(); });
  }

  // Role dashboards (farmer/buyer)
  const rolePage = document.querySelector('.role-page');
  if (rolePage) {
    const basePath = window.location.pathname.includes('/winnie/') ? '/winnie' : '';
    const role = rolePage.getAttribute('data-role');
    const initRole = () => {
      
      const roleModals = document.querySelectorAll('.role-modal');
      const roleOpeners = document.querySelectorAll('[data-role-modal-open]');
      const roleClosers = document.querySelectorAll('[data-role-modal-close]');
      
      function closeRoleModals() {
      roleModals.forEach((modal) => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      });
      }
      
      roleOpeners.forEach((btn) => {
      btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-role-modal-open');
      const modal = document.getElementById(id);
      if (!modal) return;
      closeRoleModals();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      });
      });
      
      roleClosers.forEach((btn) => {
      btn.addEventListener('click', () => closeRoleModals());
      });
      
      roleModals.forEach((modal) => {
      modal.addEventListener('click', (e) => {
      if (e.target === modal) closeRoleModals();
      });
      });
      
      async function apiGet(endpoint, params = {}) {
      const qs = new URLSearchParams(params);
      const url = `${basePath}/api/${endpoint}${qs.toString() ? `?${qs}` : ''}`;
      const res = await fetch(url);
      return res.json();
      }
      
      async function apiPost(endpoint, payload) {
      const res = await fetch(`${basePath}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
      });
      return res.json();
      }
      
      function formatKes(value) {
      const num = Number(value) || 0;
      return `KES ${num.toFixed(2)}`;
      }
      
      async function loadProfile() {
      const summary = document.querySelector('[data-profile-summary]');
      const form = document.querySelector('[data-profile-form]');
      if (!summary && !form) return;
      fetch(`${basePath}/api/profile_get.php`)
      .then((res) => {
      if (res.status === 401 || res.status === 403) {
      const targetRole = role === 'farmer' ? 'farmer' : 'buyer';
      window.location.href = `${basePath}/login.html?role=${targetRole}`;
      return null;
      }
      return res.json();
      })
      .then((data) => {
      if (!data || !data.success) return;
      const user = data.user;
      if (summary) {
      summary.textContent = `${user.name} • ${user.email}`;
      }
      if (form) {
      const nameField = form.querySelector('[name="name"]');
      const emailField = form.querySelector('[name="email"]');
      if (nameField) nameField.value = user.name;
      if (emailField) emailField.value = user.email;
      }
      });
      }
      
      const profileForm = document.querySelector('[data-profile-form]');
      if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      const payload = Object.fromEntries(formData.entries());
      const res = await apiPost('profile_update.php', payload);
      const message = document.querySelector('[data-profile-message]');
      if (message) {
      message.style.display = 'block';
      message.textContent = res.message || (res.success ? 'Updated' : 'Request failed');
      }
      if (res.success) {
      await loadProfile();
      closeRoleModals();
      }
      });
      }
      
      if (role === 'farmer') {
      const farmerState = {
      products: [],
      orders: [],
      metrics: null
      };
      
      function setFarmerEmpty(key, isEmpty) {
      const notice = document.querySelector(`[data-farmer-empty="${key}"]`);
      if (!notice) return;
      notice.style.display = isEmpty ? 'block' : 'none';
      }
      
      function renderMetrics() {
      if (!farmerState.metrics) return;
      const metrics = farmerState.metrics;
      const map = {
      totalProducts: metrics.totalProducts,
      activeOrders: metrics.activeOrders,
      todayEarnings: formatKes(metrics.todayEarnings),
      lowStockCount: metrics.lowStockCount
      };
      Object.keys(map).forEach((key) => {
      const card = document.querySelector(`[data-farmer-metric="${key}"]`);
      if (!card) return;
      const valueEl = card.querySelector('h3');
      if (valueEl) valueEl.textContent = map[key];
      });
      const earnings = {
      today: metrics.todayEarnings,
      weekly: metrics.weeklyEarnings,
      monthly: metrics.monthlyEarnings
      };
      Object.keys(earnings).forEach((key) => {
      const card = document.querySelector(`[data-farmer-earning="${key}"]`);
      if (!card) return;
      const valueEl = card.querySelector('h3');
      if (valueEl) valueEl.textContent = formatKes(earnings[key]);
      });
      }
      
      function renderProducts() {
      const tbody = document.querySelector('[data-farmer-rows="products"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      farmerState.products.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
      <td><img class="table-thumb" src="${product.image_url || `${basePath}/icon.png`}" alt="${escapeHtml(product.name)}" /></td>
      <td>${product.id}</td>
      <td>${escapeHtml(product.name)}</td>
      <td>${formatKes(product.price_kes)}</td>
      <td>${product.quantity}</td>
      <td>${escapeHtml(product.status)}</td>
      <td>${escapeHtml(product.updated_at || '')}</td>
      <td>
      <button class="btn btn-ghost" data-role-action="view" data-entity="product" data-id="${product.id}">View</button>
      <button class="btn btn-ghost" data-role-action="edit" data-entity="product" data-id="${product.id}">Edit</button>
      <button class="btn btn-ghost" data-role-action="disable" data-entity="product" data-id="${product.id}">Disable</button>
      <button class="btn btn-ghost" data-role-action="delete" data-entity="product" data-id="${product.id}">Delete</button>
      </td>
      `;
      tbody.appendChild(row);
      });
      setFarmerEmpty('products', farmerState.products.length === 0);
      }
      
      function renderOrders() {
      const tbody = document.querySelector('[data-farmer-rows="orders"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      farmerState.orders.forEach((order) => {
      const item = order.items && order.items.length ? order.items[0] : null;
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>#${order.order_id}</td>
      <td>${escapeHtml(order.buyer_name || String(order.buyer_id))}</td>
      <td>${item ? escapeHtml(item.name) : '—'}</td>
      <td>${item ? item.quantity : 0}</td>
      <td>${escapeHtml(order.status)}</td>
      <td>${escapeHtml(order.created_at || '')}</td>
      <td>
      <button class="btn btn-ghost" data-role-action="accept" data-entity="order" data-id="${order.order_id}">Accept</button>
      <button class="btn btn-ghost" data-role-action="ship" data-entity="order" data-id="${order.order_id}">Mark shipped</button>
      <button class="btn btn-ghost" data-role-action="cancel" data-entity="order" data-id="${order.order_id}">Cancel</button>
      </td>
      `;
      tbody.appendChild(row);
      });
      setFarmerEmpty('orders', farmerState.orders.length === 0);
      }
      
      function renderInventory() {
      const tbody = document.querySelector('[data-farmer-rows="inventory"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      const threshold = farmerState.metrics ? farmerState.metrics.lowStockThreshold : 10;
      farmerState.products.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>${escapeHtml(product.name)}</td>
      <td>${product.quantity}</td>
      <td>${threshold}</td>
      `;
      tbody.appendChild(row);
      });
      setFarmerEmpty('inventory', farmerState.products.length === 0);
      }
      
      function renderRecent() {
      const tbody = document.querySelector('[data-farmer-recent]');
      if (!tbody) return;
      tbody.innerHTML = '';
      const recent = farmerState.orders.slice(0, 5);
      recent.forEach((order) => {
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>#${order.order_id}</td>
      <td>${escapeHtml(order.buyer_name || String(order.buyer_id))}</td>
      <td>${escapeHtml(order.status)}</td>
      <td>${escapeHtml(order.created_at || '')}</td>
      `;
      tbody.appendChild(row);
      });
      setFarmerEmpty('recent', recent.length === 0);
      }
      
      async function fetchMetrics() {
      farmerState.metrics = await apiGet('farmer_metrics.php');
      renderMetrics();
      renderInventory();
      }
      
      async function fetchProducts() {
      const search = document.querySelector('[data-farmer-filter="products-search"]')?.value || '';
      const status = document.querySelector('[data-farmer-filter="products-status"]')?.value || '';
      const data = await apiGet('products_mine.php', { search, status });
      farmerState.products = Array.isArray(data) ? data : [];
      renderProducts();
      renderInventory();
      }
      
      async function fetchOrders() {
      const data = await apiGet('orders_list.php');
      farmerState.orders = Array.isArray(data) ? data : [];
      renderOrders();
      renderRecent();
      }
      
      document.addEventListener('click', async (e) => {
      const action = e.target.closest('[data-role-action]');
      if (!action) return;
      const entity = action.getAttribute('data-entity');
      const actionType = action.getAttribute('data-role-action');
      const id = parseInt(action.getAttribute('data-id'), 10);
      
      if (entity === 'product') {
      const product = farmerState.products.find((item) => item.id === id);
      if (!product) return;
      if (actionType === 'view' || actionType === 'edit') {
      const form = document.querySelector('[data-farmer-form="product"]');
      if (form) {
      form.reset();
      const fields = {
      product_id: product.id,
      name: product.name,
      category: product.category,
      price_kes: product.price_kes,
      quantity: product.quantity,
      quantity_label: product.quantity_label || '',
      status: product.status,
      description: product.description || ''
      };
      Object.keys(fields).forEach((key) => {
      const field = form.querySelector(`[name=\"${key}\"]`);
      if (field) field.value = fields[key];
      });
      closeRoleModals();
      const modal = document.getElementById('modal-product');
      if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      }
      }
      }
      if (actionType === 'disable') {
      await apiPost('products_update.php', {
      product_id: product.id,
      name: product.name,
      category: product.category,
      price_kes: product.price_kes,
      quantity: product.quantity,
      status: 'unavailable',
      description: product.description || ''
      });
      await fetchProducts();
      }
      if (actionType === 'delete') {
      await apiPost('products_delete.php', { product_id: product.id });
      await fetchProducts();
      }
      }
      
      if (entity === 'order') {
      if (actionType === 'accept') {
      await apiPost('orders_update_status.php', { order_id: id, new_status: 'confirmed' });
      }
      if (actionType === 'ship') {
      await apiPost('orders_update_status.php', { order_id: id, new_status: 'completed' });
      }
      if (actionType === 'cancel') {
      await apiPost('orders_update_status.php', { order_id: id, new_status: 'cancelled' });
      }
      await fetchOrders();
      }
      });
      
      const productForm = document.querySelector('[data-farmer-form="product"]');
      if (productForm) {
      productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const endpoint = productForm.querySelector('[name="product_id"]').value ? 'products_update.php' : 'products_create.php';
      const formData = new FormData(productForm);
      const res = await fetch(`${basePath}/api/${endpoint}`, {
      method: 'POST',
      body: formData
      });
      if (res.status === 401 || res.status === 403) {
      redirectToLogin();
      return;
      }
      const data = await res.json();
      const message = document.querySelector('[data-farmer-message="product"]');
      if (message) {
      message.style.display = 'block';
      message.textContent = data.message || (data.success ? 'Saved' : 'Request failed');
      }
      if (data.success) {
      await fetchProducts();
      closeRoleModals();
      }
      });
      }
      
      document.querySelectorAll('[data-farmer-filter]').forEach((filter) => {
      filter.addEventListener('input', fetchProducts);
      filter.addEventListener('change', fetchProducts);
      });
      
      fetchMetrics();
      fetchProducts();
      fetchOrders();
      loadProfile();
      }
      
      if (role === 'buyer') {
      const buyerState = {
      orders: [],
      products: [],
      categories: [],
      farmers: [],
      wishlist: []
      };
      
      function setBuyerEmpty(key, isEmpty) {
      const notice = document.querySelector(`[data-buyer-empty="${key}"]`);
      if (!notice) return;
      notice.style.display = isEmpty ? 'block' : 'none';
      }
      
      function renderOrders() {
      const tbody = document.querySelector('[data-buyer-rows="orders"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      buyerState.orders.forEach((order) => {
      const item = order.items && order.items.length ? order.items[0] : null;
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>#${order.order_id}</td>
      <td>${item ? escapeHtml(item.name) : '—'}</td>
      <td>${escapeHtml(order.farmer_name || '—')}</td>
      <td>${item ? item.quantity : 0}</td>
      <td>${escapeHtml(order.status)}</td>
      <td>${formatKes(order.total_price_kes)}</td>
      <td>${escapeHtml(order.created_at || '')}</td>
      <td>
      <button class="btn btn-ghost" data-buyer-action="view" data-id="${order.order_id}">View</button>
      <button class="btn btn-ghost" data-buyer-action="cancel" data-id="${order.order_id}">Cancel</button>
      <button class="btn btn-ghost" data-buyer-action="reorder" data-id="${order.order_id}">Reorder</button>
      </td>
      `;
      tbody.appendChild(row);
      });
      setBuyerEmpty('orders', buyerState.orders.length === 0);
      }
      
      function renderRecentOrders() {
      const tbody = document.querySelector('[data-buyer-recent]');
      if (!tbody) return;
      tbody.innerHTML = '';
      const recent = buyerState.orders.slice(0, 5);
      recent.forEach((order) => {
      const item = order.items && order.items.length ? order.items[0] : null;
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>#${order.order_id}</td>
      <td>${item ? escapeHtml(item.name) : '—'}</td>
      <td>${escapeHtml(order.status)}</td>
      <td>${formatKes(order.total_price_kes)}</td>
      <td>${escapeHtml(order.created_at || '')}</td>
      `;
      tbody.appendChild(row);
      });
      setBuyerEmpty('recent', recent.length === 0);
      }
      
      function renderRecommendations() {
      const container = document.querySelector('[data-buyer-recommendations]');
      if (!container) return;
      container.innerHTML = '';
      const items = buyerState.products.slice(0, 6);
      items.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'ui-card product-card';
      const image = product.image_url ? product.image_url : `${basePath}/icon.png`;
      card.innerHTML = `
      <img src="${image}" alt="${escapeHtml(product.name)}" />
      <span class="badge">${escapeHtml(product.category)}</span>
      <h3>${escapeHtml(product.name)}</h3>
      <p class="price">${formatKes(product.price_kes)}</p>
      <button class="btn btn-primary" data-add-to-cart data-id="${product.id}" data-name="${escapeHtml(product.name)}" data-price="${product.price_kes}">Add to cart</button>
      `;
      container.appendChild(card);
      });
      setBuyerEmpty('recommendations', items.length === 0);
      }
      
      function renderProducts() {
      const container = document.querySelector('[data-buyer-products]');
      if (!container) return;
      container.innerHTML = '';
      buyerState.products.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'ui-card product-card';
      const image = product.image_url ? product.image_url : `${basePath}/icon.png`;
      card.innerHTML = `
      <img src="${image}" alt="${escapeHtml(product.name)}" />
      <span class="badge">${escapeHtml(product.category)}</span>
      <h3>${escapeHtml(product.name)}</h3>
      <p class="helper">Farmer: ${escapeHtml(product.farmer_name || '—')}</p>
      <p class="price">${formatKes(product.price_kes)}</p>
      <button class="btn btn-primary" data-add-to-cart data-id="${product.id}" data-name="${escapeHtml(product.name)}" data-price="${product.price_kes}">Add to cart</button>
      <button class="btn btn-outline" data-buyer-action="buy" data-id="${product.id}" data-price="${product.price_kes}" data-name="${escapeHtml(product.name)}">Buy now</button>
      <button class="btn btn-ghost" data-buyer-action="wishlist" data-id="${product.id}">Add to wishlist</button>
      `;
      container.appendChild(card);
      });
      setBuyerEmpty('products', buyerState.products.length === 0);
      }
      
      function renderWishlist() {
      const tbody = document.querySelector('[data-buyer-rows="wishlist"]');
      if (!tbody) return;
      tbody.innerHTML = '';
      buyerState.wishlist.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${formatKes(item.price_kes)}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>
      <button class="btn btn-ghost" data-buyer-action="move" data-id="${item.product_id}">Move to cart</button>
      <button class="btn btn-ghost" data-buyer-action="remove" data-id="${item.product_id}">Remove</button>
      </td>
      `;
      tbody.appendChild(row);
      });
      setBuyerEmpty('wishlist', buyerState.wishlist.length === 0);
      }
      
      async function fetchOrders() {
      const data = await apiGet('orders_list.php');
      buyerState.orders = Array.isArray(data) ? data : [];
      renderOrders();
      renderRecentOrders();
      }
      
      async function fetchWishlist() {
      const data = await apiGet('wishlist_list.php');
      buyerState.wishlist = Array.isArray(data) ? data : [];
      renderWishlist();
      }
      
      async function fetchCategories() {
      const data = await apiGet('categories_public_list.php');
      buyerState.categories = Array.isArray(data) ? data : [];
      const select = document.querySelector('[data-buyer-filter="category"]');
      if (select) {
      select.innerHTML = '<option value="">All categories</option>';
      buyerState.categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      select.appendChild(opt);
      });
      }
      }
      
      async function fetchFarmers() {
      const data = await apiGet('farmers_public_list.php');
      buyerState.farmers = Array.isArray(data) ? data : [];
      const select = document.querySelector('[data-buyer-filter="farmer"]');
      if (select) {
      select.innerHTML = '<option value="">All farmers</option>';
      buyerState.farmers.forEach((farmer) => {
      const opt = document.createElement('option');
      opt.value = farmer.id;
      opt.textContent = farmer.name;
      select.appendChild(opt);
      });
      }
      }
      
      async function fetchProducts() {
      const search = document.querySelector('[data-buyer-search]')?.value || '';
      const category = document.querySelector('[data-buyer-filter="category"]')?.value || '';
      const minPrice = document.querySelector('[data-buyer-filter="minPrice"]')?.value || '';
      const maxPrice = document.querySelector('[data-buyer-filter="maxPrice"]')?.value || '';
      const farmer = document.querySelector('[data-buyer-filter="farmer"]')?.value || '';
      const params = {
      include_farmer: '1',
      search,
      category,
      farmer_id: farmer
      };
      if (minPrice !== '') params.minPrice = minPrice;
      if (maxPrice !== '') params.maxPrice = maxPrice;
      const data = await apiGet('products.php', params);
      buyerState.products = Array.isArray(data) ? data : [];
      renderProducts();
      renderRecommendations();
      }
      
      document.addEventListener('click', async (e) => {
      const action = e.target.closest('[data-buyer-action]');
      if (!action) return;
      const actionType = action.getAttribute('data-buyer-action');
      const id = parseInt(action.getAttribute('data-id'), 10);
      const order = buyerState.orders.find((item) => item.order_id === id);
      
      if (actionType === 'view' && order) {
      window.alert(JSON.stringify(order, null, 2));
      }
      if (actionType === 'cancel' && order) {
      await apiPost('orders_cancel.php', { order_id: order.order_id });
      await fetchOrders();
      }
      if (actionType === 'reorder' && order) {
      const item = order.items && order.items.length ? order.items[0] : null;
      if (item) {
      const cart = getCart();
      const existing = cart.find((c) => c.id === String(item.product_id));
      if (existing) {
      existing.quantity += item.quantity;
      } else {
      cart.push({
      id: String(item.product_id),
      name: item.name,
      price: item.price_kes,
      quantity: item.quantity
      });
      }
      setCart(cart);
      updateCartCount();
      }
      }
      if (actionType === 'buy') {
      const name = action.getAttribute('data-name');
      const price = parseFloat(action.getAttribute('data-price'));
      if (name) {
      const cart = getCart();
      cart.push({ id: String(id), name, price, quantity: 1 });
      setCart(cart);
      updateCartCount();
      window.location.href = `${basePath}/cart.html`;
      }
      }
      if (actionType === 'wishlist') {
      await apiPost('wishlist_add.php', { product_id: id });
      await fetchWishlist();
      }
      if (actionType === 'move') {
      const item = buyerState.wishlist.find((w) => w.product_id === id);
      if (item) {
      const cart = getCart();
      cart.push({ id: String(item.product_id), name: item.name, price: item.price_kes, quantity: 1 });
      setCart(cart);
      updateCartCount();
      }
      }
      if (actionType === 'remove') {
      await apiPost('wishlist_delete.php', { product_id: id });
      await fetchWishlist();
      }
      });
      
      document.querySelectorAll('[data-buyer-filter], [data-buyer-search]').forEach((input) => {
      input.addEventListener('input', fetchProducts);
      input.addEventListener('change', fetchProducts);
      });
      
      fetchCategories();
      fetchFarmers();
      fetchProducts();
      fetchOrders();
      fetchWishlist();
      loadProfile();
      }
    };
    const redirectUrl = role === 'farmer' ? `${basePath}/login.html?role=farmer` : `${basePath}/login.html?role=buyer`;
    guardSession(basePath, role, redirectUrl).then((ok) => { if (ok) initRole(); });
  }
})();