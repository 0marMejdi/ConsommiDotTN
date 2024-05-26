import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";

import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "src/users/users.module";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

// @Global()
@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt",
    }),
    JwtModule.register({
      global: true,
      secret: "0xDeadBeef",
      signOptions: { expiresIn: 3600 * 24 * 7 },
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtAuthGuard, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
