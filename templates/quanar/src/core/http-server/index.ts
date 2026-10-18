import http from 'node:http';
import type { HttpMethod, QuanRequest, QuanResponse } from '../../types';
import { STATUS } from '../../constants';
import { errorMessage } from '../../utils';
import { apiManager } from '../api-manager';
import { createLogger } from '../logger';

const log = createLogger('http');

/** Answers the quanar's own routes; returns null when the path is not one of them. */
export type SystemHandler = (method: string, path: string) => QuanResponse | null;

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('Body is not valid JSON'), { status: STATUS.BAD_REQUEST });
  }
}

function send(res: http.ServerResponse, { status = STATUS.OK, body }: QuanResponse) {
  if (body === undefined) {
    res.writeHead(status).end();
    return;
  }
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
}

async function handle(req: http.IncomingMessage, system: SystemHandler): Promise<QuanResponse> {
  const url = new URL(req.url ?? '/', 'http://quanar');
  const method = (req.method ?? 'GET') as HttpMethod;

  const own = system(method, url.pathname);
  if (own) return own;

  const listener = apiManager.find(method, url.pathname);
  if (!listener) return { status: STATUS.NOT_FOUND, body: { error: `Nobody listens to ${method} ${url.pathname}` } };

  const request: QuanRequest = {
    method,
    path: url.pathname,
    params: listener.params,
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
    body: await readBody(req),
  };
  return listener.handler(request);
}

export function createHttpServer(system: SystemHandler) {
  return http.createServer(async (req, res) => {
    const started = Date.now();
    let response: QuanResponse;
    try {
      response = await handle(req, system);
    } catch (error) {
      const status = (error as { status?: number }).status ?? STATUS.INTERNAL;
      if (status === STATUS.INTERNAL) log.error(`${req.method} ${req.url} failed`, errorMessage(error));
      response = { status, body: { error: status === STATUS.INTERNAL ? 'Internal error' : errorMessage(error) } };
    }
    send(res, response);
    log.info(`${req.method} ${req.url} → ${response.status ?? STATUS.OK} (${Date.now() - started}ms)`);
  });
}
