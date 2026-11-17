import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { exigirLogin } from "../middleware/auth";

// Pasta onde as imagens ficam (server/uploads). O server.ts a serve em /uploads.
export const PASTA_UPLOADS = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(PASTA_UPLOADS, { recursive: true });

// A extensão vem do TIPO do arquivo, não do nome que o usuário mandou
// (o nome poderia ser "virus.exe.png").
const EXTENSOES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: PASTA_UPLOADS,
    filename: (_req, arquivo, cb) => cb(null, randomUUID() + EXTENSOES[arquivo.mimetype]),
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 4 }, // 8 MB por imagem, no máx. 4
  fileFilter: (_req, arquivo, cb) => cb(null, arquivo.mimetype in EXTENSOES),
});

const router = Router();

// POST /api/upload  (multipart/form-data, campo "imagens")
router.post("/", exigirLogin, (req, res) => {
  upload.array("imagens", 4)(req, res, (erro) => {
    if (erro) return res.status(400).json({ erro: "Imagem inválida ou maior que 8 MB." });
    const arquivos = (req.files as Express.Multer.File[]) || [];
    if (arquivos.length === 0) {
      return res.status(400).json({ erro: "Envie imagens JPG, PNG, WEBP ou GIF." });
    }
    res.status(201).json({ urls: arquivos.map((a) => `/uploads/${a.filename}`) });
  });
});

export default router;
