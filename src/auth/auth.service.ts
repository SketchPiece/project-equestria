import { ConflictException, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { JWT_EXPIRES_IN } from 'src/constants'
import { User } from 'src/models/user.entity'
import { UserService } from 'src/user/user.service'
import { createHmac } from 'crypto'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.getOne(username)
    const cryptoPass = createHmac('sha256', pass).digest('hex')
    if (user && user.password === cryptoPass) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user
      return result
    }
    return null
  }

  async validateUserById(userId) {
    return await this.usersService.getById(userId)
  }

  async login(user: User) {
    const payload = { username: user.username, sub: user.id }
    return {
      token: this.jwtService.sign(payload),
      exp: Date.now() + JWT_EXPIRES_IN * 1000,
      username: user.username,
    }
  }

  async register(user: User) {
    const newUser = await this.usersService.create(user)
    if (!newUser) throw new ConflictException()
    const payload = { username: newUser.username, sub: newUser.id }
    return {
      token: this.jwtService.sign(payload),
      exp: Date.now() + JWT_EXPIRES_IN * 1000,
      username: newUser.username,
    }
  }
}
