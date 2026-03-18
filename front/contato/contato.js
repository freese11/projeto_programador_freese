const API_URL = "https://projeto-programador-freese-backend.onrender.com/produtos";
const USUARIOS_URL = "https://projeto-programador-freese-backend.onrender.com/usuarios";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// Elementos
const listaProdutosDestaque = document.getElementById("lista-produtos");
const contadorCarrinho = document.getElementById("contador-carrinho");
const modal = document.getElementById("modal-login");

let todosProdutos = [];
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let tipoLoginEscolhido = "";

document.addEventListener("DOMContentLoaded", () => {
    atualizarContador();
    // Só carrega produtos se estiver na HOME
    if (listaProdutosDestaque) {
        carregarProdutosHome();
    }
    // O login sempre carrega em qualquer página
    verificarStatusUsuario();
});

// LOGIN STATUS
function verificarStatusUsuario() {
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const btnLogin = document.getElementById("btn-login-abrir");
    if (!btnLogin) return;

    if (usuarioJson && usuarioJson !== "undefined") {
        const usuario = JSON.parse(usuarioJson);
        btnLogin.innerHTML = `<i class="far fa-user"></i> ${usuario.nome.split(' ')[0]} (Sair)`;
        btnLogin.onclick = () => {
            if (confirm("Sair da conta?")) {
                localStorage.clear();
                location.reload();
            }
        };
        // Redireciona ADM
        if (usuario.tipo?.toLowerCase() === "adm" && !window.location.pathname.includes("/admin/")) {
            window.location.href = "/admin/admin.html";
        }
    } else {
        btnLogin.onclick = () => { modal.style.display = "block"; voltarSelecao(); };
    }
}

// FUNÇÕES DO MODAL (Independente de produtos)
function configurarLogin(tipo) {
    tipoLoginEscolhido = tipo;
    document.getElementById("selecao-tipo").classList.add("hidden");
    document.getElementById("form-login").classList.remove("hidden");
}
function configurarRegistro() {
    document.getElementById("selecao-tipo").classList.add("hidden");
    document.getElementById("form-registro").classList.remove("hidden");
}
function voltarSelecao() {
    document.getElementById("selecao-tipo").classList.remove("hidden");
    document.getElementById("form-login").classList.add("hidden");
    document.getElementById("form-registro").classList.add("hidden");
}
if(document.querySelector(".close-modal")) {
    document.querySelector(".close-modal").onclick = () => modal.style.display = "none";
}

// LOGIN E REGISTRO
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
        if (dados.sucesso) {
            localStorage.setItem("usuarioAtivo", JSON.stringify(dados));
            location.reload();
        } else { alert("Erro: " + dados.message); }
    } catch (e) { alert("Erro ao conectar servidor."); }
}

async function registrarCliente(event) {
    event.preventDefault();
    const nome = document.getElementById("reg-nome").value;
    const email = document.getElementById("reg-email").value;
    const numero = document.getElementById("reg-telefone").value;
    const senha = document.getElementById("reg-senha").value;
    try {
        const response = await fetch(USUARIOS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "minha-chave": API_KEY },
            body: JSON.stringify({ nome, email, numero, senha, perfil: "cliente" })
        });
        if (response.ok) { alert("Conta criada!"); voltarSelecao(); }
    } catch (e) { alert("Erro ao cadastrar."); }
}

// CARRINHO (Funções básicas para evitar erros)
function atualizarContador() {
    if(contadorCarrinho) contadorCarrinho.innerText = carrinho.reduce((soma, p) => soma + p.qtd, 0);
}
function toggleCarrinho() {
    const side = document.getElementById("carrinho-lateral");
    if(side) side.classList.toggle("ativo");
}