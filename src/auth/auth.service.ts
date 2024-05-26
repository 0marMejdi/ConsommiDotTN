import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { JwtService } from "@nestjs/jwt";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { User } from "../users/entities/user.entity";
import * as bcrypt from "bcrypt";
import { LoginCredentialsDTO } from "../users/dto/login-credentials.dto";
import { PayloadInterface } from "./interfaces/payload.interface";
import { Request as ExpressRequest } from "express";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async resolvePayload(req: ExpressRequest): Promise<PayloadInterface> {
    const auth = req.headers.authorization.split(" ").pop();
    console.log(auth);
    return this.jwtService.decode(auth);
  }

  async register(userData: CreateUserDto) {
    let user: User = new User();
    user = { ...user, ...userData };
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(userData.password, salt);
    // TODO : Need to remove the return here just for test purpose
    // ! Warniing
    return await this.usersService.add(user);
  }

  async login(credentials: LoginCredentialsDTO) {
    const { email, password } = credentials;
    const user: User = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        "Wrong login credentials: email not found!",
      );
    }
    console.log("retrieved user from database is: ");
    console.log(user);
    if (!user.password || !bcrypt.compareSync(password, user.password))
      throw new NotFoundException("Wrong login credentials: wrong password");
    const payload: PayloadInterface = {
      email: email,
      role: user.role,
      lastName: user.lastName,
      name: user.name,
      id: user.id,
    };

    const jwt = this.jwtService.sign(payload);
    return {
      Authorization: jwt,
    };
  }
}
