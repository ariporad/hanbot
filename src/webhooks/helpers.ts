import { Request, Response } from 'express';

export interface RouteHandler {
	(req: Request, res: Response): void | Promise<void>;
}

export class ResponseError extends Error {
	status: number;
	body: any;

	stack: undefined;

	constructor(
		message: string = 'Unknown Error',
		status: number = 500,
		body: any = { msg: message },
	) {
		super(message);

		delete this.stack; // ResponseErrors don't have stacks

		this.status = status;
		this.body = body;
	}
}

export function wrapRoute(route: RouteHandler): (req: Request, res: Response) => void {
	return async (req, res) => {
		try {
			await route(req, res);
		} catch (err) {
			if (!(err instanceof ResponseError)) {
				console.error('ERROR in handling request!', req);
				console.error(err);
				err.stack && console.error(err.stack);
				err = new ResponseError();
			}

			res.status(err.status);
			if (err.body) {
				if (typeof err.body === 'string') res.write(err.body);
				else res.json(err.body);
			}
			res.end();
		}
	};
}

export function assert(
	condition: boolean,
	message?: string,
	status?: number,
	body?: any,
): asserts condition {
	if (!condition) throw new ResponseError(message, status, body);
}

export function assertExists<T = any>(
	thing: T | null | undefined,
	message?: string,
	status?: number,
	body?: any,
): asserts thing is T {
	assert(thing !== null && thing !== undefined, message, status, body);
}
