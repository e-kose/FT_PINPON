import { FastifyInstance } from "fastify";
import {
  createUserHandler,
  deleteUserHandler,
  getUserByEmail,
  getUserById,
  getUserByUsername,
  login,
  updateAvatarHandler,
  updateUserHandler,
} from "../controller/user.controller.js";
import { registerUserSchema } from "../schemas/register.user.schema.js";
import { loginUserSchema } from "../schemas/login.user.schema.js";
import { deleteUserSchema } from "../schemas/delete.user.schema.js";
import { updateUserSchema } from "../schemas/update.user.schema.js";
import { getUserSchema } from "../schemas/get.user.schema.js";

const createSchema = (summary: string, schema: any) => ({
  tags: ["User"],
  summary,
  ...schema,
});

export async function userRoute(app: FastifyInstance) {
  app.post(
    "/internal/user",
    { preHandler: [], schema: createSchema("User create", registerUserSchema) },
    createUserHandler
  );
  app.post(
    "/internal/login",
    { preHandler: [], schema: createSchema("User login", loginUserSchema) },
    login
  );

  app.get(
    "/user/id/:id",
    { schema: createSchema("Get user by id", getUserSchema) },
    getUserById
  );
  app.get(
    "/user/email/:email",
    { schema: createSchema("Get user by email", getUserSchema) },
    getUserByEmail
  );
  app.get(
    "/user/username/:username",
    { schema: createSchema("Get user by username", getUserSchema) },
    getUserByUsername
  );

  app.patch(
    "/user",
    { schema: createSchema("User update", updateUserSchema) },
    updateUserHandler
  );

  app.patch("/user/avatar", updateAvatarHandler);

  app.delete(
    "/user",
    { schema: createSchema("User delete", deleteUserSchema) },
    deleteUserHandler
  );
}
