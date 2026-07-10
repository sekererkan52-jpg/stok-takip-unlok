import argon2 from "argon2";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";


export async function loginUser(
  username: string,
  password: string
) {

  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);


  if (!user.length) {
    return null;
  }


  const currentUser = user[0];


  if (currentUser.active !== 1) {
    return null;
  }


  const passwordValid = await argon2.verify(
    currentUser.passwordHash,
    password
  );


  if (!passwordValid) {
    return null;
  }


  await db
    .update(users)
    .set({
      lastLogin: new Date(),
    })
    .where(eq(users.id, currentUser.id));


  return {
    id: currentUser.id,
    username: currentUser.username,
    fullName: currentUser.fullName,
    role: currentUser.role,
    storeId: currentUser.storeId,
  };
}