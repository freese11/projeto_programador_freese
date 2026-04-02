// URL do seu Backend
const URL_SERVIDOR = "https://projeto-programador-freese-backend.onrender.com";
const API_URL = `${URL_SERVIDOR}/produtos`;
const VENDAS_URL = `${URL_SERVIDOR}/vendas`;
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// Pega o carrinho que o cliente montou na home
let carrinhoCheckout = JSON.parse(localStorage.getItem("carrinho")) || [];
let produtosBD = [];

// Assim que a página carrega, ele puxa os produtos
document.addEventListener("DOMContentLoaded", () => {
    carregarResumoPedido();
});

// FUNÇÃO NOVA - Preenche endereço automático via CEP! (Padrão Ouro de E-commerce)
async function buscarCep() {
    let cep = document.getElementById('cep').value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await resposta.json();

        if (!dados.erro) {
            document.getElementById('rua').value = dados.logradouro;
            document.getElementById('bairro').value = dados.bairro;
            document.getElementById('cidade').value = dados.localidade;
            document.getElementById('estado').value = dados.uf;
            document.getElementById('numero').focus(); // Joga o cursor pro número
        }
    } catch (err) {
        console.log("Erro ao buscar CEP:", err);
    }
}

// Monta o resumo lateral com foto e preço atualizado
async function carregarResumoPedido() {
    const container = document.getElementById("lista-resumo-itens");
    
    if (carrinhoCheckout.length === 0) {
        alert("Seu carrinho está vazio! Voltando para a loja...");
        window.location.href = "../index.html"; 
        return;
    }

    try {
        const resposta = await fetch(API_URL);
        produtosBD = await resposta.json();
        
        let total = 0;
        container.innerHTML = "";

        carrinhoCheckout.forEach(item => {
            const produto = produtosBD.find(p => p.codproduto === item.codproduto);
            if (produto) {
                total += produto.valor * item.qtd;
                
                let imgUrl = produto.img;
                if(imgUrl && !imgUrl.startsWith('http')) {
                    imgUrl = URL_SERVIDOR + (imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl);
                }

                container.innerHTML += `
                    <div class="item-resumo">
                        <img src="${imgUrl}" onerror="this.src='https://via.placeholder.com/65'">
                        <div class="item-info">
                            <h4>${produto.nome}</h4>
                            <p>Tam: ${item.tamanho || 'Único'} | Qtd: ${item.qtd}</p>
                        </div>
                        <div class="item-preco">R$ ${(produto.valor * item.qtd).toFixed(2)}</div>
                    </div>
                `;
            }
        });

        // Atualiza os valores na tela
        document.getElementById("valor-subtotal").innerText = `R$ ${total.toFixed(2)}`;
        document.getElementById("valor-total-checkout").innerText = `R$ ${total.toFixed(2)}`;

    } catch (err) {
        console.error("Erro ao carregar os itens:", err);
    }
}

// Envia a Venda pro seu Banco de Dados (vendasdb.js)
async function processarCompra() {
    // 1. Checa se tá logado
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    if (!usuarioJson || usuarioJson === "undefined") {
        alert("Para sua segurança, faça login antes de finalizar a compra.");
        window.location.href = "../index.html";
        return;
    }

    // 2. Valida se preencheu o básico do endereço
    const cep = document.getElementById("cep").value;
    const numero = document.getElementById("numero").value;
    
    if(!cep || !numero) {
        alert("Por favor, preencha seu CEP e Número para a entrega.");
        document.getElementById("cep").focus();
        return;
    }

    let session = JSON.parse(usuarioJson);
    let userObj = session.usuario ? session.usuario : session;
    let codusuario = userObj.codusuario || userObj.id;

    const btn = document.getElementById("btn-confirmar-compra");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btn.disabled = true;

    try {
        // Envia pro backend novo que fizemos na mensagem anterior!
        const resposta = await fetch(VENDAS_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "minha-chave": API_KEY 
            },
            body: JSON.stringify({
                codusuario: codusuario,
                carrinho: carrinhoCheckout
            })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert("🎉 SUCESSO! Seu pedido na Freese Store foi confirmado!");
            localStorage.removeItem("carrinho"); // Esvazia o carrinho
            window.location.href = "../index.html"; // Volta pra home
        } else {
            alert("Não foi possível finalizar: " + (dados.mensagem || "Erro desconhecido."));
            btn.innerHTML = '<i class="fas fa-lock"></i> Tentar Novamente';
            btn.disabled = false;
        }

    } catch (erro) {
        alert("Ops! O servidor parece estar offline. Tente novamente.");
        btn.innerHTML = '<i class="fas fa-lock"></i> Confirmar Pedido';
        btn.disabled = false;
    }
}
