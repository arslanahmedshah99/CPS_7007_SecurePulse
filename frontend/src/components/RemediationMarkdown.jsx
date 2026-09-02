import ReactMarkdown from 'react-markdown';

export default function RemediationMarkdown({ children }) {
  return (
    <div className="text-sm leading-relaxed text-ink-secondary-dark">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-ink-primary-dark first:mt-0">{children}</h3>,
          h2: ({ children }) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-ink-primary-dark first:mt-0">{children}</h3>,
          h3: ({ children }) => <h4 className="mb-1 mt-3 text-sm font-semibold text-ink-primary-dark first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-ink-primary-dark">{children}</strong>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-series-blue-dark underline underline-offset-2">
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = String(children).includes('\n');
            if (isBlock) {
              return (
                <code
                  className={`block overflow-x-auto whitespace-pre rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-[13px] leading-relaxed text-ink-primary-dark ${className || ''}`}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`rounded border border-white/10 bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-ink-primary-dark ${className || ''}`}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <div className="mb-3 last:mb-0">{children}</div>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
