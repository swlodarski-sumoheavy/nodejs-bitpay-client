import { ClientProvider } from '../ClientProvider';

export class RateRequests {
  public async getRate() {
    const client = ClientProvider.create();

    return await client.getRate('BTC', 'USD');
  }

  public async getRates() {
    const client = ClientProvider.create();

    return await client.getRates('BCH');
  }
}
