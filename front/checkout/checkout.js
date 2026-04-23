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
            showToast("CEP encontrado com sucesso!", "success");
        } else {
            showToast("CEP não encontrado. Verifique se digitou corretamente.", "error");
        }
    } catch (err) {
        console.log("Erro ao buscar CEP:", err);
        showToast("Erro ao buscar informações do CEP.", "error");
    }
}

// Monta o resumo lateral com foto e preço atualizado
async function carregarResumoPedido() {
    const container = document.getElementById("lista-resumo-itens");
    
    if (carrinhoCheckout.length === 0) {
        showToast("Seu carrinho está vazio! Voltando para a loja...", "warning");
        setTimeout(() => { window.location.href = "../index.html"; }, 2000); 
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

        // Atualiza os valores na tela (MANTIDO COM PONTO COMO SOLICITADO)
        document.getElementById("valor-subtotal").innerText = `R$ ${total.toFixed(2)}`;
        document.getElementById("valor-total-checkout").innerText = `R$ ${total.toFixed(2)}`;

    } catch (err) {
        console.error("Erro ao carregar os itens:", err);
    }
}

// Envia a Venda pro seu Banco de Dados
async function processarCompra() {
    // 1. Checa se tá logado
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    if (!usuarioJson || usuarioJson === "undefined") {
        showToast("Para sua segurança, faça login antes de finalizar a compra.", "warning");
        setTimeout(() => { window.location.href = "../index.html"; }, 2500);
        return;
    }

    // 2. PEGA TODOS OS DADOS DO ENDEREÇO DA TELA
    const cep = document.getElementById("cep").value;
    const rua = document.getElementById("rua").value;
    const numero = document.getElementById("numero").value;
    
    // Como complemento é opcional, a gente checa se o campo existe no HTML
    const campoComplemento = document.getElementById("complemento");
    const complemento = campoComplemento ? campoComplemento.value : "";
    
    const bairro = document.getElementById("bairro").value;
    const cidade = document.getElementById("cidade").value;
    const estado = document.getElementById("estado").value;
    
    // Validação de segurança
    if(!cep || !numero || !rua || !bairro) {
        showToast("Por favor, preencha seu endereço completo (CEP, Rua, Número e Bairro) para a entrega.", "warning");
        document.getElementById("cep").focus();
        return;
    }

    // MONTA A STRING DO ENDEREÇO COMPLETO PARA SALVAR NO BANCO
    const enderecoCompleto = `${rua}, ${numero} ${complemento ? '- ' + complemento : ''}, ${bairro}, ${cidade} - ${estado}, CEP: ${cep}`;

    // 3. Pega o ID do usuário
    let session = JSON.parse(usuarioJson);
    let userObj = session.usuario ? session.usuario : session;
    let codusuario = userObj.codusuario || userObj.id;

    // 4. FORMATA O CARRINHO PARA O PADRÃO QUE O SERVIDOR ESPERA (AGORA COM O TAMANHO!)
    const carrinhoFormatado = carrinhoCheckout.map(item => {
        const produto = produtosBD.find(p => p.codproduto === item.codproduto);
        return {
            id: item.codproduto,
            quantidade: item.qtd,
            preco: produto ? produto.valor : 0, // Pega o preço atualizado do banco
            tamanho: item.tamanho || 'Único' // << AQUI ESTÁ A GRANDE CORREÇÃO! AGORA ELE ENVIA O TAMANHO.
        };
    });

    // 5. Muda o botão para "Processando..."
    const btn = document.getElementById("btn-confirmar-compra");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btn.disabled = true;

    try {
        // Envia pro backend novo que fizemos!
        const resposta = await fetch(VENDAS_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "minha-chave": API_KEY 
            },
            body: JSON.stringify({
                codusuario: codusuario,
                carrinho: carrinhoFormatado,
                endereco_entrega: enderecoCompleto
            })
        });

        const dados = await resposta.json();

        if (resposta.ok || resposta.status === 201) {
            showToast("SUCESSO! Seu pedido na Freese Store foi confirmado!", "success");
            localStorage.removeItem("carrinho"); // Esvazia o carrinho
            setTimeout(() => { window.location.href = "../index.html"; }, 3000); // Volta pra home após ler o aviso
        } else {
            showToast("Não foi possível finalizar: " + (dados.erro || dados.mensagem || "Erro desconhecido."), "error");
            btn.innerHTML = '<i class="fas fa-lock"></i> Tentar Novamente';
            btn.disabled = false;
        }

    } catch (erro) {
        showToast("Ops! O servidor parece estar offline. Tente novamente.", "error");
        btn.innerHTML = '<i class="fas fa-lock"></i> Confirmar Pedido';
        btn.disabled = false;
    }
}

/* ============================================================
   FUNÇÃO DE NOTIFICAÇÃO (TOAST) - ESTILO FREESE STORE
   ============================================================ */
function showToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const config = {
        'success': { icone: 'fa-check', titulo: 'SUCESSO', cor: '#10b981' },        
        'error':   { icone: 'fa-times', titulo: 'ERRO', cor: 'var(--premium-red)' }, 
        'warning': { icone: 'fa-exclamation', titulo: 'ATENÇÃO', cor: '#f59e0b' },   
        'info':    { icone: 'fa-info', titulo: 'INFORMAÇÃO', cor: '#3b82f6' }        
    };

    const atual = config[tipo] || config['info'];

    const toast = document.createElement('div');
    toast.className = `toast-freese ${tipo}`;
    
    toast.style.setProperty('--toast-cor', atual.cor);

    toast.innerHTML = `
        <div class="toast-icon" style="color: ${atual.cor}">
            <i class="fas ${atual.icone}"></i>
        </div>
        <div class="toast-content">
            <span class="toast-title">${atual.titulo}</span>
            <span class="toast-message">${mensagem}</span>
        </div>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 3500);
}
