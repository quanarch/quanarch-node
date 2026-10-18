export interface StreamHandlers {
  /** The stream is open: whoever is on the other side is there. */
  onOpen: () => void;
  /** A named event arrived, e.g. "change". */
  onEvent: (name: string, data: string) => void;
  /** The stream ended or could not be opened: the other side is gone. */
  onClose: () => void;
}

/** Listens to a server-sent event stream. Returns a function that closes it. */
export function subscribe(url: string, handlers: StreamHandlers): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(url, { headers: { Accept: 'text/event-stream' }, signal: controller.signal });
      if (!response.ok || !response.body) throw new Error(`${url} answered ${response.status}`);
      handlers.onOpen();

      const decoder = new TextDecoder();
      let buffer = '';
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        let end: number;
        while ((end = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          let name = 'message';
          let data = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) name = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
          }
          handlers.onEvent(name, data);
        }
      }
    } catch {
      // closed, refused or aborted: handled below
    }
    if (!controller.signal.aborted) handlers.onClose();
  })();

  return () => controller.abort();
}
