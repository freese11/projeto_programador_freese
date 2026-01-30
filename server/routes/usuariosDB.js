const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.post("/", async (req, res) => {
  try {
    const { nome, email, numero, senha } = req.body;
    if (!nome || !email || !numero || !senha) return res.status(400).json({ error: "Campos obrigatórios: nome, email, numero, senha" });
    const result = await pool.query(
      "INSERT INTO usuarios (nome, email, numero, senha) VALUES ($1, $2, $3, $4) RETURNING *",
      [nome, email, numero, senha]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao inserir usuario" });
  }
});

router.delete("/:codusuario", async (req, res) => {
  try {
    const { codusuario } = req.params;
    const result = await pool.query("DELETE FROM usuarios WHERE codusuario = $1 RETURNING *", [codusuario]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json({ message: "Usuário deletado com sucesso", usuario: result.rows[0] });
  }
    catch (err) {
    res.status(500).json({ error: "Erro ao deletar usuário" });
    }
});

router.get('/:codusuario', async (req, res) => {
    try {
        const { codusuario } = req.params;
        const result = await
            pool.query('SELECT * FROM usuarios WHERE codusuario = $1', [codusuario]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.put("/:codusuario", async (req, res) => {
  try {
    const { codusuario } = req.params;
    const { nome, email, numero, senha } = req.body;
    const result = await pool.query(
      "UPDATE usuarios SET nome = $1, email = $2, numero = $3, senha = $4 WHERE codusuario = $5 RETURNING *",
      [nome, email, numero, senha, codusuario]
    );  
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json({ message: "Usuário atualizado com sucesso", usuario: result.rows[0] });
  }
  catch (err) {
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});




module.exports = router;