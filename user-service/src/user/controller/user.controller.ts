import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserBody } from "../types/table.types/register.userBody.js";
import {
  InvalidCredentials,
  UserAlreadyExistsEmail,
  UserAlreadyExistsUsername,
  UserNotFound,
} from "../errors/user.errors.js";
import { userParam } from "../types/req.type/params.types.js";

export async function createUserHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userService = req.server.userService;
    const result = await userService!.createUser(req.body as registerUserBody);
    return reply.code(201).send(result);
  } catch (error) {
    req.log.error(error);
    if (
      error instanceof UserAlreadyExistsEmail ||
      error instanceof UserAlreadyExistsUsername
    ) {
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    }
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userService = req.server.userService;
    const result = await userService!.loginUserService(req.body);
    return reply.code(200).send(result);
  } catch (error) {
    req.log.error(error);
    if (error instanceof UserNotFound || error instanceof InvalidCredentials) {
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    }
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}

export async function getUserById(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userRepo = req.server.userRepo;
    const user: any = userRepo?.getFullTableById((req.params as userParam).id);
    if (!user) throw new UserNotFound();
    const { full_name, avatar_url, bio, ...userFields } = user;
    const userData = {
      ...userFields,
      profile: { full_name, avatar_url, bio },
    };
    return reply.code(200).send({ success: true, user: userData });
  } catch (error) {
    if (error instanceof UserNotFound)
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}

export async function getUserByEmail(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userRepo = req.server.userRepo;
    const user: any = userRepo?.getFullTableByEmail(
      (req.params as userParam).email
    );
    if (!user) throw new UserNotFound();
    const { full_name, avatar_url, bio, ...userFields } = user;
    const userData = {
      ...userFields,
      profile: { full_name, avatar_url, bio },
    };
    return reply.code(200).send({ success: true, user: userData });
  } catch (error) {
    if (error instanceof UserNotFound)
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}

export async function getUserByUsername(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userRepo = req.server.userRepo;
    const user: any = userRepo?.getFullTableByUsername(
      (req.params as userParam).username
    );
    if (!user) throw new UserNotFound();
    const { full_name, avatar_url, bio, ...userFields } = user;
    const userData = {
      ...userFields,
      profile: { full_name, avatar_url, bio },
    };
    return reply.code(200).send({ success: true, user: userData });
  } catch (error) {
    if (error instanceof UserNotFound)
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}
