const express = require('express');
const pool = require('../db');

const router = express.Router();

// 1. BUSCAR TODAS AS VENDAS (AGORA COM O NOME DO CLIENTE!)
router.get('/', async (req, res) => {
    try {
        // Fazemos um JOIN ligando o codusuario da venda com o codusuario do cliente
        const sql = `
            SELECT vendas.*, usuarios.nome AS nome_cliente 
            FROM vendas 
            LEFT JOIN usuarios ON vendas.codusuario = usuarios.codusuario
            ORDER BY vendas.codvenda DESC
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar vendas:", err.message);
        res.status(500).send('Erro no servidor');
    }
});

// 2. BUSCAR UMA VENDA ESPECÍFICA (TAMBÉM COM O NOME)
router.get('/:codvenda', async (req, res) => {
    try {
        const { codvenda } = req.params;
        const sql = `
            SELECT vendas.*, usuarios.nome AS nome_cliente 
            FROM vendas 
            LEFT JOIN usuarios ON vendas.codusuario = usuarios.codusuario
            WHERE vendas.codvenda = $1
        `;
        const result = await pool.query(sql, [codvenda]);
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
        const { status } = req.body; // Pegamos APENAS o status que o painel enviou
        
        // Atualizamos APENAS a coluna status no banco de dados! O resto fica intacto.
        const result = await pool.query(
            "UPDATE vendas SET status = $1 WHERE codvenda = $2 RETURNING *",
            [status, codvenda]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Venda não encontrada" });
        }
        
        res.json({ message: "Status atualizado com sucesso", venda: result.rows[0] });
    } catch (err) {
        console.error("Erro ao atualizar no banco:", err);
        res.status(500).json({ error: "Erro ao atualizar venda", errorDetails: err.message });
    }
});

module.exports = router;
