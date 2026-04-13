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
    
    const btnAbrirCarrinho = document.getElementById("abrir-carrinho");
    if (btnAbrirCarrinho) {
        btnAbrirCarrinho.addEventListener("click", () => toggleCarrinho(true));
    }
    
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
            let srcImg = montarUrlSegura(produto.img) || IMG_FALHA_PRODUTO;

            const div = document.createElement("div");
            div.className = "produto";
            div.innerHTML = `
                <div style="cursor: pointer;" onclick="window.location.href='/detalhes/detalhes.html?id=${produto.codproduto}'">
                    <img src="${srcImg}" alt="${produto.nome}" onerror="this.onerror=null; this.src='${IMG_FALHA_PRODUTO}';">
                    <h3>${produto.nome}</h3>
                    <p class="preco">R$ ${Number(produto.valor).toFixed(2)}</p>
                </div>
                <button onclick="window.location.href='/detalhes/detalhes.html?id=${produto.codproduto}'">VER DETALHES</button>
            `;
            listaProdutosDestaque.appendChild(div);
        });
    } catch (err) {
        console.error("Erro ao carregar produtos", err);
    }
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
        let estiloImagem = "";
        
        if (ehGif) {
            estiloImagem = "width: 55px; height: 55px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 10px; border: 2px solid #111; background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.15);";
        } else {
            estiloImagem = "width: 45px; height: 45px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 10px; border: 2px solid #111; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";
        }

        btnLogin.innerHTML = `
            <img id="img-perfil-header" 
                 src="${urlFotoAtual}" 
                 onerror="this.onerror=null; this.src='${IMG_FALHA_USUARIO}';" 
                 style="${estiloImagem}"> 
            <span style="font-size: 14px; font-weight: 600; color: #333; text-transform: capitalize;">${primeiroNome}</span>
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
                        else urlFotoNova = IMG_FALHA_USUARIO;
                        
                        const imgHeader = document.getElementById("img-perfil-header");
                        if (imgHeader) {
                            imgHeader.src = urlFotoNova;
                            imgHeader.onerror = function() { this.onerror=null; this.src=IMG_FALHA_USUARIO; };
                            
                            let novaEhGif = urlFotoNova.toLowerCase().includes('.gif');
                            if(novaEhGif) {
                                imgHeader.style.cssText = "width: 55px; height: 55px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 10px; border: 2px solid #111; background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.15);";
                            } else {
                                imgHeader.style.cssText = "width: 45px; height: 45px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 10px; border: 2px solid #111; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";
                            }
                        }

                        const imgModal = document.getElementById("preview-foto-perfil");
                        if (imgModal) {
                            imgModal.src = urlFotoNova;
                            imgModal.onerror = function() { this.onerror=null; this.src=IMG_FALHA_USUARIO; };
                        }

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
            showToast("Sua conta foi conectada.", "success");
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast(dados.message || "E-mail ou senha incorretos.", "error");
        }
    } catch (erro) { showToast("Não foi possível conectar ao servidor.", "error"); }
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
            showToast("Conta criada! Você já pode fazer o login.", "success");
            voltarSelecao(); 
        } else {
            const erro = await res.json();
            showToast("Erro: " + (erro.erro || "Falha ao cadastrar."), "error");
        }
    } catch (erro) { showToast("Erro de conexão com o servidor.", "error"); } 
    finally { btnSalvar.innerText = textoOriginal; btnSalvar.disabled = false; }
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
    
    if (carrinho.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding: 30px 20px; color:#888; font-weight: 600;'>Seu carrinho está vazio.</p>";
        document.getElementById("valor-total-carrinho").innerText = "R$ 0,00";
        return;
    }

    try {
        const resposta = await fetch(API_URL);
        const produtosBD = await resposta.json();
        
        carrinho.forEach((item, index) => {
            const p = produtosBD.find(prod => prod.codproduto === item.codproduto);
            if (p) {
                totalGeral += p.valor * item.qtd;
                let srcImgCarrinho = montarUrlSegura(p.img) || IMG_FALHA_PRODUTO;
                
                container.innerHTML += `
                    <div class="item-no-carrinho" style="position: relative;">
                        <img src="${srcImgCarrinho}" onerror="this.onerror=null; this.src='${IMG_FALHA_PRODUTO}';">
                        <div style="flex-grow: 1; padding-right: 30px;">
                            <p style="font-weight: bold; font-size: 15px; color: #111; margin-bottom: 2px; text-transform: lowercase;">${p.nome}</p>
                            <p style="font-size: 13px; color: #666; margin-bottom: 3px;">Tam: ${item.tamanho || 'Único'} | Qtd: ${item.qtd}</p>
                            <p style="font-size: 16px; font-weight: 900; color: var(--premium-red);">R$ ${Number(p.valor).toFixed(2)}</p>
                        </div>
                        
                        <i class="fas fa-trash" 
                           onclick="removerItemCarrinho(${index})" 
                           title="Remover produto"
                           style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #bbb; cursor: pointer; transition: 0.3s; font-size: 18px;" 
                           onmouseover="this.style.color='var(--premium-red)'" 
                           onmouseout="this.style.color='#bbb'">
                        </i>
                    </div>`;
            }
        });
        document.getElementById("valor-total-carrinho").innerText = `R$ ${totalGeral.toFixed(2)}`;
    } catch (e) { console.error("Erro ao renderizar carrinho:", e); }
}

function removerItemCarrinho(index) {
    carrinho.splice(index, 1); 
    localStorage.setItem("carrinho", JSON.stringify(carrinho)); 
    atualizarContador(); 
    renderizarItensCarrinho(); 
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
    const modalPerfil = document.getElementById("modal-perfil");
    if(modalPerfil) modalPerfil.style.display = "none";
    
    const modalSair = document.getElementById("modal-confirmacao-sair");
    if(modalSair) modalSair.style.display = "block";
}

function fecharModalSair() {
    document.getElementById("modal-confirmacao-sair").style.display = "none";
    document.getElementById("modal-perfil").style.display = "block";
}

function confirmarSairConta() {
    localStorage.removeItem("usuarioAtivo");
    localStorage.removeItem("carrinho");
    location.reload();
}

async function salvarFotoPerfil() {
    const inputFoto = document.getElementById("foto-perfil");
    if (inputFoto.files.length === 0) {
        showToast("Selecione uma imagem antes de salvar.", "warning");
        return;
    }

    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const session = JSON.parse(usuarioJson);
    
    const userObj = session.usuario ? session.usuario : session;
    const idUser = userObj.codusuario || userObj.id;

    if (!idUser) { showToast("Sessão expirada. Faça login novamente.", "error"); return; }

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
            showToast("Foto de perfil atualizada!", "success");
            setTimeout(() => location.reload(), 1500); 
        } else { showToast("Não foi possível salvar a foto.", "error"); }
    } catch(err) { showToast("Erro no servidor ao salvar a foto.", "error"); } 
    finally { btnSalvar.innerText = textoOriginal; btnSalvar.disabled = false; }
}

/* ============================================================
   FUNÇÃO DE NOTIFICAÇÃO (TOAST) - ESTILO FREESE STORE
   ============================================================ */
function showToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Dicionário com as cores, ícones e títulos Exclusivos
    const config = {
        'success': { icone: 'fa-check', titulo: 'SUCESSO', cor: '#10b981' },        // Verde esmeralda
        'error':   { icone: 'fa-times', titulo: 'ERRO', cor: 'var(--premium-red)' }, // Vermelho da loja
        'warning': { icone: 'fa-exclamation', titulo: 'ATENÇÃO', cor: '#f59e0b' },   // Amarelo
        'info':    { icone: 'fa-info', titulo: 'INFORMAÇÃO', cor: '#3b82f6' }        // Azul
    };

    const atual = config[tipo] || config['info'];

    const toast = document.createElement('div');
    toast.className = `toast-freese ${tipo}`;
    
    // Injeta a cor certa para a barrinha animada no CSS
    toast.style.setProperty('--toast-cor', atual.cor);

    // Estrutura premium do aviso
    toast.innerHTML = `
        <div class="toast-icon" style="color: ${atual.cor}">
            <i class="fas ${atual.icone}"></i>
        </div>
        <div class="toast-content">
            <span class="toast-title">${atual.titulo}</span>
            <span class="toast-message">${mensagem}</span>
        </div>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Some depois de 3.5 segundos exatos (mesmo tempo da barrinha sumir)
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Espera o CSS fechar para excluir
    }, 3500);
}
