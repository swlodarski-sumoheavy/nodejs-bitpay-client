import {ClientProvider} from "../ClientProvider";
import {Refund} from "../../src/Model/Invoice/Refund";

class RefundRequests {
  public async createRefund(): Promise<void> {
    const client = ClientProvider.create();

    const refund = new Refund(12, "someInvoiceId", "someToken");

    const result = await client.createRefund(refund);
  }

  public async updateRefund(): Promise<void> {
    const client = ClientProvider.create();

    // Update a refund by ID
    const updateRefund = await client.updateRefund('myRefundId','created');

    // Update a refund by GUID
    const updatedRefundByGuid = await client.updateRefundByGuid('myRefundId','created');
  }

  public async getRefund(): Promise<void> {
    const client = ClientProvider.create();

    // Get a refund by ID
    const refund = await client.getRefund('someRefundId');

    // Get a refund by GUID
    const refundByGuid = await client.getRefundByGuid('someGuid');
  }

  public async cancelRefund(): Promise<void> {
    const client = ClientProvider.create();

    // Cancel a refund by ID
    const cancelRefund = await client.cancelRefund('myRefundId');

    // Cancel a refund by GUID
    const cancelRefundByGuid = await client.cancelRefundByGuid('someGuid');
  }

  public async requestRefundNotificationToBeResent(): Promise<void> {
    const client = ClientProvider.create();

    const result = await client.sendRefundNotification('someRefundId');
  }
}