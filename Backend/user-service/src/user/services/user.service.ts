import { FastifyInstance, FastifyRequest } from "fastify";
import {
  BadRequest,
  InvalidCredentials,
  UserAlreadyExistsEmail,
  UserAlreadyExistsUsername,
  UserNotFound,
} from "../errors/user.errors.js";
import { UserRepository } from "../repository/user.repository.js";
import { registerUserBody } from "../types/table.types/register.userBody.js";
import { checkHash, hashTransaction } from "../utils/hash.utils.js";
import * as dotenv from "dotenv";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
export class UserService {
  private userRepo: UserRepository;
  constructor(userRepo: UserRepository) {
    this.userRepo = userRepo;
  }

  async createUser(body: registerUserBody) {
    const existingUserByUsername = this.userRepo.getUserByUsername(
      body.username
    );
    if (existingUserByUsername) throw new UserAlreadyExistsUsername();
    const existingUserByEmail = this.userRepo.getUserByEmail(body.email);
    if (existingUserByEmail) throw new UserAlreadyExistsEmail();
    if (body.password) {
      const hashedPass = await hashTransaction(body.password);
      body.password = hashedPass;
    }
    const db = this.userRepo.db;
    const transaciton = db.transaction(() => {
      const userId = this.userRepo.createUser(body);
      if (body.profile) this.userRepo.createProfile(userId, body.profile);
      return { success: true, message: "User successfully created", userId };
    });
    return transaciton();
  }

  async loginUserService(body: any) {
    const result = body.email
      ? this.userRepo.getUserByEmail(body.email!)
      : this.userRepo.getUserByUsername(body.username!);
    if (!result) throw new UserNotFound();
    if (body.password) {
      const checkedPass = await checkHash(body.password, result.password);
      if (!checkedPass) throw new InvalidCredentials();
    }
    return result;
  }

  async avatarUpdateService(req: FastifyRequest, id: number) {
    const app = req.server as FastifyInstance;
    const file = await req.file();
    if (!file) throw new BadRequest("No file uploaded");

    const file_name = `user-${id}-${Date.now()}-${
      file.filename.replace(/\s+/g, "_") || "avatar"
    }`;

    // Use absolute path in container
    const uploadsDir = path.join(process.cwd(), "public/avatars");
    const filePath = path.join(uploadsDir, file_name);

    await fs.mkdir(uploadsDir, { recursive: true });

    await fs.writeFile(filePath, await file.toBuffer());

    const baseUrl = process.env.API_GATEWAY_URL || "http://localhost:3000";
    const url = `${baseUrl}/user/static/avatars/${file_name}`;
    app.userRepo?.updateTable("user_profiles", id, { avatar_url: url });

    return { message: "Avatar updated", avatar_url: url };
  }

  async updatePassword(req: FastifyRequest, id: number) {
    const { oldPass, newPass } = req.body as {
      oldPass: string;
      newPass: string;
    };
    const userPass = this.userRepo.getUserById(id).password;
    const checkedPass = await checkHash(oldPass, userPass);
    if (!checkedPass) throw new InvalidCredentials();
    const hashedPass = await hashTransaction(newPass);
    const res = this.userRepo.updateUser(id, { password: hashedPass });
    return res;
  }
}
