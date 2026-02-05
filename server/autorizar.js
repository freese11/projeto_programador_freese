// ler a chave secreta do arquivo .env
const api_key = process.env.API_KEY_SECRET;

let contador = 0;

function autenticarAPIkey(req, res, next) {

    // 🔓 LIBERAR CONSULTA DE PRODUTOS (loja pública)
    if (req.method === "GET" && req.originalUrl.startsWith("/produtos")) {
        return next();
    }

    const api_key_front = req.header("minha-chave");

    if (api_key_front && api_key_front === api_key) {
        console.log("✅ Acesso autorizado");
        contador++;
        console.log("contador de acessos:", contador);
        next();
    } else {
        console.log("❌ Acesso negado");
        return res.status(401).json({
            mensagem: "Acesso negado! Chave inválida."
        });
    }
}

module.exports = autenticarAPIkey;
