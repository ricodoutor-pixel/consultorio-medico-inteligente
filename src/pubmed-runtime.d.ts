// The server deploy resolves Deno's npm specifier; app tests use the same package.
declare module "npm:fast-xml-parser@5.12.0" {
  export { XMLParser } from "fast-xml-parser";
}