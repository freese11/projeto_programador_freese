const URL_SERVIDOR = "https://projeto-programador-freese-backend.onrender.com";
const API_VENDAS = `${URL_SERVIDOR}/vendas`;
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456"; // Lembre-se de colocar sua chave real

// Variável global para guardar os pedidos carregados na memória e facilitar a busca para o Modal
let pedidosMemoria = [];

document.addEventListener("DOMContentLoaded", () => {
    verificarAcesso();
});

// 1. Verifica se a pessoa está logada
function verificarAcesso() {
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    
    if (!usuarioJson || usuarioJson === "undefined") {
        // Substituído o alert antigo pelo nosso Toast chique!
        showToast("Você precisa fazer login para ver seus pedidos.", "warning");
        
        // Espera 2 segundos para a pessoa ler o aviso e manda para a Home
        setTimeout(() => {
            window.location.href = "/index.html"; 
        }, 2000);
        return;
    }

    const session = JSON.parse(usuarioJson);
    const userObj = session.usuario ? session.usuario : session;
    const meuId = userObj.codusuario || userObj.id;

    carregarMeusPedidos(meuId);
}

// 2. Busca os pedidos no servidor
async function carregarMeusPedidos(meuId) {
    const container = document.getElementById("lista-pedidos");

    try {
        const resposta = await fetch(API_VENDAS, {
            method: "GET",
            headers: {
                "minha-chave": API_KEY,
                "Content-Type": "application/json"
            }
        });

        if (!resposta.ok) throw new Error("Erro no servidor");

        const todasVendas = await resposta.json();
        
        // Filtra as compras do cliente e inverte para a mais nova aparecer primeiro
        const meusPedidos = todasVendas.filter(venda => venda.codusuario == meuId).reverse();

        // SALVA NA MEMÓRIA PARA O MODAL PODER USAR DEPOIS
        pedidosMemoria = meusPedidos;

        renderizarPedidos(meusPedidos);

    } catch (erro) {
        console.error("Erro ao buscar pedidos:", erro);
        container.innerHTML = "<h3 style='color: red; text-align: center;'>Erro ao carregar seus pedidos. Tente novamente mais tarde.</h3>";
        // Avisa também pelo Toast
        showToast("Erro ao carregar seus pedidos. Tente novamente mais tarde.", "error");
    }
}

// 3. Formata a data para um padrão elegante
function formatarDataElegante(dataISO) {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const dataObj = new Date(dataISO);
    
    // Corrige fuso horário
    dataObj.setMinutes(dataObj.getMinutes() + dataObj.getTimezoneOffset());

    const dia = dataObj.getDate().toString().padStart(2, '0');
    const mes = meses[dataObj.getMonth()];
    const ano = dataObj.getFullYear();
    return `${dia} ${mes} ${ano}`;
}

// 4. Desenha os pedidos na tela
function renderizarPedidos(pedidos) {
    const container = document.getElementById("lista-pedidos");
    container.innerHTML = "";

    // Se não tiver pedidos
    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="pedidos-vazio">
                <i class="fas fa-shopping-bag"></i>
                <h3>Nenhum pedido encontrado</h3>
                <p>Seu guarda-roupa está precisando de um upgrade.</p>
                <a href="/catalago/catalago.html" class="btn-comprar">Explorar Catálogo</a>
            </div>
        `;
        return;
    }

    // Cria os cartões
    pedidos.forEach(pedido => {
        let dataFormatada = formatarDataElegante(pedido.data);
        
        let statusBanco = pedido.status ? pedido.status.toLowerCase() : 'pendente';
        let classeStatus = 'status-pendente';
        let classeLinha = 'linha-pendente';
        let textoStatus = 'PROCESSANDO';
        let iconeStatus = 'fa-clock';

        if (statusBanco === 'concluido' || statusBanco === 'concluído' || statusBanco === 'finalizado') {
            classeStatus = 'status-concluido';
            classeLinha = 'linha-concluido';
            textoStatus = 'FINALIZADO';
            iconeStatus = 'fa-check-circle';
        } else if (statusBanco === 'cancelado') {
            classeStatus = 'status-cancelado';
            classeLinha = 'linha-cancelado';
            textoStatus = 'CANCELADO';
            iconeStatus = 'fa-times-circle';
        }

        container.innerHTML += `
            <div class="pedido-card">
                <!-- A LINHA COLORIDA NA ESQUERDA -->
                <div class="pedido-linha-decorativa ${classeLinha}"></div>
                
                <div class="pedido-conteudo">
                    <div class="pedido-header">
                        <div class="header-esq">
                            <div class="icone-caixa">
                                <i class="fas fa-box-open"></i>
                            </div>
                            <div>
                                <span class="pedido-id">Pedido #${pedido.codvenda}</span>
                                <span class="pedido-data">Realizado em ${dataFormatada}</span>
                            </div>
                        </div>
                        <span class="badge ${classeStatus}">
                            <i class="fas ${iconeStatus}" style="margin-right: 6px; font-size: 14px;"></i> ${textoStatus}
                        </span>
                    </div>
                    
                    <div class="pedido-body">
                        <div class="info-grupo">
                            <label><i class="fas fa-map-marker-alt"></i> Entrega para</label>
                            <span>${pedido.endereco_entrega || 'Endereço não registrado'}</span>
                        </div>

                        <div class="info-grupo">
                            <label><i class="fas fa-wallet"></i> Valor Total</label>
                            <span class="info-valor">R$ ${Number(pedido.valortotal).toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    <div class="pedido-footer">
                        <!-- BOTÃO QUE CHAMA O MODAL -->
                        <button class="btn-detalhes" onclick="abrirModalDetalhes(${pedido.codvenda})">
                            <i class="fas fa-receipt"></i> Ver Detalhes
                        </button>
                        
                        <button class="btn-ajuda" onclick="window.open('https://wa.me/555195352834', '_blank')">
                            <i class="fab fa-whatsapp"></i> Preciso de Ajuda
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

// ==========================================
// 5. FUNÇÕES DO MODAL DE DETALHES
// ==========================================

function abrirModalDetalhes(idVenda) {
    // Acha o pedido clicado na memória usando o ID
    const pedido = pedidosMemoria.find(p => p.codvenda === idVenda);
    if (!pedido) return;

    // Preenche o Cabeçalho do Modal
    let dataFormatada = formatarDataElegante(pedido.data);
    
    // Alimenta as informações de resumo
    document.getElementById("modal-info-resumo").innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 16px; color: #111;">Pedido #${pedido.codvenda}</strong>
            <span class="badge" style="background: #eee; color: #333; font-size: 10px;">${pedido.status || 'PROCESSANDO'}</span>
        </div>
        <span style="font-size: 13px; color: #666; display: block; margin-top: 5px;">
            <i class="far fa-calendar-alt"></i> Realizado em ${dataFormatada}
        </span>
    `;

    // Atualiza o valor total no rodapé do modal
    document.getElementById("modal-valor-total").innerText = `R$ ${Number(pedido.valortotal).toFixed(2).replace('.', ',')}`;

    // Preenche a lista de produtos
    const containerProdutos = document.getElementById("modal-lista-produtos");
    containerProdutos.innerHTML = "";

    // Verifica se o seu banco de dados retorna a lista de produtos/itens dentro do pedido
    if (pedido.itens && pedido.itens.length > 0) {
        pedido.itens.forEach(item => {
            containerProdutos.innerHTML += `
                <div class="item-comprado">
                    <img src="${item.imagem || '/midias/placeholder-roupa.png'}" class="item-img" alt="Produto">
                    <div class="item-info">
                        <strong>${item.nome || 'Produto Exclusivo Freese'}</strong>
                        <span>Qtd: ${item.quantidade || 1} | Tam: ${item.tamanho || 'Único'}</span>
                    </div>
                    <span class="item-preco">R$ ${Number(item.preco_unitario || item.preco || 0).toFixed(2).replace('.', ',')}</span>
                </div>
            `;
        });
    } else {
        // Mensagem de fallback caso os itens ainda não venham da API do backend
        containerProdutos.innerHTML = `
            <div style="text-align: center; padding: 25px 10px; color: #888; background: #f8f9fa; border-radius: 8px;">
                <i class="fas fa-tshirt" style="font-size: 35px; margin-bottom: 15px; color: #ccc;"></i>
                <h4 style="color: #333; font-weight: 800; font-size: 16px; margin-bottom: 5px;">Itens em separação</h4>
                <p style="font-size: 13px;">Os detalhes das roupas deste pedido estarão disponíveis em breve.</p>
            </div>
        `;
    }

    // Por fim, mostra o modal na tela alterando o display de 'none' para 'flex'
    document.getElementById("modal-detalhes").style.display = "flex";
}

// Função para fechar o Modal
function fecharModal() {
    document.getElementById("modal-detalhes").style.display = "none";
}

// Fechar o modal se o usuário clicar fora da janela branca
document.getElementById("modal-detalhes").addEventListener('click', function(e) {
    if (e.target === this) {
        fecharModal();
    }
});

/* ============================================================
   FUNÇÃO DE NOTIFICAÇÃO (TOAST) - ESTILO FREESE STORE
   ============================================================ */
function showToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Dicionário com as cores, ícones e títulos Exclusivos
    const config = {
        'success': { icone: 'fa-check', titulo: 'SUCESSO', cor: '#10b981' },        // Verde esmeralda
        'error':   { icone: 'fa-times', titulo: 'ERRO', cor: 'var(--premium-red)' }, // Vermelho da loja
        'warning': { icone: 'fa-exclamation', titulo: 'ATENÇÃO', cor: '#f59e0b' },   // Amarelo
        'info':    { icone: 'fa-info', titulo: 'INFORMAÇÃO', cor: '#3b82f6' }        // Azul
    };

    const atual = config[tipo] || config['info'];

    const toast = document.createElement('div');
    toast.className = `toast-freese ${tipo}`;
    
    // Injeta a cor certa para a barrinha animada no CSS
    toast.style.setProperty('--toast-cor', atual.cor);

    // Estrutura premium do aviso
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

    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Some depois de 3.5 segundos exatos (mesmo tempo da barrinha sumir)
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Espera o CSS fechar para excluir
    }, 3500);
}
