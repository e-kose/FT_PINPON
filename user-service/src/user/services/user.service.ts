import {
	InvalidCredentials,
  UserAlreadyExistsEmail,
  UserAlreadyExistsUsername,
  UserNotFound,
} from "../errors/user.errors";
import { UserRepository } from "../repository/user.repository";
import { registerUserBody } from "../types/table.types/register.userBody";
import { checkHash, hashTransaction } from "../utils/hash.utils";

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
    const hashedPass = await hashTransaction(body.email);
    body.password = hashedPass;
    const db = this.userRepo.db;
    const transaciton = db.transaction(() => {
      const userId = this.userRepo.createUser(body);
      this.userRepo.createProfile(userId, body.profile);
      return { success: true, message: "User successfully created", userId };
    });
    return transaciton();
  }

  async loginUserService(body: any) {
    const result = body.email
      ? this.userRepo.getUserByEmail(body.email!)
      : this.userRepo.getUserByUsername(body.username!);
    if (!result) throw new UserNotFound();
    const checkedPass = await checkHash(body.password, result.password);
    if (!checkedPass) throw new InvalidCredentials();
	
}
