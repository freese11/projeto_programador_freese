const URL_SERVIDOR = "https://projeto-programador-freese-backend.onrender.com";
const API = `${URL_SERVIDOR}/usuarios`;
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

// Imagem de segurança ultra-forte embutida
const IMG_FALHA_USUARIO = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

let todosUsuarios = [];
let abaAtiva = "cliente"; 
let idUsuarioParaExcluir = null;

function voltar() {
    window.location.href = "/admin/admin.html";
}

async function carregar() {
    try {
        const res = await fetch(API, { headers: { "minha-chave": API_KEY } });
        todosUsuarios = await res.json();
        filtrar(); 
    } catch (erro) {
        showToast("Erro ao carregar usuários.", "error");
    }
}

function mudarAba(tipoPerfil) {
    abaAtiva = tipoPerfil;
    
    document.getElementById("aba-clientes").classList.remove("ativo");
    document.getElementById("aba-adms").classList.remove("ativo");
    
    if (tipoPerfil === "cliente") {
        document.getElementById("aba-clientes").classList.add("ativo");
    } else {
        document.getElementById("aba-adms").classList.add("ativo");
    }
    
    filtrar();
}

function filtrar() {
    const texto = document.getElementById("filtro-nome").value.toLowerCase();

    const filtrados = todosUsuarios.filter(u => {
        const perfilUser = (u.perfil || "cliente").toLowerCase();
        
        const bateuAba = (perfilUser === abaAtiva);
        const bateuTexto = (u.nome && u.nome.toLowerCase().includes(texto)) || 
                           (u.email && u.email.toLowerCase().includes(texto));

        return bateuAba && bateuTexto;
    });

    renderizar(filtrados);
}

function renderizar(lista) {
    const tabela = document.getElementById("tabela-usuarios");
    tabela.innerHTML = "";

    lista.forEach(u => {
        const id = u.codusuario;
        const ehAdm = (u.perfil && u.perfil.toLowerCase() === 'adm');
        const tipoClasse = ehAdm ? 'badge-adm' : 'badge-cliente';
        const tipoTexto = ehAdm ? 'Administrador' : 'Cliente';
        
        let urlFoto = IMG_FALHA_USUARIO; 
        
        if (u.foto_perfil) {
            if (u.foto_perfil.startsWith('http')) {
                urlFoto = u.foto_perfil;
            } else {
                urlFoto = URL_SERVIDOR + (u.foto_perfil.startsWith('/') ? u.foto_perfil : '/' + u.foto_perfil);
            }
        }

        tabela.innerHTML += `
            <tr>
                <td>
                    <img src="${urlFoto}" 
                         onerror="this.onerror=null; this.src='${IMG_FALHA_USUARIO}';" 
                         class="avatar-tabela" 
                         alt="Foto"
                         style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background-color: #fff; border: 1px solid #ddd;">
                </td>
                <td style="font-weight: bold; color: #555;">#${id}</td>
                <td><strong>${u.nome}</strong></td>
                <td>${u.email}</td>
                <td>${u.numero || '-'}</td>
                <td><span class="${tipoClasse}">${tipoTexto}</span></td>
                <td>
                    <button class="editar" onclick="editar(${id})"><i class="fas fa-pen"></i> Editar</button>
                    <button class="deletar" onclick="abrirModalExcluir(${id})"><i class="fas fa-trash"></i> Excluir</button>
                </td>
            </tr>
        `;
    });
}

function abrirModal(ehEdicao = false) {
    document.getElementById("modal").style.display = "block";
    document.getElementById("modal-titulo").innerText = ehEdicao ? "Editar Usuário" : "Novo Usuário";
    
    if(!ehEdicao) {
        document.getElementById("codusuario").value = "";
        document.getElementById("nome").value = "";
        document.getElementById("email").value = "";
        document.getElementById("senha").value = "";
        document.getElementById("numero").value = "";
        document.getElementById("perfil").value = abaAtiva; 
        document.getElementById("foto").value = "";
        
        const imgPreview = document.getElementById("preview-foto");
        imgPreview.src = IMG_FALHA_USUARIO;
        imgPreview.onerror = function() { this.onerror=null; this.src=IMG_FALHA_USUARIO; };
    }
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
}

function previewImagem(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("preview-foto").src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}

async function salvar() {
    const cod = document.getElementById("codusuario").value;
    
    const nomeInput = document.getElementById("nome").value;
    const emailInput = document.getElementById("email").value;

    if(!nomeInput || !emailInput) {
        showToast("Preencha o nome e o e-mail do usuário.", "warning");
        return;
    }

    const formData = new FormData();
    formData.append("nome", nomeInput);
    formData.append("email", emailInput);
    formData.append("senha", document.getElementById("senha").value);
    formData.append("numero", document.getElementById("numero").value);
    formData.append("perfil", document.getElementById("perfil").value);

    const inputFoto = document.getElementById("foto");
    if (inputFoto.files.length > 0) {
        formData.append("foto", inputFoto.files[0]);
    }

    const metodo = cod ? "PUT" : "POST";
    const url = cod ? `${API}/${cod}` : API;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: {
                "minha-chave": API_KEY
            },
            body: formData
        });

        if(res.ok) {
            fecharModal();
            showToast(cod ? "Usuário atualizado com sucesso!" : "Novo usuário cadastrado!", "success");
            carregar(); 
        } else {
            const erro = await res.json();
            showToast("Erro: " + (erro.erro || "Falha ao salvar."), "error");
        }
    } catch(erro) {
        showToast("Erro de conexão com o servidor.", "error");
    }
}

async function editar(id) {
    try {
        const res = await fetch(`${API}/${id}`, { headers: { "minha-chave": API_KEY } });
        const u = await res.json();

        document.getElementById("codusuario").value = u.codusuario;
        document.getElementById("nome").value = u.nome;
        document.getElementById("email").value = u.email;
        document.getElementById("senha").value = u.senha || ""; 
        document.getElementById("numero").value = u.numero || "";
        document.getElementById("perfil").value = u.perfil || "cliente";
        
        let urlFotoModal = IMG_FALHA_USUARIO;
        if (u.foto_perfil) {
            if (u.foto_perfil.startsWith('http')) {
                urlFotoModal = u.foto_perfil;
            } else {
                urlFotoModal = URL_SERVIDOR + (u.foto_perfil.startsWith('/') ? u.foto_perfil : '/' + u.foto_perfil);
            }
        }
        
        document.getElementById("foto").value = "";
        
        const imgPreview = document.getElementById("preview-foto");
        imgPreview.src = urlFotoModal;
        imgPreview.onerror = function() { this.onerror=null; this.src=IMG_FALHA_USUARIO; };

        abrirModal(true); 
    } catch(erro) {
        showToast("Erro ao buscar os dados deste usuário.", "error");
    }
}

// ==========================================
// LÓGICA DO NOVO MODAL DE EXCLUIR
// ==========================================
function abrirModalExcluir(id) {
    idUsuarioParaExcluir = id;
    document.getElementById("modal-confirmacao-excluir").style.display = "block";
}

function fecharModalExcluir() {
    idUsuarioParaExcluir = null;
    document.getElementById("modal-confirmacao-excluir").style.display = "none";
}

async function confirmarExclusao() {
    if (!idUsuarioParaExcluir) return;

    try {
        const res = await fetch(`${API}/${idUsuarioParaExcluir}`, {
            method: "DELETE",
            headers: { "minha-chave": API_KEY }
        });

        if (res.ok) {
            showToast("Usuário excluído com sucesso.", "success");
            fecharModalExcluir();
            carregar(); 
        } else {
            const dadosErro = await res.json();
            showToast("Erro: " + (dadosErro.erro || "Falha ao excluir."), "error");
            fecharModalExcluir();
        }
    } catch(erro) {
        showToast("Erro ao excluir o usuário.", "error");
        fecharModalExcluir();
    }
}

/* ============================================================
   FUNÇÃO DE NOTIFICAÇÃO (TOAST) - ESTILO FREESE STORE
   ============================================================ */
function showToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const config = {
        'success': { icone: 'fa-check', titulo: 'SUCESSO', cor: '#10b981' },        
        'error':   { icone: 'fa-times', titulo: 'ERRO', cor: '#ff4757' }, 
        'warning': { icone: 'fa-exclamation', titulo: 'ATENÇÃO', cor: '#f59e0b' },   
        'info':    { icone: 'fa-info', titulo: 'INFORMAÇÃO', cor: '#3b82f6' }        
    };

    const atual = config[tipo] || config['info'];

    const toast = document.createElement('div');
    toast.className = `toast-freese ${tipo}`;
    
    toast.style.setProperty('--toast-cor', atual.cor);

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

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 3500);
}

carregar();
