import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import artistasRoutes from "./routes/artistas.js";
import conversasRoutes from "./routes/conversas.js";
import { propostaRouter, conversaRouter } from "./routes/propostas.js";
import postsRoutes from "./routes/posts.js";
import uploadRoutes from "./routes/upload.js";
import { conectarBanco } from "./db.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(
      (origem): origem is string => Boolean(origem),
    ),
  }),
);

app.use(express.json());

app.get("/api/saude", (_req, res) => {
  res.json({ ok: true });
});

app.use(async (_req, _res, next) => {
  try {
    await conectarBanco();
    next();
  } catch (erro) {
    next(erro);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/artistas", artistasRoutes);
app.use("/api/conversas", conversasRoutes);
app.use("/api/conversas", conversaRouter);
app.use("/api/propostas", propostaRouter);
app.use("/api/posts", postsRoutes);
app.use("/api/upload", uploadRoutes);

export default app;
