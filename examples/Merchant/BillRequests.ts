import {ClientProvider} from "../ClientProvider";
import {Bill} from "../../src/Model";
import {Item} from "../../src/Model/Bill/Item";

class BillRequests {
  public async createBill(): Promise<void> {
    const client = ClientProvider.create();

    const bill = new Bill('someNumber', "USD", "some@email.com", [])
    await client.createBill(bill);
  }

  public async getBill(): Promise<void> {
    const client = ClientProvider.create();

    // Get one bill
    const bill = await client.getBill('someBillId');

    // Get bills by status
    const bills = await client.getBills('draft');
  }

  public async updateBill(): Promise<void> {
    const client = ClientProvider.create();

    const item = new Item()
    item.price = 12.34;
    item.quantity = 2;
    item.description = 'someDescription';

    const bill = new Bill('someNumber', "USD", "some@email.com", []);

    if (bill.id) {
      await client.updateBill(bill, bill.id)
    }
  }

  public async deliverBillViaEmail(): Promise<void> {
    const client = ClientProvider.create();

    await client.deliverBill('someBillId', 'myBillToken');
  }
}