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
console.log("TIPO DE LOGIN SOLICITADO:", tipoLoginEscolhido);
        if (tipoLoginEscolhido === 'admin') 
            {
            result = await pool.query(
                'SELECT * FROM usuarios WHERE email = $1 AND senha = $2 AND perfil = $3',
                [email, senha, 'adm']
            );
        } else {
            result = await pool.query(
                'SELECT * FROM usuarios WHERE email = $1 AND senha = $2 AND perfil = $3',
                [email, senha, 'cliente']
            );
        }

        if (result.rows.length > 0) {
            const user = result.rows[0];

            res.json({
                sucesso: true,
                nome: user.nome,
                tipo: user.perfil // 🔥 continua como tipo
            });

        } else {
            res.status(401).json({
                sucesso: false,
                message: "E-mail ou senha incorretos"
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro no servidor" });
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