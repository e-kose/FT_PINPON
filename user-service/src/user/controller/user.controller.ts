import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserBody } from "../types/table.types/register.userBody.js";
import {
  BadRequest,
  InvalidCredentials,
  UserAlreadyExistsEmail,
  UserAlreadyExistsUsername,
  UserNotFound,
} from "../errors/user.errors.js";
import { userParam } from "../types/req.type/params.types.js";
import { UserRepository } from "../repository/user.repository.js";
import { logError } from "../utils/log.utils.js";

export async function createUserHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userService = req.server.userService;
    const result = await userService!.createUser(req.body as registerUserBody);
    return reply.code(201).send(result);
  } catch (error) {
    logError(req.server, req, error);
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
    const { password, ...user } = result;
    return reply.code(200).send({
      ...user,
      success: true,
      message: "User successfully logged in",
    });
  } catch (error) {
    logError(req.server, req, error);
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
    const { user_id, full_name, avatar_url, bio, ...userFields } = user;
    const userData = {
      ...userFields,
      profile: { user_id, full_name, avatar_url, bio },
    };
    return reply.code(200).send({ success: true, user: userData });
  } catch (error) {
    logError(req.server, req, error);
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
    const { user_id, full_name, avatar_url, bio, ...userFields } = user;
    const userData = {
      ...userFields,
      profile: { user_id, full_name, avatar_url, bio },
    };
    return reply.code(200).send({ success: true, user: userData });
  } catch (error) {
    logError(req.server, req, error);
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
    const { user_id, full_name, avatar_url, bio, ...userFields } = user;
    const userData = {
      ...userFields,
      profile: { user_id, full_name, avatar_url, bio },
    };
    return reply.code(200).send({ success: true, user: userData });
  } catch (error) {
    logError(req.server, req, error);
    if (error instanceof UserNotFound)
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}

export async function updateUserHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: Record<string, any> }>,
  reply: FastifyReply
) {
  try {
    const id = +req.headers["x-user-id"]!;
    const data = req.body;
    const userRepo = req.server.userRepo as UserRepository;
    const result = userRepo.updateUser(id, data);
    if (result) {
      return reply.send({ success: true, message: "User updated" });
    } else {
      throw new UserNotFound();
    }
  } catch (error) {
    logError(req.server, req, error);
    if (error instanceof UserNotFound)
      return reply
        .code(error.statusCode)
        .send({ succcess: false, message: error.message });
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}

export async function updateAvatarHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const id = +req.headers["x-user-id"]!;
    if (!req.isMultipart()) {
      return reply
        .code(406)
        .send({
          success: false,
          message: "Request must be multipart/form-data",
        });
    }
    const user = req.server.userRepo?.getUserById(id);
    if (!user) throw new UserNotFound();
    const result = await req.server.userService!.avatarUpdateService(req, id);
    reply.send(result);
  } catch (error) {
    console.error("❌ Avatar upload error:", error);
    logError(req.server, req, error);
    if (error instanceof BadRequest || error instanceof UserNotFound)
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred", error: error instanceof Error ? error.message : String(error) });
  }
}

export async function updateUserPassword(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const id = +req.headers["x-user-id"]!;
    const user = req.server.userRepo?.getUserById(id);
    if (!user) throw new UserNotFound();
    const res = await req.server.userService!.updatePassword(req, id);
    return reply
      .code(200)
      .send({
        success: true,
        message: "The password has been successfully changed.",
      });
  } catch (error) {
    logError(req.server, req, error);
    if (error instanceof InvalidCredentials || error instanceof UserNotFound)
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}

export async function deleteUserHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const id = +req.headers["x-user-id"]!;
    const userRepo = req.server.userRepo as UserRepository;
    const result = userRepo.deleteUser(id);
    if (result && result.changes > 0) {
      return reply.send({ success: true, message: "User deleted" });
    } else {
      throw new UserNotFound();
    }
  } catch (error) {
    logError(req.server, req, error);
    if (error instanceof UserNotFound)
      return reply
        .code(error.statusCode)
        .send({ success: false, message: error.message });
    return reply
      .code(500)
      .send({ success: false, message: "An error has occurred" });
  }
}
