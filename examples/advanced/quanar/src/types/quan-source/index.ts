/** One row of data/quans.json: where a quan lives and the quas plugged into it. */
export interface QuanSource {
  name: string;
  version: string;
  url: string;
  /** SHA-256 of the file. When set, a file that does not match never runs. */
  hash?: string;
  /** An event stream that announces a new build with a change event. */
  events?: string;
  quas: string[];
}
