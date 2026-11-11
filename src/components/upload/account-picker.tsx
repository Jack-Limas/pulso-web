"use client";

import { type FormEvent, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { AccountType, type BankAccount, type SupportedBank } from "@/gen/pulso/v1/bank_account_service_pb";
import { api } from "@/lib/api/browser";

const TYPES = [AccountType.SAVINGS, AccountType.CHECKING, AccountType.DIGITAL_WALLET] as const;
const TYPE_KEYS = {
  [AccountType.SAVINGS]: "SAVINGS",
  [AccountType.CHECKING]: "CHECKING",
  [AccountType.DIGITAL_WALLET]: "DIGITAL_WALLET",
} as const;

export function AccountPicker({
  accounts,
  banks,
  selectedId,
  onSelect,
  onCreated,
}: {
  accounts: BankAccount[];
  banks: SupportedBank[];
  selectedId: string;
  onSelect(id: string): void;
  onCreated(account: BankAccount): void;
}) {
  const { dictionary } = useI18n();
  const t = dictionary.app.upload;
  const [creating, setCreating] = useState(accounts.length === 0);
  const [pending, setPending] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    try {
      const { account } = await api.bankAccounts.createBankAccount({
        supportedBankId: String(data.get("bank")),
        alias: String(data.get("alias")),
        type: Number(data.get("type")) as AccountType,
      });
      if (account) {
        onCreated(account);
        setCreating(false);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(account.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                account.id === selectedId
                  ? "border-blue bg-blue/10 shadow-[0_10px_24px_-14px_var(--blue)]"
                  : "border-line bg-surface hover:border-blue/50"
              }`}
            >
              <p className="font-semibold">{account.alias}</p>
              <p className="text-xs text-muted">{account.bank?.name}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCreating((open) => !open)}
            className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm font-semibold text-muted hover:border-blue hover:text-blue"
          >
            + {t.newAccount}
          </button>
        </div>
      )}
      {creating && (
        <form onSubmit={create} className="grid animate-rise gap-3 rounded-2xl bg-surface-2/60 p-4 sm:grid-cols-4">
          <Select label={t.bank} name="bank" required>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </Select>
          <Field label={t.alias} name="alias" required maxLength={60} defaultValue={t.types.SAVINGS} />
          <Select label={t.type} name="type" defaultValue={AccountType.SAVINGS}>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {t.types[TYPE_KEYS[type]]}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={pending} className="self-end py-3">
            {t.create}
          </Button>
        </form>
      )}
    </div>
  );
}
