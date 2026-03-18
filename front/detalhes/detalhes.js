const API_URL = "https://projeto-programador-freese-backend.onrender.com/produtos";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";
const LOGIN_URL = "https://projeto-programador-freese-backend.onrender.com/login";

let todosProdutos = [];
let produtoAtual = null;
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let tipoLoginEscolhido = "";

const contadorCarrinho = document.getElementById("contador-carrinho");
const modal = document.getElementById("modal-login");

document.addEventListener("DOMContentLoaded", () => {
    carregarProduto();
    atualizarContador();
    verificarStatusUsuario();
});

async function carregarProduto() {
    const params = new URLSearchParams(window.location.search);
    const idProduto = params.get('id');

    if (!idProduto) {
        document.getElementById("produto-wrapper").innerHTML = "<h2>Produto não encontrado.</h2>";
        return;
    }

    try {
        const resposta = await fetch(API_URL);
        todosProdutos = await resposta.json();
        
        produtoAtual = todosProdutos.find(p => p.codproduto == idProduto);
        
        if (produtoAtual) {
            renderizarDetalhes(produtoAtual);
        } else {
            document.getElementById("produto-wrapper").innerHTML = "<h2>Produto não encontrado.</h2>";
        }
    } catch (err) {
        document.getElementById("produto-wrapper").innerHTML = "<h2>Erro ao carregar o servidor.</h2>";
    }
}

function renderizarDetalhes(produto) {
    const wrapper = document.getElementById("produto-wrapper");
    wrapper.innerHTML = `
        <div class="produto-imagem">
            <img src="${produto.img}" alt="${produto.nome}">
        </div>
        <div class="produto-info">
            <span class="selo-marca">FREESE STORE</span>
            <h1>${produto.nome}</h1>
            <p class="preco-detalhe">R$ ${Number(produto.valor).toFixed(2)}</p>
            <p class="descricao">Produto original de alta qualidade. Adicione estilo e conforto ao seu guarda-roupa com as melhores peças do mercado.</p>
            
            <div class="seletor-tamanho">
                <label>Selecione o Tamanho:</label>
                <select id="tamanho-escolhido">
                    <option value="P">Tamanho P</option>
                    <option value="M">Tamanho M</option>
                    <option value="G">Tamanho G</option>
                    <option value="GG">Tamanho GG</option>
                </select>
            </div>
            
            <button class="btn-adicionar-carrinho" onclick="adicionarAoCarrinhoDetalhes()">ADICIONAR AO CARRINHO</button>
        </div>
    `;
}

function adicionarAoCarrinhoDetalhes() {
    if (!localStorage.getItem("usuarioAtivo")) {
        alert("Acesse sua conta para comprar.");
        modal.style.display = "block";
        voltarSelecao();
        return;
    }

    const tamanhoEscolhido = document.getElementById("tamanho-escolhido").value;
    
    const itemExistente = carrinho.find(p => p.codproduto === produtoAtual.codproduto && p.tamanho === tamanhoEscolhido);
    
    if (itemExistente) {
        itemExistente.qtd++;
    } else {
        carrinho.push({ codproduto: produtoAtual.codproduto, tamanho: tamanhoEscolhido, qtd: 1 });
    }

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
    if(abrir) { 
        side.classList.add("ativo"); 
        overlay.style.display = "block"; 
        renderizarItensCarrinho(); 
    } else { 
        side.classList.remove("ativo"); 
        overlay.style.display = "none"; 
    }
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
            container.innerHTML += `
                <div class="item-no-carrinho">
                    <img src="${p.img}">
                    <div>
                        <p style="font-weight: bold; font-size: 14px;">${p.nome}</p>
                        <p style="font-size: 12px; color: #666;">Tam: ${item.tamanho || 'Único'} | Qtd: ${item.qtd}</p>
                        <p style="font-weight: bold; color: var(--premium-red);">R$ ${(p.valor * item.qtd).toFixed(2)}</p>
                    </div>
                </div>`;
        }
    });
    totalElement.innerText = `R$ ${total.toFixed(2)}`;
}

// 👇 AQUI ESTÁ A CORREÇÃO DO REDIRECIONAMENTO DO ADM 👇
function verificarStatusUsuario() {
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const btnLogin = document.getElementById("btn-login-abrir");
    if (usuarioJson && usuarioJson !== "undefined") {
        const usuario = JSON.parse(usuarioJson);
        btnLogin.innerHTML = `<i class="fas fa-user-check"></i> ${usuario.nome.split(' ')[0]} (Sair)`;
        btnLogin.onclick = () => { if(confirm("Deseja sair da sua conta?")) { localStorage.removeItem("usuarioAtivo"); location.reload(); }};
        
        // CORREÇÃO: Se for administrador, manda pro painel!
        if (usuario.tipo && (usuario.tipo.toLowerCase() === "adm" || usuario.tipo.toLowerCase() === "admin")) {
            window.location.href = "/admin/admin.html";
        }
    } else {
        btnLogin.onclick = () => { modal.style.display = "block"; voltarSelecao(); };
    }
}

function configurarLogin(tipo) { tipoLoginEscolhido = tipo; document.getElementById("selecao-tipo").classList.add("hidden"); document.getElementById("form-login").classList.remove("hidden"); }
function configurarRegistro() { document.getElementById("selecao-tipo").classList.add("hidden"); document.getElementById("form-registro").classList.remove("hidden"); }
function voltarSelecao() { document.getElementById("selecao-tipo").classList.remove("hidden"); document.getElementById("form-login").classList.add("hidden"); document.getElementById("form-registro").classList.add("hidden"); }
document.querySelector(".close-modal").onclick = () => modal.style.display = "none";

async function efetuarLogin(event) {
    event.preventDefault(); 
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    try {
        const resposta = await fetch(LOGIN_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "minha-chave": API_KEY 
            },
            body: JSON.stringify({ 
                email: email, 
                senha: senha,
                tipoLoginEscolhido: tipoLoginEscolhido 
            })
        });

        if (resposta.ok) {
            const dados = await resposta.json();
            localStorage.setItem("usuarioAtivo", JSON.stringify(dados));
            alert(`Bem-vindo(a) de volta, ${dados.nome}!`);
            modal.style.display = "none";
            location.reload(); // Vai recarregar a tela e acionar a verificação que manda pro ADM
        } else {
            alert("E-mail ou senha incorretos! Verifique também se escolheu a opção correta (Cliente ou Admin).");
        }
    } catch (erro) {
        console.error("Erro no login:", erro);
        alert("Erro ao conectar com o servidor.");
    }
}
