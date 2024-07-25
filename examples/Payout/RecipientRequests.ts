import { ClientProvider } from '../ClientProvider';
import { PayoutRecipient, PayoutRecipients } from '../../src/Model';

export class RecipientRequests {
  public async inviteRecipients() {
    const client = ClientProvider.create();

    const payoutRecipient = new PayoutRecipient('some@email.com', 'someLabel', 'https://notification.com');

    const payoutRecipients = new PayoutRecipients([payoutRecipient]);

    return await client.submitPayoutRecipients(payoutRecipients);
  }

  public async getRecipient() {
    const client = ClientProvider.create();

    return await client.getPayoutRecipient('someRecipientId');
  }

  public async getRecipientsByFillter() {
    const client = ClientProvider.create();

    return await client.getPayoutRecipients('invited');
  }

  public async updateRecipient() {
    const client = ClientProvider.create();

    const payoutRecipient = new PayoutRecipient('some@email.com', 'someLabel', 'https://notification.com');
    payoutRecipient.label = 'some label';

    return await client.updatePayoutRecipient(payoutRecipient.id!, payoutRecipient);
  }

  public async removeRecipient() {
    const client = ClientProvider.create();

    return await client.deletePayoutRecipient('somePayoutRecipientId');
  }
}
