import {ClientProvider} from "../ClientProvider";
import {Settlement} from "../../src/Model/Settlement/Settlement";

class SettlementRequests {
  public async getSettlement(): Promise<void> {
    const client = ClientProvider.create();

    // Get one settlement
    const settlement = await client.getSettlement('someSettlementId');

    // Get settlements by filter
    const params = {
      startDate: '2021-05-10',
      endDate: '2021-05-12',
      status: 'processing',
      limit: 100,
      offset: 0
    };
    const settlements = await client.getSettlements(params)
  }

  public async fetchReconciliationReport(): Promise<void> {
    const client = ClientProvider.create();

    const settlement = new Settlement();

    const result = await client.getSettlementReconciliationReport('settlementId', 'settlementToken');
  }
}