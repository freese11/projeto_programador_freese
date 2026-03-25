const URL_SERVIDOR = "https://projeto-programador-freese-backend.onrender.com";
const API_URL = `${URL_SERVIDOR}/produtos`;
const USUARIOS_URL = `${URL_SERVIDOR}/usuarios`;
const LOGIN_URL = `${URL_SERVIDOR}/login`;
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

const IMG_FALHA_PRODUTO = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%23999'%3ESem Foto%3C/text%3E%3C/svg%3E";
const IMG_FALHA_USUARIO = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

function montarUrlSegura(caminho) {
    if (!caminho || caminho === "null" || caminho.trim() === "") return null;
    if (caminho.startsWith('http') || caminho.startsWith('data:')) return caminho;
    let caminhoCorrigido = caminho.startsWith('/') ? caminho : '/' + caminho;
    return URL_SERVIDOR + caminhoCorrigido;
}

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

    const btnAbrirCarrinho = document.getElementById("abrir-carrinho");
    if (btnAbrirCarrinho) {
        btnAbrirCarrinho.addEventListener("click", () => toggleCarrinho(true));
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
        
        let srcImg = montarUrlSegura(p.img) || IMG_FALHA_PRODUTO;

        div.innerHTML = `
            <div style="cursor: pointer;" onclick="window.location.href='/detalhes/detalhes.html?id=${p.codproduto}'">
                <img src="${srcImg}" alt="${p.nome}" onerror="this.onerror=null; this.src='${IMG_FALHA_PRODUTO}';">
                <h3>${p.nome}</h3>
                <p class="preco">R$ ${Number(p.valor).toFixed(2)}</p>
            </div>
            <button onclick="window.location.href='/detalhes/detalhes.html?id=${p.codproduto}'">VER DETALHES</button>
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
            let srcImgCarrinho = montarUrlSegura(p.img) || IMG_FALHA_PRODUTO;
            container.innerHTML += `
                <div class="item-no-carrinho">
                    <img src="${srcImgCarrinho}" onerror="this.onerror=null; this.src='${IMG_FALHA_PRODUTO}';">
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

// ==========================================
// FUNÇÕES DE LOGIN, REGISTRO E FOTO DE PERFIL
// ==========================================

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

async function efetuarLogin(event) {
    event.preventDefault();
    const emailInput = document.getElementById("email").value;
    const senhaInput = document.getElementById("senha").value;

    try {
        const resposta = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'minha-chave': API_KEY },
            body: JSON.stringify({ email: emailInput, senha: senhaInput, tipoLoginEscolhido })
        });
        const dados = await resposta.json();
        if (resposta.ok && dados.sucesso) {
            localStorage.setItem("usuarioAtivo", JSON.stringify(dados));
            location.reload(); 
        } else {
            alert(dados.message || "E-mail ou senha incorretos!");
        }
    } catch (erro) { alert("Erro ao conectar com o servidor."); }
}

function previewImagemRegistro(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { document.getElementById("preview-foto-registro").src = e.target.result; }
        reader.readAsDataURL(file);
    }
}

async function registrarCliente(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append("nome", document.getElementById("reg-nome").value);
    formData.append("email", document.getElementById("reg-email").value);
    formData.append("senha", document.getElementById("reg-senha").value);
    formData.append("numero", document.getElementById("reg-telefone").value);
    formData.append("perfil", "cliente"); 

    const inputFoto = document.getElementById("reg-foto");
    if (inputFoto.files && inputFoto.files.length > 0) formData.append("foto", inputFoto.files[0]);

    const btnSalvar = document.querySelector("#form-registro button[type='submit']");
    const textoOriginal = btnSalvar.innerText;
    btnSalvar.innerText = "CADASTRANDO...";
    btnSalvar.disabled = true;

    try {
        const res = await fetch(USUARIOS_URL, {
            method: "POST",
            headers: { "minha-chave": API_KEY },
            body: formData
        });

        if (res.ok) {
            alert("Conta criada com sucesso! Você já pode fazer login.");
            voltarSelecao(); 
        } else {
            const erro = await res.json();
            alert("Erro: " + (erro.erro || "Falha ao cadastrar."));
        }
    } catch (erro) { alert("Erro de conexão com o servidor."); } 
    finally { btnSalvar.innerText = textoOriginal; btnSalvar.disabled = false; }
}

async function verificarStatusUsuario() {
    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const btnLogin = document.getElementById("btn-login-abrir");

    if (!btnLogin) return;

    if (usuarioJson && usuarioJson !== "undefined") {
        let session = JSON.parse(usuarioJson);
        let userObj = session.usuario ? session.usuario : session;
        
        let idUser = userObj.codusuario || userObj.id;
        let nomeSalvo = userObj.nome || "Usuário";
        let primeiroNome = String(nomeSalvo).split(' ')[0];
        let fotoSalva = userObj.foto_perfil || userObj.foto;

        if (userObj.perfil === "adm" || session.tipo === "adm" || session.tipo === "admin") {
            window.location.href = "/admin/admin.html";
            return;
        }

        let urlFotoAtual = montarUrlSegura(fotoSalva) || IMG_FALHA_USUARIO;
        
        let ehGif = urlFotoAtual.toLowerCase().includes('.gif');
        let estiloImagem = ehGif 
            ? "width: 42px; height: 42px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 8px; border: 2px solid #111; background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.15);"
            : "width: 35px; height: 35px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 8px; border: 2px solid #111; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";

        btnLogin.innerHTML = `
            <img id="img-perfil-header" src="${urlFotoAtual}" onerror="this.onerror=null; this.src='${IMG_FALHA_USUARIO}';" style="${estiloImagem}"> 
            <span style="font-size: 15px; font-weight: 700; color: #111; text-transform: capitalize;">${primeiroNome}</span>
        `;
        
        btnLogin.onclick = () => {
            const modalPerfil = document.getElementById("modal-perfil");
            if (modalPerfil) {
                modalPerfil.style.display = "block";
                document.getElementById("preview-foto-perfil").src = document.getElementById("img-perfil-header").src;
            }
        };

        if (idUser) {
            try {
                const res = await fetch(`${USUARIOS_URL}/${idUser}`, { headers: { "minha-chave": API_KEY } });
                if (res.ok) {
                    const u = await res.json();
                    if (u && u.foto_perfil) {
                        let urlFotoNova = montarUrlSegura(u.foto_perfil);
                        if (urlFotoNova) urlFotoNova += "?v=" + new Date().getTime();
                        
                        const imgHeader = document.getElementById("img-perfil-header");
                        if (imgHeader) imgHeader.src = urlFotoNova;

                        const imgModal = document.getElementById("preview-foto-perfil");
                        if (imgModal) imgModal.src = urlFotoNova;

                        userObj.foto_perfil = u.foto_perfil;
                        if(session.usuario) { session.usuario = userObj; } else { session = userObj; }
                        localStorage.setItem("usuarioAtivo", JSON.stringify(session));
                    }
                }
            } catch (err) { console.error("Erro ao buscar foto:", err); }
        }
    } else {
        btnLogin.innerHTML = `<i class="far fa-user" style="font-size: 16px; margin-right: 5px;"></i> <span style="font-weight: 600; font-size: 14px;">Login</span>`;
        btnLogin.onclick = () => {
            if (modal) { modal.style.display = "block"; voltarSelecao(); }
        };
    }
}

function previewImagemPerfil(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { document.getElementById("preview-foto-perfil").src = e.target.result; }
        reader.readAsDataURL(file);
    }
}

function sairConta() {
    if (confirm("Deseja realmente sair da sua conta?")) {
        localStorage.removeItem("usuarioAtivo");
        localStorage.removeItem("carrinho");
        window.location.href = "/index.html"; 
    }
}

async function salvarFotoPerfil() {
    const inputFoto = document.getElementById("foto-perfil");
    if (!inputFoto || inputFoto.files.length === 0) {
        alert("Por favor, clique em 'Trocar Foto' primeiro para selecionar uma imagem.");
        return;
    }

    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const session = JSON.parse(usuarioJson);
    const userObj = session.usuario ? session.usuario : session;
    const idUser = userObj.codusuario || userObj.id;

    if (!idUser) { alert("Erro de autenticação. Faça login novamente."); return; }

    const btnSalvar = document.querySelector("#modal-perfil button.btn-primary");
    const textoOriginal = btnSalvar.innerText;
    btnSalvar.innerText = "Salvando...";
    btnSalvar.disabled = true;

    try {
        const resBusca = await fetch(`${USUARIOS_URL}/${idUser}`, { headers: { "minha-chave": API_KEY } });
        const u = await resBusca.json();

        const formData = new FormData();
        formData.append("nome", u.nome);
        formData.append("email", u.email);
        if (u.senha) formData.append("senha", u.senha); 
        if (u.numero) formData.append("numero", u.numero);
        formData.append("perfil", u.perfil || "cliente");
        formData.append("foto", inputFoto.files[0]); 

        const resPut = await fetch(`${USUARIOS_URL}/${idUser}`, {
            method: "PUT",
            headers: { "minha-chave": API_KEY },
            body: formData
        });

        if (resPut.ok) {
            alert("Sua foto de perfil foi atualizada com sucesso!");
            location.reload(); 
        } else { alert("Erro ao atualizar foto. Tente novamente."); }
    } catch(err) { alert("Erro de conexão ao tentar salvar a foto."); } 
    finally { btnSalvar.innerText = textoOriginal; btnSalvar.disabled = false; }
}
