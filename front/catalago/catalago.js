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

// ===============================
// 1️⃣ INICIALIZAÇÃO
// ===============================
atualizarContador();
carregarCatalogo();
verificarStatusUsuario();

// ===============================
// 2️⃣ CARREGAR PRODUTOS
// ===============================
async function carregarCatalogo() {
    try {
        const resposta = await fetch(API_URL);
        todosProdutos = await resposta.json();
        renderizarProdutos(todosProdutos);
    } catch (err) {
        console.error("Erro ao carregar catálogo", err);
        listaProdutosGeral.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}

// ===============================
// 3️⃣ STATUS DO USUÁRIO
// ===============================
function verificarStatusUsuario() {
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const btnLogin = document.getElementById("btn-login-abrir");

    if (usuarioJson && usuarioJson !== "undefined") {
        const usuario = JSON.parse(usuarioJson);

        btnLogin.innerHTML = ` ${usuario.nome.split(' ')[0]} (Sair)`;

        btnLogin.onclick = () => {
            if (confirm("Deseja sair da conta?")) {
                localStorage.removeItem("usuarioAtivo");
                localStorage.removeItem("carrinho");
                location.reload();
            }
        };

        // 🔥 Se for admin redireciona
        if (usuario.tipo && usuario.tipo.toLowerCase() === "adm") {
            window.location.href = "/front/admin/admin.html";
        }

    } else {
        btnLogin.innerText = "Login";
        btnLogin.onclick = () => {
            modal.style.display = "block";
            voltarSelecao();
        };
    }
}

// ===============================
// 4️⃣ LOGIN
// ===============================
async function efetuarLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "minha-chave": API_KEY
            },
            body: JSON.stringify({
                email,
                senha,
                tipoLoginEscolhido
            })
        });

        const dados = await response.json();

        if (response.ok && dados.sucesso) {

            localStorage.setItem("usuarioAtivo", JSON.stringify(dados));

            // 🔥 Redireciona admin
            if (dados.tipo && dados.tipo.toLowerCase() === "adm") {
                window.location.href = "/front/admin/admin.html";
                return;
            }

            verificarStatusUsuario();
            modal.style.display = "none";

            // Produto pendente
            const pendente = sessionStorage.getItem("produtoPendente");
            if (pendente) {
                executarAdicaoCarrinho(parseInt(pendente));
                sessionStorage.removeItem("produtoPendente");
            }

            alert(`Bem-vindo, ${dados.nome}!`);

        } else {
            alert(dados.message || "Acesso negado.");
        }

    } catch (erro) {
        console.error("Erro no login:", erro);
        alert("Erro ao conectar ao servidor.");
    }
}

// ===============================
// 5️⃣ REGISTRO
// ===============================
async function registrarCliente(event) {
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
                "minha-chave": API_KEY
            },
            body: JSON.stringify({
                nome,
                email,
                numero,
                senha,
                perfil: "cliente"
            })
        });

        const resultado = await response.json();

        if (response.ok) {

            localStorage.setItem("usuarioAtivo", JSON.stringify({
                sucesso: true,
                nome: resultado.nome,
                tipo: resultado.perfil
            }));

            verificarStatusUsuario();
            modal.style.display = "none";
            alert("Conta criada com sucesso!");

        } else {
            alert("Erro ao cadastrar.");
        }

    } catch (err) {
        alert("Erro de conexão com o servidor.");
    }
}

// ===============================
// 6️⃣ CARRINHO
// ===============================
function adicionarCarrinho(codproduto) {
    const usuario = localStorage.getItem("usuarioAtivo");

    if (!usuario) {
        sessionStorage.setItem("produtoPendente", codproduto);
        alert("Acesse sua conta para adicionar ao carrinho.");
        modal.style.display = "block";
        voltarSelecao();
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

function atualizarContador() {
    contadorCarrinho.innerText = carrinho.reduce((soma, p) => soma + p.qtd, 0);
}

function toggleCarrinho(abrir = false) {
    const side = document.getElementById("carrinho-lateral");
    const overlay = document.getElementById("carrinho-overlay");

    if (abrir) {
        side.classList.add("ativo");
        overlay.style.display = "block";
    } else {
        side.classList.toggle("ativo");
        overlay.style.display = side.classList.contains("ativo") ? "block" : "none";
    }

    if (side.classList.contains("ativo")) renderizarItensCarrinho();
}

document.querySelector(".carrinho").onclick = () => toggleCarrinho();

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

                container.innerHTML += `
                    <div class="item-no-carrinho">
                        <img src="${p.img}">
                        <div>
                            <p><strong>${p.nome}</strong></p>
                            <p>${item.qtd}x R$ ${Number(p.valor).toFixed(2)}</p>
                        </div>
                    </div>`;
            }
        });

        totalElement.innerText = `R$ ${totalGeral.toFixed(2)}`;
    } catch (e) {
        console.error(e);
    }
}

// ===============================
// 7️⃣ FILTROS
// ===============================
function renderizarProdutos(produtos) {
    listaProdutosGeral.innerHTML = "";

    produtos.forEach(produto => {
        const div = document.createElement("div");
        div.className = "produto";

        div.innerHTML = `
            <img src="${produto.img}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <p class="preco">R$ ${Number(produto.valor).toFixed(2)}</p>
            <button onclick="adicionarCarrinho(${produto.codproduto})">
                ADICIONAR AO CARRINHO
            </button>
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

inputBusca.addEventListener("input", filtrarProdutos);
filtroCategoria.addEventListener("change", filtrarProdutos);
filtroMarca.addEventListener("change", filtrarProdutos);

// ===============================
// 8️⃣ MODAL
// ===============================
function configurarLogin(tipo) {
    tipoLoginEscolhido = tipo;

    document.getElementById("selecao-tipo").classList.add("hidden");
    document.getElementById("form-login").classList.remove("hidden");
    document.getElementById("modal-titulo").innerText =
        tipo === "admin" ? "Login Admin" : "Login Cliente";
}

function configurarRegistro() {
    document.getElementById("selecao-tipo").classList.add("hidden");
    document.getElementById("form-login").classList.add("hidden");
    document.getElementById("form-registro").classList.remove("hidden");
    document.getElementById("modal-titulo").innerText = "Criar Nova Conta";
}

function voltarSelecao() {
    document.getElementById("selecao-tipo").classList.remove("hidden");
    document.getElementById("form-login").classList.add("hidden");
    document.getElementById("form-registro").classList.add("hidden");
    document.getElementById("modal-titulo").innerText = "Acessar Conta";
}

document.querySelector(".close-modal").onclick =
    () => modal.style.display = "none";