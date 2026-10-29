import { Request, Response, NextFunction } from 'express';

const exceptionHandler = (fn: (req: Request, res: Response, next: NextFunction) => any) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((e) => {
            console.log(e);
            if (res.headersSent) {
                next(e);
                return;
            }
            res.status(500).json({ error: "Internal server error" });
        });
    };

export default exceptionHandler;
