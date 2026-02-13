const express = require("express");
require("dotenv").config();
const cors = require('cors');
const pool = require('./db'); // Importante: Adicionei a importação do pool aqui

const produtosRouter = require("./routes/produtosDB");
const autenticarAPIkey = require("./autorizar");
const clientesRouter = require("./routes/clientesDB");
const usuariosRouter = require("./routes/usuariosDB");
const vendasRouter = require("./routes/vendasDB");

const app = express();
app.use(cors());
app.use(express.json());
app.use(autenticarAPIkey);

// Rota raiz
app.get("/", (req, res) => {
  res.send("🌎 API de Produtos rodando!");
});

// =====================
// Rota de Login Unificada
// =====================
app.post("/login", async (req, res) => {
    const { email, senha, tipoLoginEscolhido } = req.body;

    try {
        let result;
        // O seu banco usa a tabela 'usuarios' para Admin e 'cliente' para Clientes
        if (tipoLoginEscolhido === 'admin') {
            console.log("Tentando login como ADMIN");
            result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND senha = $2 AND perfil = $3', [email, senha, 'admin']);
        } else {
console.log("Tipo de login escolhido no servidor:", tipoLoginEscolhido);
            console.log("Tentando login como CLIENTE");
            result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND senha = $2 AND perfil = $3', [email, senha, 'cliente']);
        }

        if (result.rows.length > 0) {
            const user = result.rows[0];
            delete user.senha; // Segurança
            
            res.json({ 
                sucesso: true, 
                tipo: user.perfil, 
                nome: user.nome 
            });
        } else {
            res.status(401).json({ sucesso: false, message: "E-mail ou senha incorretos para este tipo de acesso" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro no banco de dados" });
    }
});

// =====================
// Rotas das Tabelas
// =====================
// A rota de produtos fica fora do autenticador para o catálogo ser público
app.use("/produtos", produtosRouter);

// As outras rotas precisam de API KEY (autenticarAPIkey)
app.use("/clientes", clientesRouter);
app.use("/usuarios", usuariosRouter);
app.use("/vendas", vendasRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});