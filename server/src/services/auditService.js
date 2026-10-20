import { AuditLog } from '../models/AuditLog.js';

export const logAuditEvent = async ({
  req,
  actorId = null,
  actorName = 'System',
  actorRole = 'SYSTEM',
  action,
  resourceType,
  resourceId = '',
  outcome = 'SUCCESS',
  reason = '',
  metadata = {},
}) => {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    const userAgent = req?.headers?.['user-agent'] || '';
    const correlationId = req?.headers?.['x-correlation-id'] || `corr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const currentActorId = actorId || req?.user?._id || null;
    const currentActorName = actorName !== 'System' ? actorName : (req?.user?.fullName || 'System');
    const currentActorRole = actorRole !== 'SYSTEM' ? actorRole : (req?.user?.role || 'SYSTEM');

    await AuditLog.create({
      actorId: currentActorId,
      actorName: currentActorName,
      actorRole: currentActorRole,
      action,
      resourceType,
      resourceId: String(resourceId),
      outcome,
      reason,
      correlationId,
      ipAddress,
      userAgent,
      metadata,
    });
  } catch (error) {
    // Non-blocking for high availability, but logged to stderr
    console.error(`[AUDIT ERROR] Failed to record audit log: ${error.message}`);
  }
};

