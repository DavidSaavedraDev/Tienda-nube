const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const dataFile = path.join(__dirname, "data", "products.json");

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

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

app.post("/api/products", async (req, res, next) => {
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

app.delete("/api/products/:id", async (req, res, next) => {
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
