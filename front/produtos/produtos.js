const API = "https://projeto-programador-freese-backend.onrender.com/produtos";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// Imagem padrão caso o link do produto esteja quebrado
const IMG_FALHA = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%23999'%3ESem Foto%3C/text%3E%3C/svg%3E";

let produtos = [];
let idProdutoParaExcluir = null;

function voltar() {
    window.location.href = "/admin/admin.html";
}

async function carregar() {
    try {
        const res = await fetch(API);
        produtos = await res.json();
        renderizar(produtos);
    } catch (erro) {
        showToast("Erro ao carregar os produtos.", "error");
    }
}

function renderizar(lista) {
    const tabela = document.getElementById("tabela-produtos");
    tabela.innerHTML = "";

    lista.forEach(p => {
        let classeStatus = p.ativoinativo === 'ativo' ? 'status-ativo' : 'status-inativo';
        let imgSegura = p.img || IMG_FALHA;

        tabela.innerHTML += `
            <tr>
                <td><img src="${imgSegura}" onerror="this.onerror=null; this.src='${IMG_FALHA}';" alt="Produto"></td>
                <td style="font-weight: bold;">${p.nome}</td>
                <td>${p.marca}</td>
                <td style="color: var(--premium-red); font-weight: bold;">R$ ${Number(p.valor).toFixed(2).replace('.', ',')}</td>
                <td>${p.estoque} un.</td>
                <td>
                    <span class="${classeStatus}">${p.ativoinativo}</span>
                </td>
                <td>
                    <button class="editar" onclick="editar(${p.codproduto})"><i class="fas fa-pen"></i> Editar</button>
                    <button class="deletar" onclick="abrirModalExcluir(${p.codproduto})"><i class="fas fa-trash"></i> Excluir</button>
                </td>
            </tr>
        `;
    });
}

function filtrar() {
    const nome = document.getElementById("filtro-nome").value.toLowerCase();
    const status = document.getElementById("filtro-status").value;

    const filtrado = produtos.filter(p =>
        p.nome.toLowerCase().includes(nome) &&
        (status === "" || p.ativoinativo === status)
    );

    renderizar(filtrado);
}

// Limpa o formulário para um novo produto
function abrirModalNovo() {
    document.getElementById("modal-titulo").innerText = "Novo Produto";
    document.getElementById("codproduto").value = "";
    document.getElementById("nome").value = "";
    document.getElementById("marca").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("estoque").value = "";
    document.getElementById("tipo").value = "";
    document.getElementById("cor").value = "";
    document.getElementById("tamanho").value = "";
    document.getElementById("img").value = "";
    document.getElementById("ativoinativo").value = "ativo";
    
    document.getElementById("preview").style.display = "none";
    document.getElementById("modal").style.display = "block";
}

function abrirModal() {
    document.getElementById("modal").style.display = "block";
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
}

function previewImagem() {
    const url = document.getElementById("img").value;
    const preview = document.getElementById("preview");
    preview.src = url;
    preview.style.display = url ? "block" : "none";
}

async function salvar() {
    const cod = document.getElementById("codproduto").value;

    const dados = {
        nome: document.getElementById("nome").value,
        marca: document.getElementById("marca").value,
        valor: document.getElementById("valor").value,
        estoque: document.getElementById("estoque").value,
        tipo: document.getElementById("tipo").value,
        cor: document.getElementById("cor").value,
        tamanho: document.getElementById("tamanho").value,
        img: document.getElementById("img").value,
        ativoinativo: document.getElementById("ativoinativo").value
    };

    // Validação básica
    if(!dados.nome || !dados.valor) {
        showToast("Preencha o nome e o preço do produto.", "warning");
        return;
    }

    const metodo = cod ? "PUT" : "POST";
    const url = cod ? `${API}/${cod}` : API;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json",
                "minha-chave": API_KEY
            },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            fecharModal();
            showToast(cod ? "Produto atualizado com sucesso!" : "Novo produto adicionado!", "success");
            carregar();
        } else {
            showToast("Falha ao salvar produto.", "error");
        }
    } catch(err) {
        showToast("Erro de conexão com o servidor.", "error");
    }
}

async function editar(id) {
    try {
        const res = await fetch(`${API}/${id}`);
        const p = await res.json();

        document.getElementById("modal-titulo").innerText = "Editar Produto";
        document.getElementById("codproduto").value = p.codproduto;
        document.getElementById("nome").value = p.nome;
        document.getElementById("marca").value = p.marca;
        document.getElementById("valor").value = p.valor;
        document.getElementById("estoque").value = p.estoque;
        document.getElementById("tipo").value = p.tipo;
        document.getElementById("cor").value = p.cor;
        document.getElementById("tamanho").value = p.tamanho;
        document.getElementById("img").value = p.img;
        document.getElementById("ativoinativo").value = p.ativoinativo;

        previewImagem();
        abrirModal();
    } catch(err) {
        showToast("Erro ao carregar dados do produto.", "error");
    }
}

// ==========================================
// LÓGICA DO NOVO MODAL DE EXCLUIR
// ==========================================
function abrirModalExcluir(id) {
    idProdutoParaExcluir = id;
    document.getElementById("modal-confirmacao-excluir").style.display = "block";
}

function fecharModalExcluir() {
    idProdutoParaExcluir = null;
    document.getElementById("modal-confirmacao-excluir").style.display = "none";
}

async function confirmarExclusao() {
    if (!idProdutoParaExcluir) return;

    try {
        const res = await fetch(`${API}/${idProdutoParaExcluir}`, {
            method: "DELETE",
            headers: { "minha-chave": API_KEY }
        });

        if (res.ok) {
            showToast("Produto excluído com sucesso.", "success");
            fecharModalExcluir();
            carregar();
        } else {
            showToast("Erro ao excluir produto.", "error");
            fecharModalExcluir();
        }
    } catch(err) {
        showToast("Erro de conexão com o servidor.", "error");
        fecharModalExcluir();
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
        'error':   { icone: 'fa-times', titulo: 'ERRO', cor: '#ff4757' }, // Cor ajustada para combinar com os botões do admin
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

// Carrega os dados assim que o script iniciar
carregar();
