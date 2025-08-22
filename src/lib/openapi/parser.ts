import SwaggerParser from "@readme/openapi-parser";

export type OpenAPIDoc = unknown; // dereferenced doc type is large; keep as unknown and narrow where needed

export async function parseValidateDereference(source: { url?: string; content?: string | Buffer }) {
  const parser = new SwaggerParser();
  const api = source.url
    ? await parser.parse(source.url)
    : await parser.parse(source.content as any);

  // Validate throws on invalid specs
  await parser.validate(api);

  // Dereference resolves all $refs, producing an object graph without $refs
  const deref = (await parser.dereference(api)) as OpenAPIDoc;
  return deref;
}
