import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "./entities/user.entity";
import * as bcrypt from "bcrypt";
import { Role } from "../enum/user-role.enum";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class UsersService {
  constructor(@InjectModel("User") private readonly userModel: Model<User>) {}

  /**
   * adds a User object into the database

   * @param user : User must be a User object, id and _id should not be provided
   */
  async add(user: User) {
    const userDocument = new this.userModel(user);
    userDocument.id = userDocument._id.toString();
    return await userDocument.save();
  }

  async findByEmail(email: string): Promise<User> {
    return User.fromDoc(
      await this.userModel.findOne({ email: email }).lean().exec(),
    );
  }

  async findAll(transform: boolean = true): Promise<User[]> {
    const users = await this.userModel.find().lean().exec();
    if (transform || true) return users.map((doc) => User.fromDoc(doc));
  }

  async findOne(id: string): Promise<User> {
    console.log(id);
    if (!id) {
      throw new BadRequestException("Id should be Provided");
    }
    const userDoc = await this.userModel.findById(id).lean().exec();

    return User.fromDoc(userDoc);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    //verify the user exist
    await this.verifyUserExsitance(id);

    return await this.userModel
      .findOneAndUpdate({ id: id }, updateUserDto)
      .lean()
      .exec();
  }

  async remove(id: string) {
    //verify the user exist
    await this.verifyUserExsitance(id);

    return await this.userModel.findOneAndDelete({ id: id }).lean().exec();
  }

  async verifyUserExsitance(id: string): Promise<void> {
    const finduser: User = await this.findOne(id);
    if (!Boolean(finduser)) throw new NotFoundException("user not found");
  }

  async changeRole(userId: string, grant: boolean) {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException("user doesn't not exist");
    return this.userModel
      .findOneAndUpdate(
        { id: userId },
        {
          role: grant ? Role.MERCHANT : Role.CONSUMER,
        },
      )
      .lean()
      .exec();
  }

  async getAllSellers() {
    const users = await this.userModel
      .find({ role: Role.MERCHANT })
      .lean()
      .exec();
    return User.fromArray(users);
  }

  async changePassword(user: User, changePasswordDto: ChangePasswordDto) {
    let u = await this.findOne(user.id);
    const isSame = await bcrypt.compare(changePasswordDto.password, u.password);
    if (!isSame) throw new ForbiddenException("Old password is not correct");
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      salt,
    );
    await this.userModel
      .findByIdAndUpdate(user.id, { password: hashedPassword })
      .lean()
      .exec();
  }
}
