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
    // Usamos client.connect() para fazer uma "Transação" (BEGIN/COMMIT)
    // Isso garante que se der erro no meio (ex: falta de estoque), ele cancela tudo e não cobra o cliente à toa.
    const client = await pool.connect();
    
    try { 
        await client.query("BEGIN"); // Inicia a transação

        // O Frontend vai enviar o código do usuário logado e o array do carrinho
        const { codusuario, carrinho } = req.body;
        
        if (!codusuario) throw new Error("Usuário não identificado.");
        if (!carrinho || carrinho.length === 0) throw new Error("O carrinho está vazio.");

        let valorTotalVenda = 0;
        const dataAtual = new Date(); // Pega a data de hoje
        const statusVenda = 'Finalizado'; // ou 'Pendente', como você preferir

        // 1. Cria o registro na tabela "vendas" com valor 0 por enquanto
        const resultVenda = await client.query(
            "INSERT INTO vendas (codusuario, status, data, valortotal) VALUES ($1, $2, $3, $4) RETURNING codvenda",
            [codusuario, statusVenda, dataAtual, 0]
        );
        
        // Pega o código da venda que acabou de ser gerado no banco
        const codvendaGerado = resultVenda.rows[0].codvenda;

        // 2. Faz um loop (for) para passar por cada produto do carrinho do cliente
        for (const item of carrinho) {
            const { codproduto, qtd } = item;

            // Busca o preço real do produto no banco e vê quanto tem no estoque
            const produtoBD = await client.query(
                "SELECT valor, estoque FROM produtos WHERE codproduto = $1", 
                [codproduto]
            );

            if (produtoBD.rowCount === 0) throw new Error(`Produto código ${codproduto} não existe mais.`);
            
            const precoUnitario = produtoBD.rows[0].valor;
            const estoqueAtual = produtoBD.rows[0].estoque;

            // Validação de estoque importantíssima para e-commerce!
            if (qtd > estoqueAtual) throw new Error(`Estoque insuficiente para o produto código ${codproduto}.`);

            // Insere o produto na tabela "itens_venda" conectando com o código da venda
            await client.query(
                "INSERT INTO itens_venda (codvenda, codproduto, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
                [codvendaGerado, codproduto, qtd, precoUnitario]
            );

            // Tira a roupa do estoque na tabela "produtos"
            await client.query(
                "UPDATE produtos SET estoque = estoque - $1 WHERE codproduto = $2",
                [qtd, codproduto]
            );

            // Vai somando o valor dos produtos para termos o total da nota
            valorTotalVenda += (precoUnitario * qtd);
        }

        // 3. Atualiza a tabela "vendas" colocando o Valor Total correto da compra
        await client.query(
            "UPDATE vendas SET valortotal = $1 WHERE codvenda = $2",
            [valorTotalVenda, codvendaGerado]
        );

        // Se chegou até aqui sem dar erro, salva tudo no banco de uma vez!
        await client.query("COMMIT");
        
        // Responde ao frontend que deu tudo certo
        res.status(201).json({ sucesso: true, mensagem: "Venda realizada com sucesso na Freese Store!" });

    } catch (err) {
        // Se der qualquer erro (ex: alguém comprou o último item 1 segundo antes), ele desfaz tudo
        await client.query("ROLLBACK");
        console.error("Erro na venda:", err.message);
        res.status(400).json({ sucesso: false, mensagem: err.message });
    } finally {
        client.release(); // Libera o banco de dados
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