import {ClientProvider} from "../ClientProvider";
import {Payout} from "../../src/Model";
import {PayoutStatus} from "../../src";

class PayoutRequests {
  public async createPayout(): Promise<void> {
    const client = ClientProvider.create();

    const payout = new Payout(12.34, 'USD', 'USD');
    payout.notificationEmail = 'myEmail@email.com';
    payout.notificationURL = 'https://my-url.com';

    // Submit one payout
    const createdPayout = await client.submitPayout(payout);

    // Submit multiple payouts
    const payouts = await client.submitPayouts([
      new Payout(12.34, 'USD', 'USD'),
      new Payout(56.14, 'USD', 'USD'),
    ])
  }

  public async getPayouts(): Promise<void> {
    const client = ClientProvider.create();

    // Get one payout
    const payout = await client.getPayout('myPayoutId')

    // Get payouts by filter
    const payouts = await client.getPayouts({ status: PayoutStatus.New });
  }

  public async cancelPayout(): Promise<void> {
    const client = ClientProvider.create();

    // Cancel one payout
    const result = await client.cancelPayout('somePayoutId');

    // Cancel payout group
    const cancelledPayouts = client.cancelPayouts('payoutGroupId');
  }

  public async requestPayoutWebhookToBeResent(): Promise<void> {
    const client = ClientProvider.create();

    const result = await client.requestPayoutNotification('somePayoutId');
  }
}