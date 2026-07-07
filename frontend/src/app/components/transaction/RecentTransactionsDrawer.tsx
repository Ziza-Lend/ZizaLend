"use client";

import { useState } from "react";
import { Clock3, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMyTransactions } from "../../hooks/useApi";
import { useUserStore } from "../../stores/useUserStore";
import { TxHashLink } from "../ui/TxHashLink";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RecentTransactionsDrawer() {
  const t = useTranslations("RecentTransactions");
  const [open, setOpen] = useState(false);
  const authToken = useUserStore((state) => state.authToken);
  const { data, isLoading, isError } = useMyTransactions({
    limit: 20,
    enabled: open && Boolean(authToken),
  });
  const transactions = data?.items ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <Clock3 className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {t("title")}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("description")}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {isLoading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("loading")}</p>
              ) : isError ? (
                <p className="text-sm text-red-600 dark:text-red-400">{t("error")}</p>
              ) : transactions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {t("empty")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {transactions.map((transaction) => (
                    <li
                      key={transaction.id}
                      className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold capitalize text-zinc-950 dark:text-zinc-50">
                            {transaction.transactionType}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {formatDate(transaction.submittedAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                          {transaction.status}
                        </span>
                      </div>
                      <div className="mt-3">
                        <TxHashLink txHash={transaction.txHash} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
