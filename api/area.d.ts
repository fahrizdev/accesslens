import type { IncomingMessage, ServerResponse } from "node:http";
import type { Area } from "../app/area";

export function parseArea(
  geographies: Record<string, Record<string, string>[]>,
  memberXml?: string,
): Area;

export default function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void>;
