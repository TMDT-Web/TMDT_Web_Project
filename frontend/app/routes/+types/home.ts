// Minimal route types for this route so `import type { Route } from "./+types/home"` works
// Feel free to expand these fields to match your routing framework if needed.
export namespace Route {
  export interface MetaArgs {
    // common properties passed to meta functions (params, location, etc.)
    params?: Record<string, string | undefined>;
    // allow any additional properties used by different frameworks
    [key: string]: any;
  }
}
