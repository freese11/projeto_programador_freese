const URL_SERVIDOR = "https://projeto-programador-freese-backend.onrender.com";
const API_URL = `${URL_SERVIDOR}/produtos`;
const USUARIOS_URL = `${URL_SERVIDOR}/usuarios`;
const LOGIN_URL = `${URL_SERVIDOR}/login`;
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
    carregarProdutosHome();
    verificarStatusUsuario();
    
    const closeBtns = document.querySelectorAll(".close-modal");
    closeBtns.forEach(btn => {
        btn.onclick = function() {
            this.closest('.modal').style.display = "none";
        }
    });
});

async function carregarProdutosHome() {
    if (!listaProdutosDestaque) return;
    try {
        const resposta = await fetch(API_URL);
        todosProdutos = await resposta.json();
        
        const destaques = todosProdutos.filter(p => p.nome.toLowerCase().includes("bmw"));
        
        listaProdutosDestaque.innerHTML = "";
        destaques.forEach(produto => {
            const div = document.createElement("div");
            div.className = "produto";
            // 👇 Adicionado onerror para fotos de produtos que sumirem
            div.innerHTML = `
                <img src="${produto.img}" alt="${produto.nome}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Sem+Foto';">
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

// ==========================================
// 🚀 STATUS DO USUÁRIO E FOTO DE PERFIL
// ==========================================
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

        if (userObj.perfil === "adm" || session.tipo === "adm") {
            window.location.href = "/admin/admin.html";
            return;
        }

        const montarUrlFoto = (caminho) => {
            if (!caminho || caminho === "null" || caminho.trim() === "") {
                return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            }
            if (caminho.startsWith('http') || caminho.startsWith('data:')) {
                return caminho;
            }
            let caminhoCorrigido = caminho.startsWith('/') ? caminho : '/' + caminho;
            return URL_SERVIDOR + caminhoCorrigido;
        };

        let urlFotoAtual = montarUrlFoto(fotoSalva);
        
        // 👇 A MÁGICA ESTÁ AQUI: O onerror troca para a foto cinza se o Render apagar o arquivo
        btnLogin.innerHTML = `
            <img id="img-perfil-header" 
                 src="${urlFotoAtual}" 
                 onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png';" 
                 style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 5px; border: 1px solid #ccc; background: white;"> 
            <span style="font-weight: bold;">${primeiroNome}</span>
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
                        let urlFotoNova = montarUrlFoto(u.foto_perfil);
                        urlFotoNova += "?v=" + new Date().getTime();
                        
                        const imgHeader = document.getElementById("img-perfil-header");
                        if (imgHeader) imgHeader.src = urlFotoNova;

                        const imgModal = document.getElementById("preview-foto-perfil");
                        // 👇 Adiciona a proteção no modal também
                        if (imgModal) {
                            imgModal.onerror = function() { this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png'; };
                            imgModal.src = urlFotoNova;
                        }

                        userObj.foto_perfil = u.foto_perfil;
                        if(session.usuario) {
                            session.usuario = userObj;
                        } else {
                            session = userObj;
                        }
                        localStorage.setItem("usuarioAtivo", JSON.stringify(session));
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar foto fresquinha:", err);
            }
        }

    } else {
        btnLogin.innerHTML = `<i class="far fa-user"></i> Login`;
        btnLogin.onclick = () => {
            if (modal) {
                modal.style.display = "block";
                voltarSelecao();
            }
        };
    }
}

// ==========================================
// FUNÇÕES DO MODAL LOGIN E REGISTRO
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
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
        const response = await fetch(LOGIN_URL, {
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

function previewImagemRegistro(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("preview-foto-registro").src = e.target.result;
        }
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
    if (inputFoto.files && inputFoto.files.length > 0) {
        formData.append("foto", inputFoto.files[0]);
    }

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
    } catch (erro) {
        alert("Erro de conexão com o servidor.");
    } finally {
        btnSalvar.innerText = textoOriginal;
        btnSalvar.disabled = false;
    }
}

// ==========================================
// CARRINHO E PERFIL
// ==========================================
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
                // 👇 Adicionado onerror aqui também para fotos no carrinho
                container.innerHTML += `<div class="item-no-carrinho"><img src="${p.img}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150?text=Sem+Foto';"><div><p><strong>${p.nome}</strong></p><p>${item.qtd}x R$ ${p.valor}</p></div></div>`;
            }
        });
        document.getElementById("valor-total-carrinho").innerText = `R$ ${totalGeral.toFixed(2)}`;
    } catch (e) { console.error(e); }
}

function previewImagemPerfil(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("preview-foto-perfil").src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}

function sairConta() {
    if (confirm("Deseja realmente sair da sua conta?")) {
        localStorage.removeItem("usuarioAtivo");
        localStorage.removeItem("carrinho");
        location.reload();
    }
}

async function salvarFotoPerfil() {
    const inputFoto = document.getElementById("foto-perfil");
    
    if (inputFoto.files.length === 0) {
        alert("Por favor, clique em 'Escolher Nova Foto' primeiro para selecionar uma imagem.");
        return;
    }

    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const session = JSON.parse(usuarioJson);
    
    const userObj = session.usuario ? session.usuario : session;
    const idUser = userObj.codusuario || userObj.id;

    if (!idUser) {
        alert("Erro de autenticação. Faça login novamente.");
        return;
    }

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
        } else {
            alert("Erro ao atualizar foto. Tente novamente.");
        }
    } catch(err) {
        console.error("Erro ao salvar foto:", err);
        alert("Erro de conexão ao tentar salvar a foto.");
    } finally {
        btnSalvar.innerText = textoOriginal;
        btnSalvar.disabled = false;
    }
}
