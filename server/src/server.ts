import "dotenv/config";
import { conectarBanco } from "./db.js";
import app from "./app.js";
import dns from "node:dns";

dns.setServers(["1.1.1.1"]);

const porta = Number(process.env.PORT) || 3001;

conectarBanco()
  .then(() => {
    app.listen(porta, () => {
      console.log(`API rodando em http://localhost:${porta}`);
    });
  })
  .catch((erro) => {
    console.error("Falha ao conectar no MongoDB:", erro.message);
    process.exit(1);
  });
