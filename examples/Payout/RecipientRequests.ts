import {ClientProvider} from "../ClientProvider";
import {PayoutRecipient, PayoutRecipients} from "../../src/Model";

class RecipientRequests {
  public async inviteRecipients(): Promise<void> {
    const client = ClientProvider.create();

    const payoutRecipient = new PayoutRecipient('some@email.com', 'someLabel', 'https://notification.com');

    const payoutRecipients = new PayoutRecipients([payoutRecipient]);

    const recipients = await client.submitPayoutRecipients(payoutRecipients);
  }

  public async getRecipient(): Promise<void> {
    const client = ClientProvider.create();

    // Get one payout recipient
    const recipient = await client.getPayoutRecipient('someRecipientId');

    // Get payout recipients by filter
    const recipients = await client.getPayoutRecipients('invited');
  }

  public async updateRecipient(): Promise<void> {
    const client = ClientProvider.create();

    const payoutRecipient = new PayoutRecipient('some@email.com', 'someLabel', 'https://notification.com');
    payoutRecipient.label = 'some label';

    const recipient = await client.updatePayoutRecipient(payoutRecipient.id, payoutRecipient);
  }

  public async removeRecipient(): Promise<void>  {
    const client = ClientProvider.create();

    const result = await client.deletePayoutRecipient('somePayoutRecipientId');
  }
}