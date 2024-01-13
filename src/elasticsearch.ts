import { Client } from '@elastic/elasticsearch';
import { winstonLogger } from '@diegoareval/jobber-shared';
import { config } from '@gateway/config';
import { Logger } from 'winston';
import { ClusterHealthHealthResponseBody } from '@elastic/elasticsearch/lib/api/types';

export class ElasticSearch {
  private static instance: ElasticSearch;
  private elasticsearchClient: Client;
  private log: Logger;

  private constructor() {
    this.log = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'apiGatewayElasticSearchServer', 'debug');
    this.elasticsearchClient = new Client({ node: `${config.ELASTIC_SEARCH_URL}` });
  }

  /**
   * Gets the singleton instance of the ElasticSearch class.
   */
  public static getInstance(): ElasticSearch {
    if (!ElasticSearch.instance) {
      ElasticSearch.instance = new ElasticSearch();
    }
    return ElasticSearch.instance;
  }

  /**
   * Checks the connection to Elasticsearch and logs the health status.
   * Retries if the connection fails.
   */
  public async checkConnection(): Promise<void> {
    let isConnected = false;
  
    while (!isConnected) {
      try {
        // Check the health of the Elasticsearch cluster
        const health: ClusterHealthHealthResponseBody = await this.elasticsearchClient.cluster.health({});

        // Log the health status
        this.log.info(`GatewayService health status - ${health.status}`);
        isConnected = true;
      } catch (error) {
        // Log the connection error and retry
        this.log.error('Connection to Elasticsearch failed. Retrying...');
        this.log.log('error', 'GatewayService checkConnection() method', error);
      }
    }
  }
}

export const elasticsearch: ElasticSearch = ElasticSearch.getInstance();
