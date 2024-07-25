import { ClientProvider } from '../ClientProvider';
import { Bill } from '../../src/Model';
import { Item } from '../../src/Model/Bill/Item';

export class BillRequests {
  public async createBill() {
    const client = ClientProvider.create();

    const bill = new Bill('someNumber', 'USD', 'some@email.com', []);
    return client.createBill(bill);
  }

  public async getBill() {
    const client = ClientProvider.create();

    return await client.getBill('someBillId');
  }

  public async getBills() {
    const client = ClientProvider.create();
    return await client.getBills('draft');
  }

  public async updateBill() {
    const client = ClientProvider.create();

    const item = new Item();
    item.price = 12.34;
    item.quantity = 2;
    item.description = 'someDescription';

    const bill = new Bill('someNumber', 'USD', 'some@email.com', []);

    if (bill.id) {
      await client.updateBill(bill, bill.id);
    }
  }

  public async deliverBillViaEmail() {
    const client = ClientProvider.create();

    return await client.deliverBill('someBillId', 'myBillToken');
  }
}
