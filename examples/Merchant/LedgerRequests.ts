import { ClientProvider } from '../ClientProvider';
import { LedgerEntryInterface, LedgerInterface } from '../../src/Model';

export class LedgerRequests {
  public async getLedgers(): Promise<LedgerInterface[]> {
    const client = ClientProvider.create();

    return await client.getLedgers();
  }

  public async getLedgerEntries(): Promise<LedgerEntryInterface[]> {
    const client = ClientProvider.create();

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await client.getLedgerEntries('USD', oneMonthAgo, tomorrow);
  }
}
