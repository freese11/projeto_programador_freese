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

// ROTA PARA FINALIZAR A COMPRA E SALVAR O ENDEREÇO
router.post('/', async (req, res) => {
    // 1. Recebemos os dados que o site da Freese Store enviou
    const { codusuario, carrinho, endereco_entrega } = req.body;

    // Verificação de segurança: não deixa comprar com carrinho vazio
    if (!codusuario || !carrinho || carrinho.length === 0) {
        return res.status(400).json({ erro: "Dados incompletos para finalizar a compra." });
    }

    try {
        // 2. Calcula o valor total do carrinho
        let valorTotal = 0;
        for (let item of carrinho) {
            valorTotal += (item.preco * item.quantidade);
        }

        // 3. INSERE A VENDA NO BANCO DE DADOS (COM O ENDEREÇO)
        const sqlVenda = `
            INSERT INTO vendas (codusuario, status, data, valortotal, endereco_entrega) 
            VALUES ($1, 'Finalizado', CURRENT_DATE, $2, $3) 
            RETURNING codvenda;
        `;
        
        const valoresVenda = [codusuario, valorTotal, endereco_entrega];
        const resultVenda = await pool.query(sqlVenda, valoresVenda);
        const codVendaGerado = resultVenda.rows[0].codvenda;

        // 4. INSERE OS ITENS DA VENDA (As roupas compradas)
        // Se der erro de "tabela itens_venda não existe", a gente resolve depois!
        const sqlItem = `
            INSERT INTO itens_venda (codvenda, codproduto, quantidade, precounitario) 
            VALUES ($1, $2, $3, $4);
        `;

        for (let item of carrinho) {
            await pool.query(sqlItem, [codVendaGerado, item.id, item.quantidade, item.preco]);
        }

        // 5. Retorna mensagem de sucesso
        res.status(201).json({ 
            mensagem: "Compra finalizada com sucesso!", 
            codvenda: codVendaGerado 
        });

    } catch (erro) {
        console.error("Erro ao processar venda:", erro);
        res.status(500).json({ erro: "Erro interno ao finalizar a compra.", detalhes: erro.message });
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
