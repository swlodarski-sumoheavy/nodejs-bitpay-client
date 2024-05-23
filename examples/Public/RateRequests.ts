import {ClientProvider} from "../ClientProvider";

class RateRequests {
  public async getRate(): Promise<void> {
    const client = ClientProvider.create();

    // Get one rate
    const rate = await client.getRate('BTC', 'USD');

    // Get multiple rates
    const rates = await client.getRates('BCH')
  }
}