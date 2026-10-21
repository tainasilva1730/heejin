import express from 'express';
import cors from 'cors';
import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


const app = express();
const PORT = process.env.PORT || 5500;
const URL_API = "https://api.groq.com/openai/v1/chat/completions";

const MODELO = "openai/gpt-oss-120b";

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const usuarios = [];


app.post('/cadastro', (req, res) => {
    const { usuario, email, senha } = req.body;

    if (!usuario || !email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos!" });
    }

    if (senha.length < 6) {
        return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres!" });
    }

    const emailExiste = usuarios.find((busca) => busca.email.toLowerCase() === email.toLowerCase());

    if (emailExiste) {
        return res.status(409).json({ erro: "E-mail já cadastrado!" });
    }

    usuarios.push({ usuario, email, senha });
    console.log("Usuários no sistema:", usuarios);

    return res.status(201).json({ mensagem: "Cadastro realizado com sucesso!" });
});


app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "Preencha e-mail e senha para entrar!" });
    }

    const usuarioEncontrado = usuarios.find((busca) => busca.email.toLowerCase() === email.toLowerCase());

    if (!usuarioEncontrado || usuarioEncontrado.senha !== senha) {
        return res.status(401).json({ erro: "E-mail ou senha incorretos!" });
    }

    return res.json({
        mensagem: "Login realizado com sucesso!",
        usuario: usuarioEncontrado.usuario
    });
});


app.post('/chat', async (req, res) => {
    try {
        const API_KEY = process.env.GROQ_API_KEY;
        const historico = req.body.historico || [];

        const persona = [
            {
                role: "system",
                content: `Você é a HEEJIN, do ARTMS. responda de amigável, curta e bem humorada`
            }
        ];

       
        persona.push(...historico);

        const respostaBruta = await fetch(URL_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODELO,
                messages: persona
            })
        });

        const resultado = await respostaBruta.json();

        if (!respostaBruta.ok) {
            console.log(" Erro retornado pela Groq:", resultado);
            return res.status(500).json({ erro: "Erro na comunicação com a Groq." });
        }

        return res.json({ resposta: resultado.choices[0].message.content });

    } catch (erro) {
        return res.status(500).json({ erro: "Falha interna no servidor." });
    }
});

app.listen(PORT, () => {
    console.log(` Servidor rodando `);
   
});