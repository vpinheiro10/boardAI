// index.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = "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";
const ASSISTANT_ID = "asst_y05DnEGepFuFAtF4l9OTujzR";

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Mensagem não fornecida." });

  try {
    console.log("Criando thread...");
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const thread = await threadRes.json();
    console.log("Thread criada:", thread);

    console.log("Enviando mensagem...");
    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "user",
        content: userMessage,
      }),
    });

    console.log("Iniciando execução...");
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assistant_id: ASSISTANT_ID }),
    });
    const run = await runRes.json();
    console.log("Run iniciada:", run);

    let status = "queued", runData;
    console.log("Aguardando execução...");
    do {
      await new Promise((r) => setTimeout(r, 1500));
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });
      runData = await statusRes.json();
      status = runData.status;
      console.log("Status atual:", status);
    } while (status !== "completed");

    console.log("Buscando mensagens...");
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });
    const messages = await messagesRes.json();
    console.log("Mensagens recebidas:", JSON.stringify(messages, null, 2));

    const reply = messages?.data?.find((m) => m.role === "assistant")?.content?.[0]?.text?.value || "Sem resposta.";

    res.json({ reply });
  } catch (error) {
    console.error("Erro no backend:", error);
    res.status(500).json({ error: "Erro ao processar a requisição." });
  }
});

app.get("/", (req, res) => {
  res.send("Backend do Bot da Ética e-Core está online.");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
