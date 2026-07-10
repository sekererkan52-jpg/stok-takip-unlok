import "dotenv/config";
import argon2 from "argon2";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const passwordHash = await argon2.hash("Ecs2023--**");

  await db.insert(users).values({
    username: "erkan",
    fullName: "Erkan Şeker",
    passwordHash,
    role: "admin",
    active: 1,
    mustChangePassword: 1,
  });

  console.log("✅ Admin kullanıcısı oluşturuldu.");
}

main().catch(console.error);