import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { User } from 'src/models/user.entity'
import { AuthService } from './auth.service'
import { LocalAuthGuard } from './local-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.authService.login(req.user)
  }

  @Post('register')
  async register(@Body() user: User) {
    return this.authService.register(user)
  }
}
