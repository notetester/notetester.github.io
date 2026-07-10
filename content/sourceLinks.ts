import type { SourceReference } from "./types";

export function sourceHref(source: SourceReference): string {
  if (!source.path || !source.repository.startsWith("https://github.com/")) {
    return source.repository;
  }

  const encodedPath = source.path
    .replaceAll("\\", "/")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${source.repository.replace(/\/$/, "")}/blob/HEAD/${encodedPath}`;
}
