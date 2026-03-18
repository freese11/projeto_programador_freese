const API = "https://projeto-programador-freese-backend.onrender.com/usuarios";
const API_KEY = "SUA_CHAVE_SECRETA_MUITO_FORTE_123456";

let todosUsuarios = [];
let abaAtiva = "cliente"; 

function voltar() {
    window.location.href = "/admin/admin.html";
}

async function carregar() {
    try {
        const res = await fetch(API, { headers: { "minha-chave": API_KEY } });
        todosUsuarios = await res.json();
        filtrar(); 
    } catch (erro) {
        console.error("Erro ao carregar usuários:", erro);
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
        // Usa a coluna "perfil" que vem do seu banco (adm ou cliente)
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
        
        // Se não tiver foto no banco, usa um ícone padrão
        const urlFoto = u.foto_perfil ? u.foto_perfil : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

        tabela.innerHTML += `
            <tr>
                <td><img src="${urlFoto}" class="avatar-tabela" alt="Foto"></td>
                <td>#${id}</td>
                <td><strong>${u.nome}</strong></td>
                <td>${u.email}</td>
                <td>${u.numero || '-'}</td>
                <td><span class="${tipoClasse}">${tipoTexto}</span></td>
                <td>
                    <button class="editar" onclick="editar(${id})">Editar</button>
                    <button class="deletar" onclick="deletar(${id})">Excluir</button>
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
        document.getElementById("preview-foto").src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
}

// Preview da imagem antes de salvar
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

// 👇 IMPORTANTE: Salvar usando FormData para suportar a imagem!
async function salvar() {
    const cod = document.getElementById("codusuario").value;
    
    // Como o backend usa Multer, PRECISAMOS enviar como FormData (não como JSON)
    const formData = new FormData();
    formData.append("nome", document.getElementById("nome").value);
    formData.append("email", document.getElementById("email").value);
    formData.append("senha", document.getElementById("senha").value);
    formData.append("numero", document.getElementById("numero").value);
    formData.append("perfil", document.getElementById("perfil").value);

    // Adiciona o arquivo da foto, se o usuário selecionou alguma
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
                // ATENÇÃO: Ao usar FormData, não colocamos o 'Content-Type'. 
                // O próprio navegador cuida disso para nós automaticamente!
            },
            body: formData
        });

        if(res.ok) {
            fecharModal();
            carregar(); 
        } else {
            const erro = await res.json();
            alert("Erro: " + (erro.erro || "Falha ao salvar."));
        }
    } catch(erro) {
        alert("Erro de conexão com o servidor.");
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
        
        // Zera o input de arquivo e ajusta a imagem de preview
        document.getElementById("foto").value = "";
        document.getElementById("preview-foto").src = u.foto_perfil ? u.foto_perfil : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

        abrirModal(true); 
    } catch(erro) {
        alert("Erro ao buscar os dados deste usuário.");
    }
}

async function deletar(id) {
    if (!confirm("Tem certeza que deseja excluir este usuário definitivamente?")) return;

    try {
        const res = await fetch(`${API}/${id}`, {
            method: "DELETE",
            headers: { "minha-chave": API_KEY }
        });

        if (res.ok) {
            carregar(); 
        } else {
            const dadosErro = await res.json();
            alert("Erro: " + dadosErro.erro); // Exibe o erro 23503 caso ele tenha vendas registradas
        }
    } catch(erro) {
        alert("Erro ao excluir o usuário.");
    }
}

carregar();
