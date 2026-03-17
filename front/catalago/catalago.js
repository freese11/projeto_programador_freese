const API_URL = "https://projeto-programador-freese-backend.onrender.com/produtos";
const USUARIOS_URL = "https://projeto-programador-freese-backend.onrender.com/usuarios";
const LOGIN_URL = "https://projeto-programador-freese-backend.onrender.com/login";
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
    
    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", efetuarLogin);
    }
});

async function carregarCatalogo() {
    try {
        const resposta = await fetch(API_URL);
        todosProdutos = await resposta.json();
        renderizarProdutos(todosProdutos);
    } catch (err) {
        if(listaProdutosGeral) listaProdutosGeral.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}

function renderizarProdutos(produtos) {
    if(!listaProdutosGeral) return;
    listaProdutosGeral.innerHTML = "";
    
    produtos.forEach(p => {
        const div = document.createElement("div");
        div.className = "produto";
        
        div.innerHTML = `
            <div style="cursor: pointer;" onclick="window.location.href='/front/detalhes/detalhes.html?id=${p.codproduto}'">
                <img src="${p.img}" alt="${p.nome}">
                <h3>${p.nome}</h3>
                <p class="preco">R$ ${Number(p.valor).toFixed(2)}</p>
            </div>
            <button onclick="adicionarCarrinho(${p.codproduto})">ADICIONAR AO CARRINHO</button>
        `;
        listaProdutosGeral.appendChild(div);
    });
}

function filtrarProdutos() {
    if(!inputBusca || !filtroCategoria || !filtroMarca) return;
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

if(inputBusca) inputBusca.addEventListener("input", filtrarProdutos);
if(filtroCategoria) filtroCategoria.addEventListener("change", filtrarProdutos);
if(filtroMarca) filtroMarca.addEventListener("change", filtrarProdutos);

function adicionarCarrinho(codproduto) {
    if (!localStorage.getItem("usuarioAtivo")) {
        alert("Acesse sua conta para comprar.");
        if(modal) modal.style.display = "block";
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
    if(!side || !overlay) return;

    if(abrir) { side.classList.add("ativo"); overlay.style.display = "block"; renderizarItensCarrinho(); }
    else { side.classList.remove("ativo"); overlay.style.display = "none"; }
}

async function renderizarItensCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const totalElement = document.getElementById("valor-total-carrinho");
    if(!container || !totalElement) return;

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
                        <p style="font-weight: bold;">${p.nome}</p>
                        <p style="font-size: 13px; color: #666;">Tamanho: ${item.tamanho || 'Único'}</p>
                        <p>${item.qtd}x R$ ${Number(p.valor).toFixed(2)}</p>
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
    if(!btnLogin) return;

    if (usuarioJson && usuarioJson !== "undefined") {
        const usuario = JSON.parse(usuarioJson);
        btnLogin.innerHTML = `<i class="fas fa-user-check"></i> ${usuario.nome.split(' ')[0]} (Sair)`;
        btnLogin.onclick = () => { if(confirm("Sair da conta?")) { localStorage.clear(); location.reload(); }};
        
        // CORREÇÃO: Se for administrador, manda pro painel!
        if (usuario.tipo && (usuario.tipo.toLowerCase() === "adm" || usuario.tipo.toLowerCase() === "admin")) {
            window.location.href = "/front/admin/admin.html";
        }
    } else {
        btnLogin.onclick = () => { modal.style.display = "block"; voltarSelecao(); };
    }
}

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

const btnClose = document.querySelector(".close-modal");
if(btnClose) btnClose.onclick = () => modal.style.display = "none";

async function efetuarLogin(event) {
    if(event) event.preventDefault();

    const emailInput = document.getElementById("email") || document.querySelector('input[type="email"]');
    const senhaInput = document.getElementById("senha") || document.querySelector('input[type="password"]');

    if (!emailInput || !senhaInput) {
        alert("Erro no código HTML: Campos de email ou senha não encontrados.");
        return;
    }

    try {
        const resposta = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'minha-chave': API_KEY 
            },
            body: JSON.stringify({
                email: emailInput.value,
                senha: senhaInput.value,
                tipoLoginEscolhido: tipoLoginEscolhido || 'cliente'
            })
        });

        const dados = await resposta.json();

        if (resposta.ok && dados.sucesso) {
            localStorage.setItem("usuarioAtivo", JSON.stringify(dados));
            location.reload(); 
        } else {
            alert(dados.message || "E-mail ou senha incorretos!");
        }
    } catch (erro) {
        console.error("Erro no login:", erro);
        alert("Erro ao conectar com o servidor.");
    }
}

async function finalizarCompra() {
    const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho")) || [];
    const usuarioJson = localStorage.getItem("usuarioAtivo");

    if (carrinhoAtual.length === 0) {
        alert("O seu carrinho está vazio! Adicione produtos antes de comprar.");
        return;
    }

    if (!usuarioJson) {
        alert("Você precisa fazer login para finalizar a compra.");
        const modal = document.getElementById("modal-login");
        if(modal) modal.style.display = "block";
        return;
    }

    const usuarioLogado = JSON.parse(usuarioJson);
    const idUsuario = usuarioLogado.codusuario || usuarioLogado.id || usuarioLogado.codcliente;

    const btnFinalizar = document.getElementById("btn-finalizar-compra");
    if (btnFinalizar) {
        btnFinalizar.innerText = "Processando...";
        btnFinalizar.disabled = true;
    }

    try {
        const dataAtual = new Date().toISOString().split('T')[0]; 
        let sucessoGeral = true;

        for (const item of carrinhoAtual) {
            const produto = todosProdutos.find(p => p.codproduto === item.codproduto);
            if (!produto) continue;

            const valorTotalDoItem = produto.valor * item.qtd;

            const dadosDaVenda = {
                codcliente: idUsuario,
                codproduto: item.codproduto,
                codusuario: idUsuario, 
                status: "Pendente",
                data: dataAtual,
                valortotal: valorTotalDoItem
            };

            const resposta = await fetch('https://projeto-programador-freese-backend.onrender.com/vendas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'minha-chave': API_KEY 
                },
                body: JSON.stringify(dadosDaVenda)
            });

            if (!resposta.ok) {
                sucessoGeral = false;
                console.error("Erro ao salvar o produto:", item.codproduto);
            }
        }

        if (sucessoGeral) {
            alert("🎉 Compra realizada com sucesso! A Freese Store agradece sua preferência.");
            localStorage.removeItem("carrinho"); 
            carrinho = []; 
            atualizarContador();
            toggleCarrinho(false); 
            location.reload(); 
        } else {
            alert("Tivemos um problema ao registrar alguns itens. Tente novamente.");
        }

    } catch (erro) {
        console.error("Erro no checkout:", erro);
        alert("Erro de conexão com o servidor. Tente novamente mais tarde.");
    } finally {
        if (btnFinalizar) {
            btnFinalizar.innerText = "FINALIZAR COMPRA";
            btnFinalizar.disabled = false;
        }
    }
}
