const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cliente');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.get('/:codcliente', async (req, res) => {
    try {
        const { codcliente } = req.params;
        const result = await pool.query('SELECT * FROM cliente WHERE codcliente = $1', [codcliente]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.post("/", async (req, res) => {
    try {
        const { nome, email, telefone } = req.body;
        const result = await pool.query(
            'INSERT INTO cliente (nome, email, telefone) VALUES ($1, $2, $3) RETURNING *',
            [nome, email, telefone]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.delete("/:codcliente", async (req, res) => {
    try {
        const { codcliente } = req.params;
        await pool.query('DELETE FROM cliente WHERE codcliente = $1', [codcliente]);
        res.json({ message: 'Cliente deletado com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.put("/:codcliente", async (req, res) => {
    try {
        const { codcliente } = req.params;
        const { nome, email, telefone } = req.body;
        await pool.query(
            'UPDATE cliente SET nome = $1, email = $2, telefone = $3 WHERE codcliente = $4',
            [nome, email, telefone, codcliente]
        );
        res.json({ message: 'Cliente atualizado com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

module.exports = router;
