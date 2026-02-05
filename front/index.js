const API_URL = "http://localhost:3000/produtos";
const API_KEY = "SUA_CHAVE_API_AQUI";

const listaProdutos = document.getElementById("lista-produtos");
const contadorCarrinho = document.getElementById("contador-carrinho");

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
atualizarContador();

async function carregarProdutos() {
  const resposta = await fetch(API_URL, {
    headers: {
      "minha-chave": API_KEY
    }
  });

  const produtos = await resposta.json();
  listaProdutos.innerHTML = "";

  produtos.forEach(produto => {

    // valor vem como MONEY (string)

    const div = document.createElement("div");
    div.className = "produto";

    div.innerHTML = `

      <img src="${produto.img}" alt="${produto.nome}"
           onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">

      <h3>${produto.nome}</h3>

    <p class="preco">R$ ${Number(produto.valor).toFixed(2)}</p>
    
      <button onclick="adicionarCarrinho(${produto.codproduto})">
        Adicionar ao carrinho
      </button>
    `;

    listaProdutos.appendChild(div);
  });
}


function adicionarCarrinho(codproduto) {
  const item = carrinho.find(p => p.codproduto === codproduto);

  if (item) {
    item.qtd++;
  } else {
    carrinho.push({ codproduto, qtd: 1 });
  }

  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  atualizarContador();
}

function atualizarContador() {
  const total = carrinho.reduce((soma, p) => soma + p.qtd, 0);
  contadorCarrinho.innerText = total;
}

carregarProdutos();
