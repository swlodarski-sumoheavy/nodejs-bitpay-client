import {ClientProvider} from "../ClientProvider";

class LedgerRequests {
  public async getLedgers(): Promise<void> {
    const client = ClientProvider.create();

    const ledgers = await client.getLedgers()
  }

  public async getLedgerEntries(): Promise<void> {
    const client = ClientProvider.create();

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ledgerEntries = await client.getLedgerEntries('USD', oneMonthAgo, tomorrow)
  }
}