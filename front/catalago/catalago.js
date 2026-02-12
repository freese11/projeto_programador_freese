const API_URL = "http://localhost:3000/produtos";
const API_KEY = "SUA_CHAVE_API_AQUI";

const listaProdutosGeral = document.getElementById("lista-produtos-geral");
const contadorCarrinho = document.getElementById("contador-carrinho");
const inputBusca = document.getElementById("input-busca");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroMarca = document.getElementById("filtro-marca");
const modal = document.getElementById("modal-login");

let todosProdutos = []; 
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

// --- INICIALIZAÇÃO ---
atualizarContador();
carregarCatalago();

async function carregarCatalago() {
    try {
        const resposta = await fetch(API_URL, { headers: { "minha-chave": API_KEY } });
        todosProdutos = await resposta.json();
        renderizarProdutos(todosProdutos);
    } catch (err) {
        console.error("Erro ao carregar catálogo", err);
        listaProdutosGeral.innerHTML = "<p>Erro ao carregar produtos. Verifique se o servidor está rodando.</p>";
    }
}

function renderizarProdutos(produtos) {
    listaProdutosGeral.innerHTML = "";
    
    produtos.forEach(produto => {
        const div = document.createElement("div");
        div.className = "produto";
        div.innerHTML = `
            <img src="${produto.img}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
            <h3>${produto.nome}</h3>
            <p class="preco">R$ ${Number(produto.valor).toFixed(2)}</p>
            <button onclick="adicionarCarrinho(${produto.codproduto})">ADICIONAR AO CARRINHO</button>
        `;
        listaProdutosGeral.appendChild(div);
    });

    if (produtos.length === 0) {
        listaProdutosGeral.innerHTML = "<p style='grid-column: 1/-1;'>Nenhum produto encontrado para os filtros selecionados.</p>";
    }
}

// --- LÓGICA DE FILTRAGEM COMBINADA ---
function filtrarProdutos() {
    const termo = inputBusca.value.toLowerCase();
    const categoria = filtroCategoria.value.toLowerCase();
    const marca = filtroMarca.value.toLowerCase();

    const produtosFiltrados = todosProdutos.filter(produto => {
        const nomeProduto = produto.nome.toLowerCase();
        
        // Regra 1: Nome bate com a busca?
        const bateBusca = nomeProduto.includes(termo);
        
        // Regra 2: Categoria bate? (ex: "tenis" está no nome?)
        const bateCategoria = categoria === "todos" || nomeProduto.includes(categoria);
        
        // Regra 3: Marca bate? (ex: "nike" está no nome?)
        const bateMarca = marca === "todos" || nomeProduto.includes(marca);

        return bateBusca && bateCategoria && bateMarca;
    });

    renderizarProdutos(produtosFiltrados);
}

// Ouvintes de eventos para filtros
inputBusca.addEventListener("input", filtrarProdutos);
filtroCategoria.addEventListener("change", filtrarProdutos);
filtroMarca.addEventListener("change", filtrarProdutos);

// --- CARRINHO ---
function adicionarCarrinho(codproduto) {
    const item = carrinho.find(p => p.codproduto === codproduto);
    if (item) {
        item.qtd++;
    } else {
        carrinho.push({ codproduto, qtd: 1 });
    }
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarContador();
    alert("Produto adicionado ao carrinho!");
}

function atualizarContador() {
    contadorCarrinho.innerText = carrinho.reduce((soma, p) => soma + p.qtd, 0);
}

// --- MODAL & LOGIN ---
document.getElementById("btn-login-abrir").onclick = () => {
    modal.style.display = "block";
    voltarSelecao();
};

document.querySelector(".close-modal").onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

function configurarLogin(tipo) {
    window.tipoLoginEscolhido = tipo;
    document.getElementById("selecao-tipo").classList.add("hidden");
    document.getElementById("form-login").classList.remove("hidden");
    document.getElementById("modal-titulo").innerText = tipo === 'admin' ? 'Login Admin' : 'Login Cliente';
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

// 1. Abrir/Fechar Carrinho
function toggleCarrinho() {
    document.getElementById("carrinho-lateral").classList.toggle("ativo");
    const overlay = document.getElementById("carrinho-overlay");
    overlay.style.display = overlay.style.display === "block" ? "none" : "block";
    renderizarItensCarrinho();
}

// 2. Mudar o clique do ícone no Header
document.querySelector(".carrinho").onclick = toggleCarrinho;

// 3. Renderizar itens dentro do painel
async function renderizarItensCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const totalElement = document.getElementById("valor-total-carrinho");
    container.innerHTML = "";
    let totalGeral = 0;

    // Pegamos todos os produtos da API para saber o preço e nome
    const resposta = await fetch(API_URL);
    const produtosBD = await resposta.json();

    carrinho.forEach(itemNoCarrinho => {
        const produto = produtosBD.find(p => p.codproduto === itemNoCarrinho.codproduto);
        if (produto) {
            totalGeral += produto.valor * itemNoCarrinho.qtd;
            container.innerHTML += `
                <div class="item-no-carrinho">
                    <img src="${produto.img}">
                    <div>
                        <p><strong>${produto.nome}</strong></p>
                        <p>${itemNoCarrinho.qtd}x R$ ${produto.valor}</p>
                    </div>
                </div>
            `;
        }
    });

    totalElement.innerText = `R$ ${totalGeral.toFixed(2)}`;
}

// 4. Finalizar Compra (Chama a sua rota de vendas)
async function finalizarCompra() {
    const usuario = JSON.parse(localStorage.getItem("usuarioAtivo"));
    
    if (!usuario) {
        alert("Faça login para finalizar a compra!");
        toggleCarrinho(); // Fecha carrinho
        modal.style.display = "block"; // Abre login
        return;
    }

    if (carrinho.length === 0) return alert("Carrinho vazio!");

    // Aqui você faz o fetch para a sua vendasDB.js
    alert("Processando sua venda...");
    // ... lógica do fetch aqui ...
}