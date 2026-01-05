import { createApp } from "./app.module";

async function bootstrap() {
  const app = await createApp();
  await app.listen(3000);
  console.log('API listening on http://localhost:3000');
}

bootstrap();
