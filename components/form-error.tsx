"use client";

function focusSummary(element: HTMLDivElement | null) {
  element?.focus();
}

export function FormError({
  message,
  fields = {},
  targets = {},
}: {
  message: string;
  fields?: Record<string, string[]>;
  targets?: Record<string, string>;
}) {
  if (!message) return null;
  return (
    <div
      ref={focusSummary}
      className="error-summary"
      role="alert"
      tabIndex={-1}
    >
      <p>{message}</p>
      {Object.entries(fields).some(([field]) => targets[field]) ? (
        <ul>
          {Object.entries(fields).map(([field, messages]) =>
            targets[field] ? (
              <li key={field}>
                <a
                  href={`#${targets[field]}`}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(targets[field])?.focus();
                  }}
                >
                  {messages[0]}
                </a>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
    </div>
  );
}
