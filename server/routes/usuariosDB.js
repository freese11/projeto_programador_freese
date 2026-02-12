const express = require('express');
const pool = require('../db');
const router = express.Router();

// --- ROTA DE LOGIN (ADICIONADA) ---
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Busca o usuário e traz o campo 'perfil'
        const result = await pool.query(
            'SELECT nome, email, perfil FROM usuarios WHERE email = $1 AND senha = $2', 
            [email, senha]
        );

        if (result.rows.length > 0) {
            const usuario = result.rows[0];
            res.json({
                success: true,
                nome: usuario.nome,
                perfil: usuario.perfil // Retorna 'admin' ou 'cliente'
            });
        } else {
            res.status(401).json({ success: false, message: "E-mail ou senha incorretos" });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erro ao tentar fazer login" });
    }
});

// --- LISTAR TODOS ---
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// --- CADASTRO (ATUALIZADO PARA INCLUIR PERFIL) ---
router.post("/", async (req, res) => {
  try {
    const { nome, email, numero, senha, perfil } = req.body;
    
    // Se não vier perfil no corpo da requisição, definimos como 'cliente' por padrão
    const perfilUsuario = perfil || 'cliente';

    if (!nome || !email || !numero || !senha) {
        return res.status(400).json({ error: "Campos obrigatórios: nome, email, numero, senha" });
    }

    const result = await pool.query(
      "INSERT INTO usuarios (nome, email, numero, senha, perfil) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nome, email, numero, senha, perfilUsuario]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao inserir usuario" });
  }
});

// --- BUSCAR UM USUÁRIO ---
router.get('/:codusuario', async (req, res) => {
    try {
        const { codusuario } = req.params;
        const result = await pool.query('SELECT * FROM usuarios WHERE codusuario = $1', [codusuario]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send('Erro no servidor');
    }
});

// --- ATUALIZAR ---
router.put("/:codusuario", async (req, res) => {
  try {
    const { codusuario } = req.params;
    const { nome, email, numero, senha, perfil } = req.body;
    const result = await pool.query(
      "UPDATE usuarios SET nome = $1, email = $2, numero = $3, senha = $4, perfil = $5 WHERE codusuario = $6 RETURNING *",
      [nome, email, numero, senha, perfil, codusuario]
    );  
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// --- DELETAR ---
router.delete("/:codusuario", async (req, res) => {
  try {
    const { codusuario } = req.params;
    await pool.query("DELETE FROM usuarios WHERE codusuario = $1", [codusuario]);
    res.json({ message: "Usuário deletado" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

module.exports = router;