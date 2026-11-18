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
    const history = this.sends.get(key) || [];
    history.push(message);
    this.sends.set(key, history);
    this.allSends.push(message);

    // Persist to Redis so separate child processes (e.g. during kill tests) can be verified
    try {
      const redis = getRedisConnection();
      await redis.hincrby("fake_transport:counts", key, 1);
      await redis.rpush("fake_transport:all", key);
    } catch {
      // Redis might not be available in standalone unit tests
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
