import { ClientProvider } from '../ClientProvider';
import { Bill } from '../../src/Model';

export class BillRequests {
  public async createBill() {
    const client = ClientProvider.createPos();

    const bill = new Bill('someNumber', 'USD', 'some@email.com', []);
    return await client.createBill(bill);
  }

  public async getBill() {
    const client = ClientProvider.createPos();

    return await client.getBill('someBillId');
  }

  public async deliverBillViaEmail() {
    const client = ClientProvider.createPos();

    return client.deliverBill('someBillId', 'myBillToken');
  }
}
