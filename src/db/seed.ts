import "dotenv/config";
import { client } from "./index";

async function main() {
  console.log(
    "Seed inicial pendiente: los usuarios y datos de prueba se incorporan a partir de la Etapa 2 y la Etapa 6."
  );
}

main()
  .catch((error) => {
    console.error("Error al ejecutar seed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    client.close();
  });
