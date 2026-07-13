"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { getTxUrl, truncateHash } from "../../utils/stellar";

const COPY_FEEDBACK_RESET_MS = 2000;

interface TxHashLinkProps {
  txHash: string;
  chars?: number;
  className?: string;
}

export function TxHashLink({ txHash, chars = 8, className = "" }: TxHashLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(txHash);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, COPY_FEEDBACK_RESET_MS);
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-secondary)] ${className}`}
      title={txHash}
    >
      <span>{truncateHash(txHash, chars)}</span>

      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy transaction hash"
        className="rounded p-0.5 transition hover:text-[var(--text-primary)]"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>

      <a
        href={getTxUrl(txHash)}
        target="_blank"
        rel="noreferrer"
        aria-label="View on Stellar Explorer"
        className="rounded p-0.5 transition hover:text-violet-400"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </span>
  );
}
