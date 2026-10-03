import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin client for the Steadfast courier REST API.
 * Docs/base: https://portal.packzy.com/api/v1 — auth via Api-Key + Secret-Key.
 */
@Injectable()
export class SteadfastService {
  private readonly logger = new Logger(SteadfastService.name);

  constructor(private readonly config: ConfigService) {}

  private base() {
    return (this.config.get<string>('STEADFAST_BASE_URL') || 'https://portal.packzy.com/api/v1').replace(/\/+$/, '');
  }

  private headers(): Record<string, string> {
    const ak = this.config.get<string>('STEADFAST_API_KEY');
    const sk = this.config.get<string>('STEADFAST_SECRET_KEY');
    if (!ak || !sk) throw new BadRequestException('Steadfast API credentials not configured.');
    return { 'Api-Key': ak, 'Secret-Key': sk, 'Content-Type': 'application/json' };
  }

  private async call(path: string, init?: RequestInit) {
    const res = await fetch(`${this.base()}${path}`, { ...init, headers: { ...this.headers(), ...(init?.headers ?? {}) } });
    const text = await res.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      this.logger.warn(`Steadfast ${path} → ${res.status}: ${text}`);
      const msg = (data?.message as string) || `Steadfast request failed (${res.status}).`;
      throw new BadRequestException(msg);
    }
    return data ?? {};
  }

  balance() {
    return this.call('/get_balance');
  }

  async createConsignment(input: {
    invoice: string;
    name: string;
    phone: string;
    address: string;
    codAmount: number;
    note?: string;
  }) {
    const body = {
      invoice: input.invoice,
      recipient_name: input.name,
      recipient_phone: input.phone,
      recipient_address: input.address,
      cod_amount: input.codAmount,
      note: input.note ?? '',
    };
    const data = await this.call('/create_order', { method: 'POST', body: JSON.stringify(body) });
    const consignment = (data.consignment as Record<string, unknown>) ?? data;
    return {
      raw: data,
      consignmentId: consignment?.consignment_id != null ? String(consignment.consignment_id) : null,
      trackingCode: (consignment?.tracking_code as string) ?? null,
      status: (consignment?.status as string) ?? null,
    };
  }

  statusByTracking(trackingCode: string) {
    return this.call(`/status_by_trackingcode/${encodeURIComponent(trackingCode)}`);
  }
}
