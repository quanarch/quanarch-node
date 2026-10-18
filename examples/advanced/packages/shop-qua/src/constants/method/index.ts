/** HTTP methods a quan can ask the quanar to listen to. */
export const METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type HttpMethod = (typeof METHOD)[keyof typeof METHOD];
