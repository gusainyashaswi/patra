import { createHash } from "node:crypto";
import {
  type IMailTransportAdapter,
  type MailMessage,
  type SendResult,
  TransientError,
  PermanentError,
} from "./transport.interface.js";
import { getRedisConnection } from "../lib/redis.js";

export class FakeMailTransport implements IMailTransportAdapter {
  public sends: Map<string, MailMessage[]> = new Map();
  public allSends: MailMessage[] = [];

  private transientFailuresRemaining = 0;
  private permanentFailuresRemaining = 0;

  public failNextWithTransient(count = 1): void {
    this.transientFailuresRemaining = count;
  }

  public failNextWithPermanent(count = 1): void {
    this.permanentFailuresRemaining = count;
  }

  public reset(): void {
    this.sends.clear();
    this.allSends = [];
    this.transientFailuresRemaining = 0;
    this.permanentFailuresRemaining = 0;
  }

  async send(message: MailMessage): Promise<SendResult> {
    if (this.transientFailuresRemaining > 0) {
      this.transientFailuresRemaining--;
      throw new TransientError("Simulated transient error from FakeMailTransport");
    }

    if (this.permanentFailuresRemaining > 0) {
      this.permanentFailuresRemaining--;
      throw new PermanentError("Simulated permanent error from FakeMailTransport");
    }

    const key = message.idempotencyKey;
    const fingerprint = createHash("sha256").update(JSON.stringify(message)).digest("hex");
    // Model the provider's idempotency store, including across worker restarts.
    // The atomic script commits acceptance and our observable send count together.
    const redis = getRedisConnection();
    let accepted: number;
    try {
      accepted = Number(await redis.eval(`
        local previous = redis.call('GET', KEYS[1])
        if previous then
          if previous ~= ARGV[1] then return -1 end
          return 0
        end
        redis.call('SET', KEYS[1], ARGV[1], 'EX', 86400)
        redis.call('HINCRBY', KEYS[2], ARGV[2], 1)
        redis.call('RPUSH', KEYS[3], ARGV[2])
        return 1
      `, 3, `fake_transport:idempotency:${key}`, "fake_transport:counts", "fake_transport:all", fingerprint, key));
    } catch { throw new TransientError("Fake provider idempotency store unavailable"); }
    if (accepted === -1) throw new PermanentError("Idempotency key reused with different email content");
    if (accepted === 1) {
      this.sends.set(key, [message]);
      this.allSends.push(message);
    }

    return {
      providerMessageId: `fake_msg_${key}`,
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }
}

export const fakeTransport = new FakeMailTransport();
