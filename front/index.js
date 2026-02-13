const USUARIOS_URL = "http://localhost:3000/usuarios";
const API_URL = "http://localhost:3000/produtos";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let tipoLoginEscolhido = ""; // Variável global para armazenar o tipo de login selecionado (admin ou cliente)

const listaProdutos = document.getElementById("lista-produtos");
const contadorCarrinho = document.getElementById("contador-carrinho");
const modal = document.getElementById("modal-login");

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
window.tipoLoginEscolhido = "";

// Inicialização
carregarProdutos();
atualizarContador();
verificarStatusUsuario();

// --- 1. FUNÇÕES DE INTERFACE DO MODAL (AS QUE ESTAVAM DANDO ERRO) ---

function configurarLogin(tipo) {
    console.log("Tipo de login escolhido:", tipo);
    tipoLoginEscolhido = tipo;
    document.getElementById("selecao-tipo").classList.add("hidden");
    document.getElementById("form-login").classList.remove("hidden");
    document.getElementById("modal-titulo").innerText = tipo === 'admin' ? 'Login Admin' : 'Login Cliente';
}

function configurarRegistro() {
    document.getElementById("selecao-tipo").classList.add("hidden");
    document.getElementById("form-registro").classList.remove("hidden");
    document.getElementById("modal-titulo").innerText = 'Criar Nova Conta';
}

function voltarSelecao() {
    document.getElementById("selecao-tipo").classList.remove("hidden");
    document.getElementById("form-login").classList.add("hidden");
    document.getElementById("form-registro").classList.add("hidden");
    document.getElementById("modal-titulo").innerText = 'Acessar Conta';
}

// --- 2. LÓGICA DE USUÁRIO E LOGIN ---
function verificarStatusUsuario() {
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const btnLogin = document.getElementById("btn-login-abrir");

    if (usuarioJson && usuarioJson !== "undefined") {
        const usuario = JSON.parse(usuarioJson);

        // Atualiza o texto na hora
        btnLogin.innerHTML = `👤 ${usuario.nome.split(' ')[0]} (Sair)`;

        // Muda o que o botão faz: agora ele desloga em vez de abrir modal
        btnLogin.onclick = () => {
            if (confirm("Deseja sair da conta?")) {
                localStorage.removeItem("usuarioAtivo");
                localStorage.removeItem("carrinho");
                location.reload();
            }
        };
    } else {
        // Estado deslogado
        btnLogin.innerText = "Login";
        btnLogin.onclick = () => {
            modal.style.display = "block";
            voltarSelecao();
        };
    }
}async function efetuarLogin(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    

    try {
        console.log("antes do fetch");
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "minha-chave": API_KEY // <--- A chave de acesso que seu servidor exige
            },
            body: JSON.stringify({ email, senha,tipoLoginEscolhido })
        });

        const dados = await response.json();

        if (response.ok && dados.sucesso) {
            // 1. Salva os dados no navegador
            localStorage.setItem("usuarioAtivo", JSON.stringify(dados));

            // 2. VERIFICAÇÃO DE ADMIN: Redireciona se o perfil for 'admin'
            if (dados.perfil === 'admin') {
                alert(`Olá, Admin ${dados.nome}! Acessando painel...`);
                window.location.href = "/front/admin/admin.html"; 
                return;
            }

            // 3. SE FOR CLIENTE: Segue na loja
            verificarStatusUsuario();
            modal.style.display = "none";

            const pendente = sessionStorage.getItem("produtoPendente");
            if (pendente) {
                executarAdicaoCarrinho(parseInt(pendente));
                sessionStorage.removeItem("produtoPendente");
            }
            alert(`Bem-vindo, ${dados.nome}!`);

        } else {
            // Se o servidor retornar 401, ele cai aqui
            alert(dados.message || "Acesso negado: Credenciais inválidas ou sem permissão.");
        }
    } catch (err) {
        console.error("Erro no Login:", err);
        alert("Erro ao conectar ao servidor.",err.message);
    }
}
// --- 3. LÓGICA DO CARRINHO ---

function adicionarCarrinho(codproduto) {
    const usuario = localStorage.getItem("usuarioAtivo");

    if (!usuario) {
        sessionStorage.setItem("produtoPendente", codproduto);
        alert("Acesse sua conta para adicionar ao carrinho.");
        modal.style.display = "block";
        voltarSelecao(); // Agora essa função existe!
        return;
    }
    executarAdicaoCarrinho(codproduto);
}

function executarAdicaoCarrinho(codproduto) {
    const item = carrinho.find(p => p.codproduto === codproduto);
    item ? item.qtd++ : carrinho.push({ codproduto, qtd: 1 });
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarContador();
    toggleCarrinho(true);
}

// --- RESTO DAS FUNÇÕES SUPORTE ---

function atualizarContador() {
    contadorCarrinho.innerText = carrinho.reduce((soma, p) => soma + p.qtd, 0);
}

function toggleCarrinho(abrir = false) {
    const side = document.getElementById("carrinho-lateral");
    const overlay = document.getElementById("carrinho-overlay");
    if (abrir) { side.classList.add("ativo"); overlay.style.display = "block"; }
    else { side.classList.toggle("ativo"); overlay.style.display = side.classList.contains("ativo") ? "block" : "none"; }
    if (side.classList.contains("ativo")) renderizarItensCarrinho();
}

async function renderizarItensCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const totalElement = document.getElementById("valor-total-carrinho");
    container.innerHTML = "";
    let totalGeral = 0;
    try {
        const resposta = await fetch(API_URL);
        const produtosBD = await resposta.json();
        carrinho.forEach(item => {
            const p = produtosBD.find(prod => prod.codproduto === item.codproduto);
            if (p) {
                totalGeral += p.valor * item.qtd;
                container.innerHTML += `<div class="item-no-carrinho"><img src="${p.img}"><div><p><strong>${p.nome}</strong></p><p>${item.qtd}x R$ ${Number(p.valor).toFixed(2)}</p></div></div>`;
            }
        });
        totalElement.innerText = `R$ ${totalGeral.toFixed(2)}`;
    } catch (e) { console.error(e); }
}
async function carregarProdutos() {
    try {
        const res = await fetch(API_URL);
        const produtos = await res.json();

        listaProdutos.innerHTML = "";

        // Filtra apenas Puma (independente de maiúscula/minúscula)
        const produtosPuma = produtos.filter(p =>
            p.nome.toLowerCase().includes("puma")
        );

        produtosPuma.forEach(produto => {
            const div = document.createElement("div");
            div.className = "produto";
            div.innerHTML = `
                <img src="${produto.img}" alt="${produto.nome}">
                <h3>${produto.nome}</h3>
                <p class="preco">R$ ${Number(produto.valor).toFixed(2)}</p>
                <button onclick="adicionarCarrinho(${produto.codproduto})">ADICIONAR AO CARRINHO</button>
            `;
            listaProdutos.appendChild(div);
        });
    } catch (err) {
        console.error("Erro ao carregar:", err);
    }
}async function registrarCliente(event) {
    event.preventDefault();
    const nome = document.getElementById("reg-nome").value;
    const email = document.getElementById("reg-email").value;
    const numero = document.getElementById("reg-telefone").value;
    const senha = document.getElementById("reg-senha").value;

    try {
        const response = await fetch(USUARIOS_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "minha-chave": API_KEY // <--- Enviando a chave no cadastro também
            },
            body: JSON.stringify({ nome, email, numero, senha, perfil: 'cliente' })
        });

        const resultado = await response.json();

        if (response.ok) {
            // Como seu backend dá 'RETURNING *', aproveitamos os dados para logar
            localStorage.setItem("usuarioAtivo", JSON.stringify({
                sucesso: true,
                nome: resultado.nome,
                perfil: resultado.perfil
            }));

            verificarStatusUsuario();
            modal.style.display = "none";
            alert("Conta criada com sucesso! Você já está logado.");
        } else {
            alert("Erro ao cadastrar: " + (resultado.error || "Acesso Negado (401)"));
        }
    } catch (err) {
        alert("Erro de conexão com o servidor.");
    }
}
// Fechar modal no X
document.querySelector(".close-modal").onclick = () => modal.style.display = "none";