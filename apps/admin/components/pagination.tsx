import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  buildHref: (page: number) => string;
  noun?: string;
};

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
    .reduce<(number | "...")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  buildHref,
  noun = "items",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {/* Previous */}
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--color-border, #e2e8f0)",
              color: "var(--color-foreground, #0f172a)",
              background: "var(--color-panel, #fff)",
              textDecoration: "none",
            }}
          >
            ← Prev
          </Link>
        ) : (
          <span
            style={{
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--color-border, #e2e8f0)",
              color: "var(--color-muted, #64748b)",
              background: "var(--color-panel-alt, #f8fafc)",
              opacity: 0.5,
              cursor: "not-allowed",
            }}
          >
            ← Prev
          </span>
        )}

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`e-${i}`}
              style={{
                padding: "7px 4px",
                color: "var(--color-muted, #64748b)",
                fontSize: 13,
              }}
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 36,
                padding: "7px 10px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                textDecoration: "none",
                ...(p === page
                  ? {
                      background: "var(--color-accent, #dc2626)",
                      color: "#fff",
                      border: "1px solid var(--color-accent, #dc2626)",
                    }
                  : {
                      background: "var(--color-panel, #fff)",
                      color: "var(--color-foreground, #0f172a)",
                      border: "1px solid var(--color-border, #e2e8f0)",
                    }),
              }}
            >
              {p}
            </Link>
          )
        )}

        {/* Next */}
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              background: "var(--color-accent, #dc2626)",
              color: "#fff",
              border: "1px solid var(--color-accent, #dc2626)",
              textDecoration: "none",
            }}
          >
            Next →
          </Link>
        ) : (
          <span
            style={{
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--color-border, #e2e8f0)",
              color: "var(--color-muted, #64748b)",
              background: "var(--color-panel-alt, #f8fafc)",
              opacity: 0.5,
              cursor: "not-allowed",
            }}
          >
            Next →
          </span>
        )}
      </div>

      {/* Page info */}
      <div
        style={{
          textAlign: "center",
          marginTop: 10,
          fontSize: 12,
          color: "var(--color-muted, #64748b)",
        }}
      >
        Page {page} of {totalPages} · Showing {from}–{to} of {total} {noun}
      </div>
    </nav>
  );
}
