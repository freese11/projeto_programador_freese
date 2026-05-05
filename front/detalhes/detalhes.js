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
    let srcImg = montarUrlSegura(produto.img) || IMG_FALHA_PRODUTO;

    let nomeProduto = produto.nome.toLowerCase();
    
    // Verificações de categoria pelo nome
    let ehCalcado = nomeProduto.includes("tênis") || 
                    nomeProduto.includes("tenis") || 
                    nomeProduto.includes("sneaker") || 
                    nomeProduto.includes("chinelo");
                    
    let ehTamanhoUnico = nomeProduto.includes("boné") || 
                         nomeProduto.includes("bone") ||
                         nomeProduto.includes("touca"); // Adicionei touca também como dica!

    let opcoesTamanho = "";
    
    // Lógica para montar o select correto
    if (ehCalcado) {
        opcoesTamanho = `
            <option value="36">Tamanho 36</option>
            <option value="37">Tamanho 37</option>
            <option value="38">Tamanho 38</option>
            <option value="39">Tamanho 39</option>
            <option value="40">Tamanho 40</option>
            <option value="41">Tamanho 41</option>
            <option value="42">Tamanho 42</option>
            <option value="43">Tamanho 43</option>
            <option value="44">Tamanho 44</option>
        `;
    } else if (ehTamanhoUnico) {
        opcoesTamanho = `
            <option value="U">Tamanho Único</option>
        `;
    } else {
        opcoesTamanho = `
            <option value="P">Tamanho P</option>
            <option value="M">Tamanho M</option>
            <option value="G">Tamanho G</option>
            <option value="GG">Tamanho GG</option>
            <option value="XG">Tamanho XG</option>
        `;
    }

    // Injeção do HTML na tela
    wrapper.innerHTML = `
        <div class="produto-imagem">
            <img src="${srcImg}" alt="${produto.nome}" onerror="this.onerror=null; this.src='${IMG_FALHA_PRODUTO}';">
        </div>
        <div class="produto-info">
            <span class="selo-marca">FREESE STORE</span>
            <h1>${produto.nome}</h1>
            <p class="preco-detalhe">R$ ${Number(produto.valor).toFixed(2).replace('.', ',')}</p>
            
            <!-- Melhoria: Usa a descrição do produto se existir, senão usa a padrão -->
            <p class="descricao">${produto.descricao ? produto.descricao : 'Produto original de alta qualidade. Adicione estilo e conforto ao seu guarda-roupa com as melhores peças do mercado.'}</p>
            
            <div class="seletor-tamanho">
                <label for="tamanho-escolhido">Selecione o Tamanho:</label>
                <select id="tamanho-escolhido">
                    <!-- Opções vazias para forçar o cliente a escolher seria bom no futuro, ex: <option value="" disabled selected>Escolha...</option> -->
                    ${opcoesTamanho}
                </select>
            </div>
            
            <button class="btn-adicionar-carrinho" onclick="adicionarAoCarrinhoDetalhes()">ADICIONAR AO CARRINHO</button>
        </div>
    `;
}



function adicionarAoCarrinhoDetalhes() {
    if (!localStorage.getItem("usuarioAtivo")) {
        showToast("Acesse sua conta para adicionar produtos ao carrinho.", "warning");
        if (modal) modal.style.display = "block";
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
    showToast("Produto adicionado ao carrinho!", "success");
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
                            <p style="font-size: 16px; font-weight: 900; color: var(--premium-red);">R$ ${Number(p.valor).toFixed(2).replace('.', ',')}</p>
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
        document.getElementById("valor-total-carrinho").innerText = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    } catch (e) { console.error("Erro ao renderizar carrinho:", e); }
}

function removerItemCarrinho(index) {
    carrinho.splice(index, 1); 
    localStorage.setItem("carrinho", JSON.stringify(carrinho)); 
    atualizarContador(); 
    renderizarItensCarrinho(); 
}

// ==========================================
// LOGIN, REGISTRO E SISTEMA DE PERFIL
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
            
            showToast("Login realizado com sucesso!", "success");
            // Delay para dar tempo de ler o Toast verde antes de atualizar a página
            setTimeout(() => { location.reload(); }, 1500); 
        } else {
            showToast("E-mail ou senha incorretos! Verifique também o perfil escolhido.", "error");
        }
    } catch (erro) { showToast("Erro ao conectar com o servidor.", "error"); }
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
            showToast("Conta criada com sucesso! Você já pode fazer login.", "success");
            voltarSelecao(); 
        } else {
            const erro = await res.json();
            showToast("Erro: " + (erro.erro || "Falha ao cadastrar."), "error");
        }
    } catch (erro) { showToast("Erro de conexão com o servidor.", "error"); } 
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

async function salvarFotoPerfil() {
    const inputFoto = document.getElementById("foto-perfil");
    if (!inputFoto || inputFoto.files.length === 0) {
        showToast("Por favor, clique em 'Trocar Foto' para escolher uma imagem.", "warning");
        return;
    }

    const usuarioJson = localStorage.getItem("usuarioAtivo");
    const session = JSON.parse(usuarioJson);
    const userObj = session.usuario ? session.usuario : session;
    const idUser = userObj.codusuario || userObj.id;

    if (!idUser) { showToast("Erro de autenticação. Faça login novamente.", "error"); return; }

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
            showToast("Foto de perfil atualizada com sucesso!", "success");
            // Espera o aviso para atualizar a página
            setTimeout(() => { location.reload(); }, 1500); 
        } else { showToast("Erro ao atualizar foto. Tente novamente.", "error"); }
    } catch(err) { showToast("Erro de conexão ao tentar salvar a foto.", "error"); } 
    finally { btnSalvar.innerText = textoOriginal; btnSalvar.disabled = false; }
}

// Lógica de Confirmação de Saída da Conta (Deslogar)
function sairConta() {
    // Esconde o modal de perfil e abre o modal de confirmação
    document.getElementById("modal-perfil").style.display = "none";
    document.getElementById("modal-confirmacao-sair").style.display = "block";
}

function fecharModalSair() {
    document.getElementById("modal-confirmacao-sair").style.display = "none";
}

function confirmarSaida() {
    localStorage.removeItem("usuarioAtivo");
    localStorage.removeItem("carrinho");
    window.location.href = "/index.html"; 
}

/* ============================================================
   FUNÇÃO DE NOTIFICAÇÃO (TOAST) - ESTILO FREESE STORE
   ============================================================ */
function showToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const config = {
        'success': { icone: 'fa-check', titulo: 'SUCESSO', cor: '#10b981' },        
        'error':   { icone: 'fa-times', titulo: 'ERRO', cor: 'var(--premium-red)' }, 
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
