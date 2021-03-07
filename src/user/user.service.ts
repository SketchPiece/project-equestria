import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/models/user.entity'
import { Repository } from 'typeorm'
import { createHmac } from 'crypto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getOne(username: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { username } })
  }

  async getById(id: number): Promise<User | undefined> {
    return await this.userRepository.findOne(id)
  }

  async create(user: User): Promise<User | null> {
    try {
      user.password = createHmac('sha256', user.password).digest('hex')
      return await this.userRepository.save(user)
    } catch {
      return null
    }
  }
}
