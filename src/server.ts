import { StatusCodes } from 'http-status-codes';
import { Application, json, urlencoded, Request, Response, NextFunction } from 'express';
import { winstonLogger } from '@diegoareval/jobber-shared';
import { Logger } from 'winston';
import { config } from '@gateway/config';
import cookieSession from 'cookie-session';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import compression from 'compression';
import http from 'http';
import { elasticsearch } from '@gateway/elasticsearch';
import { appRoutes } from '@gateway/routes'

const SERVER_PORT = 4000;

export class GatewayServer {
  private app: Application;
  private log: Logger;
  constructor(application: Application) {
    this.app = application;
    this.log = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'apiGatewayServer', 'debug');
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.startElasticSearch();
    this.errorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(application: Application): void {
    application.set('trust proxy', 1);
    application.use(
      cookieSession({
        name: 'session',
        keys: [`${config.SECRET_KEY_ONE}`, `${config.SECRET_KEY_TWO}`],
        maxAge: 24 * 7 * 36000000,
        secure: config.NODE_ENV != 'development'
        // sameSite: 'none'
      })
    );
    application.use(hpp());
    application.use(helmet());
    application.use(cors({ origin: config.CLIENT_URL, credentials: true, methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'] }));
  }

  private standardMiddleware(application: Application): void {
    application.use(compression());
    application.use(json({ limit: '200mb' }));
    application.use(urlencoded({ limit: '200mb', extended: true }));
  }

  private routesMiddleware(application: Application): void {
    appRoutes(application);
  }

  private startElasticSearch(): void {
    elasticsearch.checkConnection();
  }

  private errorHandler(application: Application): void {
    application.use((req: Request, res: Response, next: NextFunction) => {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      this.log.log('error', `${fullUrl} endpoint does not exist`, '');
      res.status(StatusCodes.NOT_FOUND).json({ message: 'endpoint called does not exist' });
      next();
    });
  }

  private async startHttpServer(httpServer: http.Server): Promise<void> {
    try {
      this.log.info(`worker with process ${process.pid} on gateway service has started`);
      httpServer.listen(SERVER_PORT, () => {
        this.log.info(`Gateway Service running on port ${SERVER_PORT}`);
      });
    } catch (error) {
      this.log.log('error', 'GatewayService startHttpServer() method', error);
    }
  }

  private async startServer(application: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(application);
      this.startHttpServer(httpServer);
    } catch (error) {
      this.log.log('error', 'GatewayService startServer() method', error);
    }
  }
}
