const API = "https://projeto-programador-freese-backend.onrender.com/produtos";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let produtos = [];

function voltar() {
    window.location.href = "/front/admin/admin.html";
}

async function carregar() {
    const res = await fetch(API);
    produtos = await res.json();
    renderizar(produtos);
}

function renderizar(lista) {
    const tabela = document.getElementById("tabela-produtos");
    tabela.innerHTML = "";

    lista.forEach(p => {
        tabela.innerHTML += `
            <tr>
                <td><img src="${p.img}" alt=""></td>
                <td>${p.nome}</td>
                <td>${p.marca}</td>
                <td>R$ ${Number(p.valor).toFixed(2)}</td>
                <td>${p.estoque}</td>
                <td class="${p.ativoinativo === 'ativo' ? 'status-ativo' : 'status-inativo'}">
                    ${p.ativoinativo}
                </td>
                <td>
                    <button class="editar" onclick="editar(${p.codproduto})">Editar</button>
                    <button class="deletar" onclick="deletar(${p.codproduto})">Excluir</button>
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

function abrirModal() {
    document.getElementById("modal").style.display = "block";
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
}

function previewImagem() {
    const url = img.value;
    const preview = document.getElementById("preview");
    preview.src = url;
    preview.style.display = url ? "block" : "none";
}

async function salvar() {
    const cod = codproduto.value;

    const dados = {
        nome: nome.value,
        marca: marca.value,
        valor: valor.value,
        estoque: estoque.value,
        tipo: tipo.value,
        cor: cor.value,
        tamanho: tamanho.value,
        img: img.value,
        ativoinativo: ativoinativo.value
    };

    const metodo = cod ? "PUT" : "POST";
    const url = cod ? `${API}/${cod}` : API;

    await fetch(url, {
        method: metodo,
        headers: {
            "Content-Type": "application/json",
            "minha-chave": API_KEY
        },
        body: JSON.stringify(dados)
    });

    fecharModal();
    carregar();
}

async function editar(id) {
    const res = await fetch(`${API}/${id}`);
    const p = await res.json();

    codproduto.value = p.codproduto;
    nome.value = p.nome;
    marca.value = p.marca;
    valor.value = p.valor;
    estoque.value = p.estoque;
    tipo.value = p.tipo;
    cor.value = p.cor;
    tamanho.value = p.tamanho;
    img.value = p.img;
    ativoinativo.value = p.ativoinativo;

    previewImagem();
    abrirModal();
}

async function deletar(id) {
    if (!confirm("Deseja excluir este produto?")) return;

    await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { "minha-chave": API_KEY }
    });

    carregar();
}

carregar();
