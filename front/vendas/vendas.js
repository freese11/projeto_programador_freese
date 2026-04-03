const API = "https://projeto-programador-freese-backend.onrender.com/vendas";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456"; // Coloque a sua senha real aqui!

let vendas = [];
let graficoInstancia = null; // Variável para guardar o gráfico

function voltar() {
    window.location.href = "/admin/admin.html";
}

// 1. CARREGAR VENDAS DO BANCO DE DADOS (CORRIGIDO)
async function carregar() {
    try {
        // Agora estamos enviando a chave secreta no cabeçalho (headers) para o servidor liberar o acesso!
        const res = await fetch(API, {
            method: "GET",
            headers: {
                "minha-chave": API_KEY,
                "Content-Type": "application/json"
            }
        });

        // Verifica se o servidor barrou a entrada (ex: senha errada)
        if (!res.ok) {
            throw new Error(`Servidor bloqueou o acesso. Status: ${res.status}`);
        }

        vendas = await res.json();

        // Garante que o que chegou é realmente uma lista antes de tentar desenhar a tela
        if (Array.isArray(vendas)) {
            atualizarCards(vendas);
            atualizarGrafico(vendas);
            renderizar(vendas);
        } else {
            console.error("O servidor não retornou uma lista válida:", vendas);
        }

    } catch (error) {
        console.error("Erro ao carregar vendas:", error);
        alert("Erro ao carregar as vendas. Verifique se a sua API_KEY está correta no código!");
    }
}

// 2. ATUALIZAR CARTÕES DE RESUMO
function atualizarCards(lista) {
    let total = 0;
    lista.forEach(v => {
        // Soma apenas se não estiver cancelado
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

    // Agrupa as vendas por data
    const vendasPorData = {};

    lista.forEach(v => {
        // Formata a data para pegar apenas o dia (Ex: 02/04/2026)
        let dataFormatada = new Date(v.data).toLocaleDateString('pt-BR');

        if (!vendasPorData[dataFormatada]) {
            vendasPorData[dataFormatada] = 0;
        }

        // Soma o valor total daquele dia (ignorando cancelados se quiser, mas aqui somamos tudo movimentado)
        let status = v.status ? v.status.toLowerCase() : '';
        if (status !== 'cancelado') {
            vendasPorData[dataFormatada] += Number(v.valortotal);
        }
    });

    const labels = Object.keys(vendasPorData);
    const valores = Object.values(vendasPorData);

    // Se já existe um gráfico na tela, apaga para desenhar o novo atualizado
    if (graficoInstancia) {
        graficoInstancia.destroy();
    }

    // Desenha o gráfico com a identidade visual da Freese Store
    graficoInstancia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Faturamento por Dia (R$)',
                data: valores,
                backgroundColor: '#000', // Cor da barra preta elegante
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Esconde a legenda para ficar mais limpo
            }
        }
    });
}

// 4. RENDERIZAR TABELA
function renderizar(lista) {
    const tabela = document.getElementById("tabela-vendas");
    tabela.innerHTML = "";

    lista.forEach(v => {
        // Padroniza o status para letras minúsculas para não dar erro de digitação
        let statusAtual = v.status ? v.status.toLowerCase() : 'pendente';

        // Define a classe CSS baseada no status
        let classeStatus = 'status-pendente';
        let textoStatus = 'Pendente';

        if (statusAtual === 'concluido' || statusAtual === 'concluído') {
            classeStatus = 'status-concluido';
            textoStatus = 'Concluído';
        } else if (statusAtual === 'cancelado') {
            classeStatus = 'status-cancelado';
            textoStatus = 'Cancelado';
        }

        // Formata data e valor
        let dataStr = new Date(v.data).toLocaleDateString('pt-BR');
        let valorStr = Number(v.valortotal).toFixed(2).replace('.', ',');

        tabela.innerHTML += `
            <tr>
                <td><strong>#${v.codvenda}</strong></td>
<td>${v.nome_cliente ? v.nome_cliente : 'Usuário'} #${v.codusuario}</td>
                <td>${dataStr}</td>
                <td><strong>R$ ${valorStr}</strong></td>
                <td>${v.endereco_entrega || 'Não informado'}</td>
                <td><span class="${classeStatus}">${textoStatus}</span></td>
                <td>
                    <button class="editar" onclick="abrirModalStatus(${v.codvenda}, '${statusAtual}')">Mudar Status</button>
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

    // Se o status for nulo ou vazio, define como pendente por padrão
    let statusFormatado = statusAtual ? statusAtual.toLowerCase() : 'pendente';
    // Remove acento do "concluído" para o select funcionar corretamente
    if (statusFormatado === 'concluído') statusFormatado = 'concluido';

    document.getElementById("status-venda").value = statusFormatado;

    document.getElementById("modal").style.display = "block";
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
} async function salvarStatus() {
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
        carregar(); // Recarrega a tabela limpinha

    } catch (error) {
        console.error("Erro ao salvar status:", error);
        alert("Erro ao salvar o status da venda.");
    }
}



carregar();
