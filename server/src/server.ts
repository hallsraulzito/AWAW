
import "dotenv/config"; // precisa ser o PRIMEIRO import: carrega o .env
import dns from "dns";
import express from "express";
import cors from "cors";
import { conectarBanco } from "./db";
import authRoutes from "./routes/auth";
import artistasRoutes from "./routes/artistas";
import conversasRoutes from "./routes/conversas";
import { propostaRouter, conversaRouter } from "./routes/propostas";
import postsRoutes from "./routes/posts";
import uploadRoutes, { PASTA_UPLOADS } from "./routes/upload";

// Utiliza DNS explícito para resolver o endereço do MongoDB Atlas
dns.setServers(["1.1.1.1"]);

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/saude", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/artistas", artistasRoutes);
app.use("/api/conversas", conversasRoutes);
app.use("/api/conversas", conversaRouter);
app.use("/api/propostas", propostaRouter);
app.use("/api/posts", postsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static(PASTA_UPLOADS));

const porta = Number(process.env.PORT) || 3001;

conectarBanco()
  .then(() => app.listen(porta, () => console.log(`API rodando em http://localhost:${porta}`)))
  .catch((erro) => {
    console.error("Falha ao conectar no MongoDB:", erro.message);
    process.exit(1);
  });
