const API_URL = "http://localhost:3000/produtos";
const USUARIOS_URL = "http://localhost:3000/usuarios";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// Elementos
const listaProdutosDestaque = document.getElementById("lista-produtos"); // ID da Home
const contadorCarrinho = document.getElementById("contador-carrinho");
const modal = document.getElementById("modal-login");

let todosProdutos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let tipoLoginEscolhido = "";

// ===============================
// 1️⃣ INICIALIZAÇÃO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    atualizarContador();
    carregarProdutosHome();
    verificarStatusUsuario();
});

// ===============================
// 2️⃣ CARREGAR PRODUTOS (HOME - FILTRO BMW)
// ===============================
async function carregarProdutosHome() {
    if (!listaProdutosDestaque) return;
    try {
        const resposta = await fetch(API_URL);
        todosProdutos = await resposta.json();
        
        // Filtra para mostrar apenas BMW na Home como destaque
        const destaques = todosProdutos.filter(p => p.nome.toLowerCase().includes("bmw"));
        
        listaProdutosDestaque.innerHTML = "";
        destaques.forEach(produto => {
            const div = document.createElement("div");
            div.className = "produto";
            div.innerHTML = `
                <img src="${produto.img}" alt="${produto.nome}">
                <h3>${produto.nome}</h3>
                <p class="preco">R$ ${Number(produto.valor).toFixed(2)}</p>
                <button onclick="adicionarCarrinho(${produto.codproduto})">ADICIONAR AO CARRINHO</button>
            `;
            listaProdutosDestaque.appendChild(div);
        });
    } catch (err) {
        console.error("Erro ao carregar produtos", err);
    }
}

// ===============================
// 3️⃣ STATUS DO USUÁRIO & MODAL
// ===============================
function verificarStatusUsuario() {
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const btnLogin = document.getElementById("btn-login-abrir");

    if (!btnLogin) return;

    if (usuarioJson && usuarioJson !== "undefined") {
        const usuario = JSON.parse(usuarioJson);
        btnLogin.innerHTML = ` ${usuario.nome.split(' ')[0]} (Sair)`;
        btnLogin.onclick = () => {
            if (confirm("Deseja sair?")) {
                localStorage.removeItem("usuarioAtivo");
                localStorage.removeItem("carrinho");
                location.reload();
            }
        };

        if (usuario.tipo && usuario.tipo.toLowerCase() === "adm") {
            window.location.href = "/front/admin/admin.html";
        }
    } else {
        btnLogin.innerText = "Login";
        btnLogin.onclick = () => {
            if (modal) {
                modal.style.display = "block";
                voltarSelecao();
            }
        };
    }
}

// ===============================
// 4️⃣ FUNÇÕES DO MODAL (ESTILO CATÁLOGO)
// ===============================
function configurarLogin(tipo) {
    tipoLoginEscolhido = tipo;
    document.getElementById("selecao-tipo").classList.add("hidden");
    document.getElementById("form-login").classList.remove("hidden");
    document.getElementById("modal-titulo").innerText = tipo === "admin" ? "Login Admin" : "Login Cliente";
}

function configurarRegistro() {
    document.getElementById("selecao-tipo").classList.add("hidden");
    document.getElementById("form-registro").classList.remove("hidden");
    document.getElementById("modal-titulo").innerText = "Criar Nova Conta";
}

function voltarSelecao() {
    document.getElementById("selecao-tipo").classList.remove("hidden");
    document.getElementById("form-login").classList.add("hidden");
    document.getElementById("form-registro").classList.add("hidden");
    document.getElementById("modal-titulo").innerText = "Acessar Conta";
}

// Fecha no X
const closeBtn = document.querySelector(".close-modal");
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";

// ===============================
// 5️⃣ LÓGICA DE LOGIN & REGISTRO (COPIADA DO SEU EXEMPLO)
// ===============================
async function efetuarLogin(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json", "minha-chave": API_KEY },
            body: JSON.stringify({ email, senha, tipoLoginEscolhido })
        });
        const dados = await response.json();
        if (response.ok && dados.sucesso) {
            localStorage.setItem("usuarioAtivo", JSON.stringify(dados));
            location.reload();
        } else {
            alert(dados.message || "Erro no login");
        }
    } catch (erro) { alert("Erro de conexão"); }
}

// ===============================
// 6️⃣ CARRINHO (MANTENDO SUA LÓGICA)
// ===============================
function adicionarCarrinho(codproduto) {
    if (!localStorage.getItem("usuarioAtivo")) {
        alert("Acesse sua conta primeiro.");
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
    if (contadorCarrinho) contadorCarrinho.innerText = carrinho.reduce((soma, p) => soma + p.qtd, 0);
}

function toggleCarrinho(abrir = false) {
    const side = document.getElementById("carrinho-lateral");
    const overlay = document.getElementById("carrinho-overlay");
    if (!side) return;
    if (abrir) { side.classList.add("ativo"); overlay.style.display = "block"; renderizarItensCarrinho(); }
    else { side.classList.remove("ativo"); overlay.style.display = "none"; }
}

async function renderizarItensCarrinho() {
    const container = document.getElementById("itens-carrinho");
    if (!container) return;
    container.innerHTML = "";
    let totalGeral = 0;
    try {
        const resposta = await fetch(API_URL);
        const produtosBD = await resposta.json();
        carrinho.forEach(item => {
            const p = produtosBD.find(prod => prod.codproduto === item.codproduto);
            if (p) {
                totalGeral += p.valor * item.qtd;
                container.innerHTML += `<div class="item-no-carrinho"><img src="${p.img}"><div><p><strong>${p.nome}</strong></p><p>${item.qtd}x R$ ${p.valor}</p></div></div>`;
            }
        });
        document.getElementById("valor-total-carrinho").innerText = `R$ ${totalGeral.toFixed(2)}`;
    } catch (e) { console.error(e); }
}