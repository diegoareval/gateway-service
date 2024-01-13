import axios, { AxiosInstance } from 'axios';
import { sign } from 'jsonwebtoken';
import { config } from '@gateway/config';

export class AxiosService {
  public axios: ReturnType<typeof axios.create>;
  constructor(baseUrl: string, serviceName: string) {
    this.axios = this.createInstance(baseUrl, serviceName);
  }

  public createInstance(baseUrl: string, serviceName: string): AxiosInstance {
    let gatewayToken = '';
    if (serviceName) {
      gatewayToken = sign({ id: serviceName }, `${config.GATEWAY_JWT_TOKEN}`);
    }

    const instance: AxiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        gatewayToken
      },
      withCredentials: true
    });

    return instance;
  }
}
