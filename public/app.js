const state = { products: [], cart: [] };
const productsElement = document.querySelector("#products");
const searchElement = document.querySelector("#search");
const categoryElement = document.querySelector("#category");
const cartElement = document.querySelector("#cart");
const overlayElement = document.querySelector("#overlay");

const money = (value) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD" }).format(value);

async function loadProducts() {
  const response = await fetch("/api/products");
  if (!response.ok) throw new Error("No se pudieron cargar los productos.");
  state.products = await response.json();
  categoryElement.innerHTML = '<option value="">Todas las categorías</option>';
  [...new Set(state.products.map((product) => product.category))].forEach((category) => {
    categoryElement.insertAdjacentHTML("beforeend", `<option value="${category}">${category}</option>`);
  });
  renderProducts();
}

function renderProducts() {
  const term = searchElement.value.toLowerCase();
  const category = categoryElement.value;
  const visible = state.products.filter((product) =>
    (!category || product.category === category) &&
    `${product.name} ${product.description}`.toLowerCase().includes(term));
  productsElement.innerHTML = visible.length ? visible.map((product) => `
    <article class="card">
      <div class="product-image">${product.image}</div><h3>${product.name}</h3>
      <p>${product.description}</p><small>${product.category}</small>
      <div class="card-footer"><span class="price">${money(product.price)}</span>
      <button class="small-button" data-add="${product.id}">Añadir</button>
      <button class="small-button" data-delete="${product.id}" title="Eliminar producto">🗑️</button></div>
    </article>`).join("") : "<p>No encontramos productos con esos filtros.</p>";
}

function renderCart() {
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.querySelector("#cart-count").textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector("#cart-total").textContent = money(total);
  document.querySelector("#cart-items").innerHTML = state.cart.length ? state.cart.map((item) =>
    `<div class="cart-line"><span>${item.name} × ${item.quantity}</span><strong>${money(item.price * item.quantity)}</strong><button data-remove="${item.id}">Quitar</button></div>`).join("") : "<p>Tu carrito está vacío.</p>";
}

productsElement.addEventListener("click", async (event) => {
  const addId = event.target.dataset.add;
  const deleteId = event.target.dataset.delete;
  if (addId) {
    const product = state.products.find((item) => item.id === addId);
    const existing = state.cart.find((item) => item.id === addId);
    existing ? existing.quantity++ : state.cart.push({ ...product, quantity: 1 });
    renderCart();
  }
  if (deleteId && confirm("¿Eliminar este producto?")) {
    const response = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    if (response.ok) await loadProducts();
  }
});
document.querySelector("#cart-items").addEventListener("click", (event) => {
  if (event.target.dataset.remove) {
    state.cart = state.cart.filter((item) => item.id !== event.target.dataset.remove);
    renderCart();
  }
});
searchElement.addEventListener("input", renderProducts);
categoryElement.addEventListener("change", renderProducts);
document.querySelector("#cart-button").addEventListener("click", () => { cartElement.classList.add("open"); overlayElement.classList.add("open"); });
document.querySelector("#close-cart").addEventListener("click", () => { cartElement.classList.remove("open"); overlayElement.classList.remove("open"); });
overlayElement.addEventListener("click", () => document.querySelector("#close-cart").click());

document.querySelector("#checkout-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.cart.length) return;
  const form = new FormData(event.target);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    customer: { name: form.get("name"), email: form.get("email") }, items: state.cart, total,
  }) });
  const result = await response.json();
  document.querySelector("#checkout-message").textContent = response.ok ? `${result.message} Número: ${result.orderId}` : result.error;
  if (response.ok) { state.cart = []; renderCart(); event.target.reset(); }
});

document.querySelector("#product-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
  const result = await response.json();
  document.querySelector("#admin-message").textContent = response.ok ? "Producto agregado correctamente." : result.error;
  if (response.ok) { event.target.reset(); await loadProducts(); }
});

loadProducts().catch((error) => { productsElement.innerHTML = `<p>${error.message}</p>`; });
renderCart();
