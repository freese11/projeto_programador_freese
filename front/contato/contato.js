const URL_SERVIDOR = "https://projeto-programador-freese-backend.onrender.com";
const USUARIOS_URL = `${URL_SERVIDOR}/usuarios`;
const LOGIN_URL = `${URL_SERVIDOR}/login`;
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

const IMG_FALHA_USUARIO = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

const contadorCarrinho = document.getElementById("contador-carrinho");
const modal = document.getElementById("modal-login");

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let tipoLoginEscolhido = "";

document.addEventListener("DOMContentLoaded", () => {
    atualizarContador();
    verificarStatusUsuario();
    
    const formContato = document.getElementById("form-contato-ajuda");
    if(formContato) {
        formContato.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Sua mensagem foi enviada com sucesso! Nossa equipe responderá em breve.");
            formContato.reset();
        });
    }
});

function atualizarContador() {
    if(contadorCarrinho) contadorCarrinho.innerText = carrinho.reduce((soma, p) => soma + p.qtd, 0);
}

function toggleCarrinho() {
    const side = document.getElementById("carrinho-lateral");
    const overlay = document.getElementById("carrinho-overlay");
    if(!side || !overlay) return;

    if(!side.classList.contains("ativo")) { 
        side.classList.add("ativo"); 
        overlay.style.display = "block"; 
    } else { 
        side.classList.remove("ativo"); 
        overlay.style.display = "none"; 
    }
}

// ==========================================
// LOGIN E REGISTRO
// ==========================================

function configurarLogin(tipo) { tipoLoginEscolhido = tipo; document.getElementById("selecao-tipo").classList.add("hidden"); document.getElementById("form-login").classList.remove("hidden"); }
function configurarRegistro() { document.getElementById("selecao-tipo").classList.add("hidden"); document.getElementById("form-registro").classList.remove("hidden"); }
function voltarSelecao() { document.getElementById("selecao-tipo").classList.remove("hidden"); document.getElementById("form-login").classList.add("hidden"); document.getElementById("form-registro").classList.add("hidden"); }

async function efetuarLogin(event) {
    event.preventDefault(); 
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    try {
        const resposta = await fetch(LOGIN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "minha-chave": API_KEY },
            body: JSON.stringify({ email: email, senha: senha, tipoLoginEscolhido: tipoLoginEscolhido })
        });

        if (resposta.ok) {
            const dados = await resposta.json();
            localStorage.setItem("usuarioAtivo", JSON.stringify(dados));
            location.reload(); 
        } else {
            alert("E-mail ou senha incorretos!");
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

// ==========================================
// SISTEMA DE PERFIL E FOTO
// ==========================================

function montarUrlSegura(caminho) {
    if (!caminho || caminho === "null" || caminho.trim() === "") return null;
    if (caminho.startsWith('http') || caminho.startsWith('data:')) return caminho;
    let caminhoCorrigido = caminho.startsWith('/') ? caminho : '/' + caminho;
    return URL_SERVIDOR + caminhoCorrigido;
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
