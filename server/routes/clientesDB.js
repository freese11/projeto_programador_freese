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
// ... (resto do código igual)

router.post("/", async (req, res) => {
    try {
        // Agora recebemos a senha também
        const { nome, email, telefone, senha} = req.body;
        const result = await pool.query(
            'INSERT INTO cliente (nome, email, telefone, senha) VALUES ($1, $2, $3, $4) RETURNING *',
            [nome, email, telefone, senha]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

router.put("/:codcliente", async (req, res) => {
    try {
        const { codcliente } = req.params;
        const { nome, email, telefone, senha } = req.body;
        await pool.query(
            'UPDATE cliente SET nome = $1, email = $2, telefone = $3, senha = $4 WHERE codcliente = $5',
            [nome, email, telefone, senha, codcliente]
        );
        res.json({ message: 'Cliente atualizado com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

module.exports = router;

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


module.exports = router;
