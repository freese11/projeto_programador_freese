const API_URL = "http://localhost:3000/produtos";
const USUARIOS_URL = "http://localhost:3000/usuarios";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

const listaProdutosGeral = document.getElementById("lista-produtos-geral");
const contadorCarrinho = document.getElementById("contador-carrinho");
const inputBusca = document.getElementById("input-busca");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroMarca = document.getElementById("filtro-marca");
const modal = document.getElementById("modal-login");

let todosProdutos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let tipoLoginEscolhido = "";

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    carregarCatalogo();
    atualizarContador();
    verificarStatusUsuario();
});

async function carregarCatalogo() {
    try {
        const resposta = await fetch(API_URL);
        todosProdutos = await resposta.json();
        renderizarProdutos(todosProdutos);
    } catch (err) {
        listaProdutosGeral.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}

function renderizarProdutos(produtos) {
    if(!listaProdutosGeral) return;
    listaProdutosGeral.innerHTML = "";
    produtos.forEach(p => {
        const div = document.createElement("div");
        div.className = "produto";
        div.innerHTML = `
            <img src="${p.img}" alt="${p.nome}">
            <h3>${p.nome}</h3>
            <p class="preco">R$ ${Number(p.valor).toFixed(2)}</p>
            <button onclick="adicionarCarrinho(${p.codproduto})">ADICIONAR AO CARRINHO</button>
        `;
        listaProdutosGeral.appendChild(div);
    });
}

function filtrarProdutos() {
    const termo = inputBusca.value.toLowerCase();
    const categoria = filtroCategoria.value.toLowerCase();
    const marca = filtroMarca.value.toLowerCase();

    const filtrados = todosProdutos.filter(p => {
        const nome = p.nome.toLowerCase();
        return nome.includes(termo) &&
               (categoria === "todos" || nome.includes(categoria)) &&
               (marca === "todos" || nome.includes(marca));
    });
    renderizarProdutos(filtrados);
}

// Eventos de Filtro
inputBusca.addEventListener("input", filtrarProdutos);
filtroCategoria.addEventListener("change", filtrarProdutos);
filtroMarca.addEventListener("change", filtrarProdutos);

// Funções de Carrinho
function adicionarCarrinho(codproduto) {
    if (!localStorage.getItem("usuarioAtivo")) {
        alert("Acesse sua conta para comprar.");
        modal.style.display = "block";
        return;
    }
    const item = carrinho.find(p => p.codproduto === codproduto);
    item ? item.qtd++ : carrinho.push({ codproduto, qtd: 1 });
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarContador();
    toggleCarrinho(true);
}

function atualizarContador() {
    if(contadorCarrinho) contadorCarrinho.innerText = carrinho.reduce((soma, p) => soma + p.qtd, 0);
}

function toggleCarrinho(abrir = false) {
    const side = document.getElementById("carrinho-lateral");
    const overlay = document.getElementById("carrinho-overlay");
    if(abrir) { side.classList.add("ativo"); overlay.style.display = "block"; renderizarItensCarrinho(); }
    else { side.classList.remove("ativo"); overlay.style.display = "none"; }
}

async function renderizarItensCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const totalElement = document.getElementById("valor-total-carrinho");
    container.innerHTML = "";
    let total = 0;
    carrinho.forEach(item => {
        const p = todosProdutos.find(prod => prod.codproduto === item.codproduto);
        if(p) {
            total += p.valor * item.qtd;
            container.innerHTML += `<div class="item-no-carrinho"><img src="${p.img}"><div><p>${p.nome}</p><p>${item.qtd}x R$ ${p.valor}</p></div></div>`;
        }
    });
    totalElement.innerText = `R$ ${total.toFixed(2)}`;
}

// Login/Status (Copiado da Home para consistência)
function verificarStatusUsuario() {
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const btnLogin = document.getElementById("btn-login-abrir");
    if (usuarioJson && usuarioJson !== "undefined") {
        const usuario = JSON.parse(usuarioJson);
        btnLogin.innerHTML = `<i class="fas fa-user-check"></i> ${usuario.nome.split(' ')[0]} (Sair)`;
        btnLogin.onclick = () => { if(confirm("Sair?")) { localStorage.clear(); location.reload(); }};
    } else {
        btnLogin.onclick = () => { modal.style.display = "block"; voltarSelecao(); };
    }
}

// Funções auxiliares do modal
function configurarLogin(tipo) { tipoLoginEscolhido = tipo; document.getElementById("selecao-tipo").classList.add("hidden"); document.getElementById("form-login").classList.remove("hidden"); }
function configurarRegistro() { document.getElementById("selecao-tipo").classList.add("hidden"); document.getElementById("form-registro").classList.remove("hidden"); }
function voltarSelecao() { document.getElementById("selecao-tipo").classList.remove("hidden"); document.getElementById("form-login").classList.add("hidden"); document.getElementById("form-registro").classList.add("hidden"); }
document.querySelector(".close-modal").onclick = () => modal.style.display = "none";