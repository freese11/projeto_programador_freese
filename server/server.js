const express = require("express");
require("dotenv").config();

const cors = require('cors');

const produtosRouter = require("./routes/produtosDB");
const autenticarAPIkey = require("./autorizar");
const clientesRouter = require("./routes/clientesDB");
const usuariosRouter = require("./routes/usuariosDB");
const vendasRouter = require("./routes/vendasDB");


const app = express();
app.use(cors());
app.use(express.json());
app.use("/produtos", produtosRouter);


// =====================
// Rotas principais
// =====================
app.use(autenticarAPIkey)
app.use("/clientes", clientesRouter);
app.use("/usuarios", usuariosRouter);
app.use("/vendas", vendasRouter);

// Rota raiz
app.get("/", (req, res) => {
  res.send("🌎 API de Produtos rodando! Acesse a documentação em /api-docs");
});

// =====================
// Servidor
// =====================
const PORT = process.env.PORT || 3000;


app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Servidor rodando em http://127.0.0.1:3000");
});