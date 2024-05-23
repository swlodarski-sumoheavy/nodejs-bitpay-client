import {ClientProvider} from "../ClientProvider";
import {Bill} from "../../src/Model";
import {Item} from "../../src/Model/Bill/Item";

class BillRequests {
  public async createBill(): Promise<void> {
    const client = ClientProvider.createPos();

    const bill = new Bill('someNumber', "USD", "some@email.com", [])
    await client.createBill(bill);
  }

  public async getBill(): Promise<void> {
    const client = ClientProvider.createPos();

    const bill = await client.getBill('someBillId');
  }

  public async deliverBillViaEmail(): Promise<void> {
    const client = ClientProvider.createPos();

    await client.deliverBill('someBillId', 'myBillToken');
  }
}