import { ClientProvider } from '../ClientProvider';
import { Settlement } from '../../src/Model/Settlement/Settlement';

export class SettlementRequests {
  public async getSettlement() {
    const client = ClientProvider.create();

    return await client.getSettlement('someSettlementId');
  }

  public async getSettlementsByFilters() {
    const client = ClientProvider.create();

    const params = {
      startDate: '2021-05-10',
      endDate: '2021-05-12',
      status: 'processing',
      limit: 100,
      offset: 0
    };

    return await client.getSettlements(params);
  }

  public async fetchReconciliationReport() {
    const client = ClientProvider.create();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const settlement = new Settlement();

    return await client.getSettlementReconciliationReport('settlementId', 'settlementToken');
  }
}
