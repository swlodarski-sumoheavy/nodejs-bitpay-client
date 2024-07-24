import { ClientProvider } from '../ClientProvider';
import { Payout } from '../../src/Model';
import { PayoutStatus } from '../../src';

export class PayoutRequests {
  public async createPayout() {
    const client = ClientProvider.create();

    const payout = new Payout(12.34, 'USD', 'USD');
    payout.notificationEmail = 'myEmail@email.com';
    payout.notificationURL = 'https://my-url.com';

    return await client.submitPayout(payout);
  }

  public async createPayouts() {
    const client = ClientProvider.create();

    return await client.submitPayouts([new Payout(12.34, 'USD', 'USD'), new Payout(56.14, 'USD', 'USD')]);
  }

  public async getPayout() {
    const client = ClientProvider.create();

    return await client.getPayout('myPayoutId');
  }

  public async getPayoutsByFillter() {
    const client = ClientProvider.create();

    return await client.getPayouts({ status: PayoutStatus.New });
  }

  public async cancelPayout() {
    const client = ClientProvider.create();

    return await client.cancelPayout('somePayoutId');
  }

  public async canclePayouts() {
    const client = ClientProvider.create();

    return await client.cancelPayouts('payoutGroupId');
  }

  public async requestPayoutWebhookToBeResent() {
    const client = ClientProvider.create();

    return await client.requestPayoutNotification('somePayoutId');
  }
}
