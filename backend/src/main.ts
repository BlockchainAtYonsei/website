import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({ origin: config.getOrThrow<string[]>("CORS_ORIGIN") });
  app.setGlobalPrefix("v1", { exclude: ["health"] });
  app.enableShutdownHooks();

  const port = config.getOrThrow<number>("PORT");
  await app.listen(port);
  console.log(`bay-backend listening on :${port}`);
}

void bootstrap();
