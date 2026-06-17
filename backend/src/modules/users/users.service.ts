import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  /** Includes password hash + tokens (normally `select: false`). For auth use only. */
  findByUsernameWithSecrets(username: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect(['u.passwordHash', 'u.activationToken', 'u.resetToken'])
      .where('u.username = :username', { username })
      .getOne();
  }

  findByEmailWithSecrets(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect(['u.passwordHash', 'u.activationToken', 'u.resetToken'])
      .where('u.email = :email', { email })
      .getOne();
  }

  /** Finds a user by a (normally hidden) token column. For auth flows only. */
  findBySecret(column: 'activationToken' | 'resetToken', value: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect([`u.${column}`])
      .where(`u.${column} = :value`, { value })
      .getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async getByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  create(data: Partial<User>): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    return this.getByIdOrThrow(id);
  }
}
