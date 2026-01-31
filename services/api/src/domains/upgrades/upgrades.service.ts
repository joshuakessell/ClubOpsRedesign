import { Injectable } from '@nestjs/common';
import type { Kysely, Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import { AuditService } from '../audit/audit.service';
import { UpgradesRepository } from './upgrades.repository';
import type { CreateUpgradeOfferRequestDto } from './dto/upgrade-requests.dto';
import type { UpgradeOfferDto, UpgradeStatus } from './dto/upgrade.dto';
import { throwConflict, throwNotFound, throwValidation } from '../../platform/http/errors';
import { isUniqueViolation } from '../../platform/database/pg-errors';

@Injectable()
export class UpgradesService {
  constructor(
    private readonly upgradesRepository: UpgradesRepository,
    private readonly auditService: AuditService
  ) {}

  async createOfferInTransaction(
    db: Kysely<Database>,
    request: CreateUpgradeOfferRequestDto,
    actor: { staffId: string; deviceId: string }
  ): Promise<Selectable<Database['upgrade_offers']>> {
    if (!request.visitId || !request.fromInventoryItemId) {
      throwValidation('visitId and fromInventoryItemId are required');
    }
    if (!['room', 'locker'].includes(request.toInventoryType)) {
      throwValidation('toInventoryType must be room or locker');
    }
    const expiresAt = new Date(request.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throwValidation('expiresAt must be a valid ISO timestamp');
    }

    try {
      const offer = await this.upgradesRepository.create(db, {
        visit_id: request.visitId,
        from_inventory_item_id: request.fromInventoryItemId,
        to_inventory_type: request.toInventoryType,
        status: 'PENDING',
        expires_at: expiresAt,
        created_at: new Date(),
      });

      await this.auditService.write(
        {
          action: 'UPGRADE_OFFERED',
          entityType: 'upgrade_offer',
          entityId: offer.id,
          actorStaffId: actor.staffId,
          actorDeviceId: actor.deviceId,
          metadata: {
            visitId: offer.visit_id,
            toInventoryType: offer.to_inventory_type,
          },
        },
        db
      );

      return offer;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throwConflict('Upgrade offer already exists', 'UPGRADE_ALREADY_DECIDED');
      }
      throw error;
    }
  }

  async findByIdForUpdate(db: Kysely<Database>, offerId: string) {
    return this.upgradesRepository.findByIdForUpdate(db, offerId);
  }

  async ensurePending(
    db: Kysely<Database>,
    offer: Selectable<Database['upgrade_offers']>,
    actor: { staffId: string; deviceId: string }
  ): Promise<void> {
    if (offer.status === 'EXPIRED') {
      throwConflict('Upgrade offer expired', 'UPGRADE_EXPIRED');
    }
    if (offer.status !== 'PENDING') {
      throwConflict('Upgrade offer already decided', 'UPGRADE_ALREADY_DECIDED');
    }
    if (offer.expires_at.getTime() <= Date.now()) {
      await this.markExpired(db, offer, actor);
      throwConflict('Upgrade offer expired', 'UPGRADE_EXPIRED');
    }
  }

  async markAccepted(
    db: Kysely<Database>,
    offerId: string,
    actor: { staffId: string; deviceId: string }
  ): Promise<Selectable<Database['upgrade_offers']>> {
    const next = await this.upgradesRepository.update(db, offerId, { status: 'ACCEPTED' });
    if (!next) {
      throwNotFound('Upgrade offer not found', 'UPGRADE_NOT_FOUND');
    }

    await this.auditService.write(
      {
        action: 'UPGRADE_ACCEPTED',
        entityType: 'upgrade_offer',
        entityId: offerId,
        actorStaffId: actor.staffId,
        actorDeviceId: actor.deviceId,
        metadata: {
          visitId: next.visit_id,
        },
      },
      db
    );

    return next;
  }

  async markDeclined(
    db: Kysely<Database>,
    offerId: string,
    actor: { staffId: string; deviceId: string }
  ): Promise<Selectable<Database['upgrade_offers']>> {
    const next = await this.upgradesRepository.update(db, offerId, { status: 'DECLINED' });
    if (!next) {
      throwNotFound('Upgrade offer not found', 'UPGRADE_NOT_FOUND');
    }

    await this.auditService.write(
      {
        action: 'UPGRADE_DECLINED',
        entityType: 'upgrade_offer',
        entityId: offerId,
        actorStaffId: actor.staffId,
        actorDeviceId: actor.deviceId,
        metadata: {
          visitId: next.visit_id,
        },
      },
      db
    );

    return next;
  }

  async markExpired(
    db: Kysely<Database>,
    offer: Selectable<Database['upgrade_offers']>,
    actor: { staffId: string; deviceId: string }
  ): Promise<void> {
    const updated = await this.upgradesRepository.update(db, offer.id, { status: 'EXPIRED' });
    if (!updated) {
      throwNotFound('Upgrade offer not found', 'UPGRADE_NOT_FOUND');
    }

    await this.auditService.write(
      {
        action: 'UPGRADE_EXPIRED',
        entityType: 'upgrade_offer',
        entityId: offer.id,
        actorStaffId: actor.staffId,
        actorDeviceId: actor.deviceId,
        metadata: {
          visitId: offer.visit_id,
        },
      },
      db
    );
  }

  toDto(row: Selectable<Database['upgrade_offers']>): UpgradeOfferDto {
    return {
      id: row.id,
      visitId: row.visit_id,
      fromInventoryItemId: row.from_inventory_item_id,
      toInventoryType: row.to_inventory_type,
      status: row.status as UpgradeStatus,
      expiresAt: row.expires_at.toISOString(),
      createdAt: row.created_at.toISOString(),
    };
  }
}
