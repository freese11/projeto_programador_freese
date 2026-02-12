const express = require('express');
const pool = require('../db'); 

const router = express.Router();




router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produtos');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.post("/", async (req, res) => {
  try {
    const { nome, marca, valor, estoque, tipo, cor, ativoinativo, tamanho,img } = req.body;
    if (!nome || !marca || !valor || !estoque || !tipo || !cor || !ativoinativo || !tamanho || !img) return res.status(400).json({ error: "Campos obrigatórios: nome, marca, valor, estoque, tipo, cor, ativoinativo, tamanho e img" });

    const result = await pool.query(
      "INSERT INTO produtos (nome, marca, valor, estoque, tipo, cor, ativoinativo, tamanho,img) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9) RETURNING *",
      [nome, marca, valor, estoque, tipo, cor, ativoinativo,tamanho,img]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao inserir produto",errorDetails: err.message });
  }
});

router.delete("/:codproduto", async (req, res) => {
    try {
        const { codproduto } = req.params;
        const result = await pool.query("DELETE FROM produtos WHERE codproduto = $1 RETURNING *", [codproduto]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Produto não encontrado" });
        }
        res.json({ message: "Produto deletado com sucesso", produto: result.rows[0] });
      }
        catch (err) {
        res.status(500).json({ error: "Erro ao deletar produto" ,errorDetails: err.message});
        }
});

router.get('/:codproduto', async (req, res) => {
    try {
        const { codproduto } = req.params;
        const result = await
            pool.query('SELECT * FROM produtos WHERE codproduto = $1', [codproduto]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.put("/:codproduto", async (req, res) => {
    try {
        const { codproduto } = req.params;
        const { nome, marca, valor, estoque, tipo, cor, ativoinativo, tamanho, img } = req.body;
        const result = await pool.query(
          "UPDATE produtos SET nome = $1, marca = $2, valor = $3, estoque = $4, tipo = $5, cor = $6, ativoinativo = $7, tamanho = $8,img=$9 WHERE codproduto = $10 RETURNING *",
          [nome, marca, valor, estoque, tipo, cor, ativoinativo, tamanho,img,codproduto]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Produto não encontrado" });
        }
        res.json({ message: "Produto atualizado com sucesso", produto: result.rows[0] });
        }
    catch (err) {
        res.status(500).json({ error: "Erro ao atualizar produto" ,errorDetails: err.message});
    }
});

module.exports = router;