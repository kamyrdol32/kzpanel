import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

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
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  listAll(): Promise<User[]> {
    return this.repo.createQueryBuilder('u').orderBy('u.createdAt', 'DESC').getMany();
  }

  setActive(id: string, isActive: boolean): Promise<User> {
    return this.update(id, { isActive });
  }

  setPermissions(id: string, permissions: import('../../shared').Permission[]): Promise<User> {
    return this.update(id, { permissions });
  }

  async remove(id: string, callerId: string): Promise<void> {
    if (id === callerId) {
      throw new BadRequestException('Cannot delete your own account');
    }
    await this.getByIdOrThrow(id);
    await this.repo.delete(id);
  }

  create(data: Partial<User>): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    return this.getByIdOrThrow(id);
  }
}
