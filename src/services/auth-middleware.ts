import { Request, Response, NextFunction } from 'express';
import { NotAuthorizedError, IAuthPayload, BadRequestError } from '@diegoareval/jobber-shared';
import { verify } from 'jsonwebtoken';
import { config } from '@gateway/config';

class AuthMiddleware {
  constructor() {}
  public verifyUser(req: Request, _response: Response, next: NextFunction): void {
    if (!req.session?.jwt) {
      throw new NotAuthorizedError('Token is not available, try again...', 'GatewayService verifyUser() method error');
    }

    try {
      const payload: IAuthPayload = verify(req.session?.jwt, `${config.JWT_TOKEN}`) as IAuthPayload;
      req.currentUser = payload;
    } catch (error) {
      throw new NotAuthorizedError('Token is not available, try again...', 'GatewayService verifyUser() method error invalid session');
    }
    next();
  }

  public checkAuthentication(req: Request, _response: Response, next: NextFunction){
     if(!req.currentUser){
        throw new BadRequestError('Authentication is required to have access to this route',
         'GatewayService checkAuthentication() method error');
     }
     next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
