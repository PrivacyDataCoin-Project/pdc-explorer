import { Request, Response, NextFunction } from 'express';

const exceptionHandler = (fn: (req: Request, res: Response, next: NextFunction) => any) => 
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((e) => {
            console.log(e);
            
            next();
        });
    };

export default exceptionHandler;
