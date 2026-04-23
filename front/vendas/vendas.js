const API = "https://projeto-programador-freese-backend.onrender.com/vendas";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456"; // Coloque a sua senha real aqui!

let vendas = [];
let graficoInstancia = null; 

function voltar() {
    window.location.href = "/admin/admin.html";
}

// 1. CARREGAR VENDAS DO BANCO DE DADOS
async function carregar() {
    try {
        const res = await fetch(API, {
            method: "GET",
            headers: {
                "minha-chave": API_KEY,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            throw new Error(`Servidor bloqueou o acesso. Status: ${res.status}`);
        }

        vendas = await res.json();

        if (Array.isArray(vendas)) {
            atualizarCards(vendas);
            atualizarGrafico(vendas);
            renderizar(vendas);
        } else {
            showToast("O servidor não retornou uma lista válida de vendas.", "error");
        }

    } catch (error) {
        console.error("Erro ao carregar vendas:", error);
        showToast("Erro ao carregar as vendas. Verifique a conexão ou a API_KEY.", "error");
    }
}

// 2. ATUALIZAR CARTÕES DE RESUMO
function atualizarCards(lista) {
    let total = 0;
    lista.forEach(v => {
        let status = v.status ? v.status.toLowerCase() : '';
        if (status !== 'cancelado') {
            total += Number(v.valortotal);
        }
    });

    document.getElementById("total-pedidos").innerText = lista.length;
    document.getElementById("total-faturamento").innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// 3. RENDERIZAR O GRÁFICO (Chart.js)
function atualizarGrafico(lista) {
    const ctx = document.getElementById('graficoVendas').getContext('2d');

    const vendasPorData = {};

    lista.forEach(v => {
        let dataFormatada = new Date(v.data).toLocaleDateString('pt-BR');

        if (!vendasPorData[dataFormatada]) {
            vendasPorData[dataFormatada] = 0;
        }

        let status = v.status ? v.status.toLowerCase() : '';
        if (status !== 'cancelado') {
            vendasPorData[dataFormatada] += Number(v.valortotal);
        }
    });

    const labels = Object.keys(vendasPorData);
    const valores = Object.values(vendasPorData);

    if (graficoInstancia) {
        graficoInstancia.destroy();
    }

    graficoInstancia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Faturamento por Dia (R$)',
                data: valores,
                backgroundColor: '#111', 
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } 
            }
        }
    });
}

// 4. RENDERIZAR TABELA
function renderizar(lista) {
    const tabela = document.getElementById("tabela-vendas");
    tabela.innerHTML = "";

    lista.forEach(v => {
        let statusAtual = v.status ? v.status.toLowerCase() : 'pendente';

        let classeStatus = 'status-pendente';
        let textoStatus = 'Pendente';

        if (statusAtual === 'concluido' || statusAtual === 'concluído') {
            classeStatus = 'status-concluido';
            textoStatus = 'Concluído';
        } else if (statusAtual === 'cancelado') {
            classeStatus = 'status-cancelado';
            textoStatus = 'Cancelado';
        }

        let dataStr = new Date(v.data).toLocaleDateString('pt-BR');
        let valorStr = Number(v.valortotal).toFixed(2).replace('.', ',');

        tabela.innerHTML += `
            <tr>
                <td style="font-weight: bold; color: #555;">#${v.codvenda}</td>
                <td><strong>${v.nome_cliente ? v.nome_cliente : 'Usuário'}</strong> <span style="color:#888; font-size:12px;">(#${v.codusuario})</span></td>
                <td>${dataStr}</td>
                <td style="color: #111; font-weight: 900;">R$ ${valorStr}</td>
                <td>${v.endereco_entrega || 'Não informado'}</td>
                <td><span class="${classeStatus}">${textoStatus}</span></td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn-ver-detalhes" onclick="abrirModalDetalhes(${v.codvenda})" title="Ver Itens do Pedido"><i class="fas fa-box-open"></i> Itens</button>
                        <button class="editar" onclick="abrirModalStatus(${v.codvenda}, '${statusAtual}')" title="Mudar Status"><i class="fas fa-sync-alt"></i> Status</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// 5. FILTRAR TABELA
function filtrar() {
    const termoBusca = document.getElementById("filtro-id").value;
    const status = document.getElementById("filtro-status").value;

    const filtrado = vendas.filter(v => {
        let statusVenda = v.status ? v.status.toLowerCase() : 'pendente';

        return v.codvenda.toString().includes(termoBusca) &&
            (status === "" || statusVenda === status);
    });

    renderizar(filtrado);
}

// 6. MODAL E ATUALIZAÇÃO DE STATUS
function abrirModalStatus(id, statusAtual) {
    document.getElementById("codvenda").value = id;
    document.getElementById("venda-id-display").innerText = id;

    let statusFormatado = statusAtual ? statusAtual.toLowerCase() : 'pendente';
    if (statusFormatado === 'concluído') statusFormatado = 'concluido';

    document.getElementById("status-venda").value = statusFormatado;

    document.getElementById("modal").style.display = "block";
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
} 

async function salvarStatus() {
    const id = document.getElementById("codvenda").value;
    const novoStatus = document.getElementById("status-venda").value;

    try {
        const res = await fetch(`${API}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "minha-chave": API_KEY
            },
            body: JSON.stringify({ status: novoStatus })
        });

        if (!res.ok) {
            throw new Error(`O servidor retornou o erro ${res.status}`);
        }

        fecharModal();
        showToast("Status da venda atualizado com sucesso!", "success");
        carregar(); 

    } catch (error) {
        console.error("Erro ao salvar status:", error);
        showToast("Erro ao salvar o status da venda.", "error");
    }
}

// ============================================================
// NOVO: FUNÇÕES DO MODAL DE DETALHES (ITENS DA VENDA)
// ============================================================
function abrirModalDetalhes(idVenda) {
    const venda = vendas.find(v => v.codvenda === idVenda);
    if (!venda) return;

    document.getElementById("detalhes-id").innerText = idVenda;
    document.getElementById("detalhes-total").innerText = `R$ ${Number(venda.valortotal).toFixed(2).replace('.', ',')}`;

    const containerProdutos = document.getElementById("lista-produtos-comprados");
    containerProdutos.innerHTML = "";

    if (venda.itens && venda.itens.length > 0) {
        venda.itens.forEach(item => {
            
            // VERIFICAÇÃO ROBUSTA DE TAMANHO (Tenta várias possibilidades do banco de dados)
            let tamanhoDoItem = item.tamanho || item.Tamanho || item.tamanhos || item.tam || item.Tamanhos;
            
            // Se o banco de dados mandou nulo ou vazio, coloca 'Único'
            if (!tamanhoDoItem || tamanhoDoItem === "null" || tamanhoDoItem === "undefined" || String(tamanhoDoItem).trim() === "") {
                tamanhoDoItem = 'Único';
            }

            let qtdDoItem = item.quantidade || item.qtd || 1;
            let precoDoItem = item.preco_unitario || item.preco || item.valor || 0;
            let imgDoItem = item.imagem || item.img || '/midias/placeholder-roupa.png';

            containerProdutos.innerHTML += `
                <div class="item-detalhe-admin">
                    <img src="${imgDoItem}" class="item-img-admin" alt="Produto">
                    <div class="item-info-admin">
                        <strong>${item.nome || 'Produto Freese'}</strong>
                        <span>Qtd: ${qtdDoItem} | Tam: <b style="color: #111; font-size: 14px;">${tamanhoDoItem}</b></span>
                    </div>
                    <span class="item-preco-admin">R$ ${Number(precoDoItem).toFixed(2).replace('.', ',')}</span>
                </div>
            `;
        });
    } else {
        containerProdutos.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #888;">
                <i class="fas fa-box-open" style="font-size: 40px; color: #ddd; margin-bottom: 10px;"></i>
                <p>Nenhum detalhe de item encontrado para esta venda.</p>
            </div>
        `;
    }

    document.getElementById("modal-detalhes").style.display = "block";
}

function fecharModalDetalhes() {
    document.getElementById("modal-detalhes").style.display = "none";
}

// Fechar os modais clicando fora deles
window.onclick = function(event) {
    const modalStatus = document.getElementById("modal");
    const modalDetalhes = document.getElementById("modal-detalhes");
    if (event.target === modalStatus) {
        fecharModal();
    }
    if (event.target === modalDetalhes) {
        fecharModalDetalhes();
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
        'error':   { icone: 'fa-times', titulo: 'ERRO', cor: '#ff4757' }, 
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

carregar();
