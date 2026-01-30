const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vendas');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.get('/:codvenda', async (req, res) => {
    try {
        const { codvenda } = req.params;
        const result = await pool.query('SELECT * FROM vendas WHERE codvenda = $1', [codvenda]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.post("/", async (req, res) => {
    try { 
        const { codcliente, codproduto, codusuario, status, data, valortotal  } = req.body;
        if (!codcliente || !codproduto || !codusuario || !status || !data || !valortotal ) return res.status(400).json({ error: "Campos obrigatórios: codcliente, codproduto, codusuario, status, data, valortotal " });
        const result = await pool.query(
            "INSERT INTO vendas (codcliente, codproduto, codusuario, status, data, valortotal ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [codcliente, codproduto, codusuario, status, data, valortotal]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Erro ao inserir venda" ,errorDetails: err.message});
    }
});

router.delete("/:codvenda", async (req, res) => {
    try {
        const { codvenda } = req.params;
        const result = await pool.query("DELETE FROM vendas WHERE codvenda = $1 RETURNING *", [codvenda]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Venda não encontrada" });
        }
        res.json({ message: "Venda deletada com sucesso", venda: result.rows[0] });
    }
    catch (err) {
        res.status(500).json({ error: "Erro ao deletar venda" ,errorDetails: err.message});
    }
});

router.put("/:codvenda", async (req, res) => {
    try {
        const { codvenda } = req.params;
        const { codcliente, codproduto, codusuario, status, data, valortotal  } = req.body;
        const result = await pool.query(
            "UPDATE vendas SET codcliente = $1, codproduto = $2, codusuario = $3, status = $4, data = $5, valortotal = $6 WHERE codvenda = $7 RETURNING *",
            [codcliente, codproduto, codusuario, status, data, valortotal, codvenda]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Venda não encontrada" });
        }
        res.json({ message: "Venda atualizada com sucesso", venda: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Erro ao atualizar venda" ,errorDetails: err.message});
    }
});


module.exports = router;