import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Permission, Role } from '../../shared';

import { User } from './user.entity';

export interface UserAuthInfo {
  role: Role;
  permissions: Permission[];
  isActive: boolean;
}

@Injectable()
export class UsersService {
  // In-memory cache of the auth-relevant fields, read on every request by the
  // JWT strategy. Populated lazily and dropped whenever the user is mutated, so
  // permission/role changes take effect without hitting the database each time.
  private readonly authCache = new Map<string, UserAuthInfo>();

  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async getAuthInfo(id: string): Promise<UserAuthInfo | null> {
    const cached = this.authCache.get(id);
    if (cached) {
      return cached;
    }
    const user = await this.findById(id);
    if (!user) {
      return null;
    }
    const info: UserAuthInfo = {
      role: user.role,
      permissions: user.permissions ?? [],
      isActive: user.isActive,
    };
    this.authCache.set(id, info);
    return info;
  }

  private invalidateAuthInfo(id: string): void {
    this.authCache.delete(id);
  }

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
    this.invalidateAuthInfo(id);
  }

  create(data: Partial<User>): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    this.invalidateAuthInfo(id);
    return this.getByIdOrThrow(id);
  }
}
