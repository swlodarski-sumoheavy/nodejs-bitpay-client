import { Invoice, InvoiceInterface } from '../../src/Model';
import { Buyer } from '../../src/Model/Invoice/Buyer';
import { ClientProvider } from '../ClientProvider';

export class InvoiceRequests {
  public async createInvoice(): Promise<InvoiceInterface> {
    const invoice = new Invoice(10.0, 'USD');
    invoice.notificationEmail = 'some@email.com';
    invoice.notificationURL = 'https://some-url.com';

    const buyer = new Buyer();
    buyer.name = 'Test';
    buyer.email = 'test@email.com';
    buyer.address1 = '168 General Grove';
    buyer.country = 'AD';
    buyer.locality = 'Port Horizon';
    buyer.notify = true;
    buyer.phone = '+990123456789';
    buyer.postalCode = 'KY7 1TH';
    buyer.region = 'New Port';

    invoice.buyer = buyer;

    const client = ClientProvider.createPos();

    return await client.createInvoice(invoice);
  }

  public async getInvoice(): Promise<InvoiceInterface> {
    const client = ClientProvider.createPos();

    return await client.getInvoice('myInvoiceId');
  }
}
