import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

type CapiOrder = {
  id: string;
  orderNumber?: number | null;
  total?: number | null;
  amount?: number | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const GRAPH_VERSION = 'v21.0';

function sha256(value?: string | null): string | undefined {
  const v = value?.trim().toLowerCase();
  if (!v) return undefined;
  return createHash('sha256').update(v).digest('hex');
}

/** E.164-ish digits (no leading +/0) as required by Meta for matching. */
function normalizePhoneMeta(raw?: string | null): string {
  const d = (raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('880')) return d;
  if (d.startsWith('0')) return `880${d.slice(1)}`;
  if (d.length === 10) return `880${d}`;
  return d;
}

/**
 * Meta (Facebook) Conversions API. Sends server-side Purchase events for every
 * enabled Facebook pixel that has an access token, with optional advanced
 * matching and a test-event code (for the Events Manager "Test events" tool).
 */
@Injectable()
export class MetaCapiService {
  private readonly logger = new Logger(MetaCapiService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendOrderPurchase(order: CapiOrder) {
    let pixels: { pixelId: string | null; capiToken: string | null; testEventCode: string | null; advancedMatching: boolean }[] = [];
    try {
      pixels = await this.prisma.marketingPixel.findMany({
        where: { enabled: true, provider: 'facebook', NOT: { capiToken: null } },
        select: { pixelId: true, capiToken: true, testEventCode: true, advancedMatching: true },
      });
    } catch {
      return;
    }
    if (!pixels.length) return;

    const user = order.userId
      ? await this.prisma.user
          .findUnique({ where: { id: order.userId }, select: { email: true, phone: true } })
          .catch(() => null)
      : null;
    const email = order.guestEmail || user?.email || null;
    const phone = order.guestPhone || user?.phone || null;

    const value = order.total ?? order.amount ?? 0;
    const eventId = order.orderNumber ? String(order.orderNumber) : order.id;

    for (const p of pixels) {
      if (!p.pixelId || !p.capiToken) continue;
      const user_data: Record<string, string | undefined> = {
        client_ip_address: order.ipAddress ?? undefined,
        client_user_agent: order.userAgent ?? undefined,
      };
      if (p.advancedMatching) {
        const em = sha256(email);
        const ph = sha256(normalizePhoneMeta(phone));
        if (em) user_data.em = em;
        if (ph) user_data.ph = ph;
        if (order.userId) user_data.external_id = sha256(order.userId);
      }

      const body: Record<string, unknown> = {
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            action_source: 'website',
            user_data,
            custom_data: { currency: 'BDT', value, order_id: eventId },
          },
        ],
      };
      if (p.testEventCode) body.test_event_code = p.testEventCode;

      try {
        const res = await fetch(
          `https://graph.facebook.com/${GRAPH_VERSION}/${p.pixelId}/events?access_token=${encodeURIComponent(p.capiToken)}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
        );
        if (!res.ok) this.logger.warn(`Meta CAPI ${p.pixelId} responded ${res.status}`);
      } catch (err) {
        this.logger.warn(`Meta CAPI request failed: ${(err as Error)?.message}`);
      }
    }
  }
}
