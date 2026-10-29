const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const dataFile = path.join(__dirname, "data", "products.json");
const usersFile = path.join(__dirname, "data", "users.json");
const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => {
    const index = part.indexOf("=");
    return index === -1 ? [] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter((entry) => entry.length));
}

function verifyPassword(password, storedHash) {
  const [, salt, expected] = storedHash.split("$");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

async function readUsers() {
  const contents = await fs.readFile(usersFile, "utf8");
  return JSON.parse(contents);
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`);
}

function requireAuth(req, res, next) {
  const token = parseCookies(req.headers.cookie).session;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: "Debes iniciar sesión." });
  }
  req.user = session.user;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: "No tienes permisos para esta acción." });
    next();
  };
}

async function readProducts() {
  const contents = await fs.readFile(dataFile, "utf8");
  return JSON.parse(contents);
}

async function writeProducts(products) {
  await fs.writeFile(dataFile, `${JSON.stringify(products, null, 2)}\n`, "utf8");
}

app.get("/api/products", async (_req, res, next) => {
  try {
    res.json(await readProducts());
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const user = (await readUsers()).find((candidate) => candidate.username === username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { user: { username: user.username, role: user.role }, expiresAt: Date.now() + SESSION_TTL_MS });
    setSessionCookie(res, token);
    res.json({ user: { username: user.username, role: user.role } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", (req, res) => {
  const token = parseCookies(req.headers.cookie).session;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) return res.json({ user: null });
  res.json({ user: session.user });
});

app.post("/api/auth/logout", (req, res) => {
  const token = parseCookies(req.headers.cookie).session;
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.status(204).end();
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const { customer, items, total } = req.body;
    if (!customer?.name || !customer?.email || !Array.isArray(items) || items.length === 0 || !Number.isFinite(total)) {
      return res.status(400).json({ error: "Datos del pedido incompletos." });
    }

    res.status(201).json({
      orderId: `PED-${Date.now().toString(36).toUpperCase()}`,
      message: "Pedido simulado creado correctamente.",
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/products", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, category, price, description, image } = req.body;
    if (!name || !category || !description || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: "Nombre, categoría, descripción y precio válido son obligatorios." });
    }

    const products = await readProducts();
    const product = {
      id: `prod-${Date.now()}`,
      name: String(name).trim(),
      category: String(category).trim(),
      price: Number(price),
      description: String(description).trim(),
      image: String(image || "📦").trim(),
    };
    products.push(product);
    await writeProducts(products);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/products/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const products = await readProducts();
    const remaining = products.filter((product) => product.id !== req.params.id);
    if (remaining.length === products.length) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    await writeProducts(remaining);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`Tienda Nube disponible en http://localhost:${PORT}`);
});
