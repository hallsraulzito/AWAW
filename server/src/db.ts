import mongoose from "mongoose";

let conexaoEmAndamento: Promise<typeof mongoose> | null = null;

export async function conectarBanco() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI não definido nas variáveis de ambiente.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (
    mongoose.connection.readyState === 0 ||
    mongoose.connection.readyState === 3
  ) {
    conexaoEmAndamento = null;
  }

  if (!conexaoEmAndamento) {
    conexaoEmAndamento = mongoose.connect(uri).catch((erro) => {
      conexaoEmAndamento = null;
      throw erro;
    });
  }

  return conexaoEmAndamento;
}
