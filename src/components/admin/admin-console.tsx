"use client";

import { type FormEvent, useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/panel";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import type { GetPlatformMetricsResponse } from "@/gen/pulso/v1/admin_service_pb";
import { type User, Role } from "@/gen/pulso/v1/auth_service_pb";
import type { Category } from "@/gen/pulso/v1/common_pb";
import { api } from "@/lib/api/browser";

const POLL_MS = 5000;

export function AdminConsole() {
  const { dictionary } = useI18n();
  const t = dictionary.app.admin;
  const [metrics, setMetrics] = useState<GetPlatformMetricsResponse>();
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    const load = () => void api.admin.getPlatformMetrics({}).then(setMetrics);
    load();
    const timer = setInterval(load, POLL_MS);
    void api.admin.listUsers({ page: { pageSize: 50 } }).then((response) => setUsers(response.users));
    void api.statements.listCategories({}).then((response) => setCategories(response.categories));
    return () => clearInterval(timer);
  }, []);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(undefined), 4000);
  }

  async function broadcast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await api.admin.broadcastAnnouncement({ title: String(data.get("title")), body: String(data.get("body")) });
    form.reset();
    flash(t.sent);
  }

  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await api.admin.upsertMerchantRule({ pattern: String(data.get("pattern")), categoryId: String(data.get("category")) });
    form.reset();
    flash(t.ruleSaved);
  }

  const number = (value?: number | bigint) => (value === undefined ? "—" : value.toLocaleString());

  return (
    <div className="space-y-6">
      {notice && <p className="card border-green/40 bg-green/10 px-4 py-3 text-sm text-green">{notice}</p>}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard label={t.online} value={number(metrics?.connectedUsers)} accent="bg-green" />
        <StatCard label={t.connections} value={number(metrics?.activeConnections)} accent="bg-blue" />
        <StatCard label={t.statements} value={number(metrics?.statementsProcessed)} accent="bg-violet" />
        <StatCard label={t.transactions} value={number(metrics?.transactionsProcessed)} accent="bg-yellow" />
        <StatCard label={t.workerAvg} value={`${number(metrics?.averageProcessingMsWorker)} ms`} accent="bg-blue" />
        <StatCard label={t.mainAvg} value={`${number(metrics?.averageProcessingMsMainThread)} ms`} accent="bg-red" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={broadcast} className="card space-y-4 p-6">
          <h2 className="font-display text-lg font-bold">{t.broadcast}</h2>
          <Field label={t.broadcastTitle} name="title" required maxLength={80} />
          <Field label={t.broadcastBody} name="body" required maxLength={500} />
          <Button type="submit">{t.send}</Button>
        </form>
        <form onSubmit={saveRule} className="card space-y-4 p-6">
          <h2 className="font-display text-lg font-bold">{t.rule}</h2>
          <Field label={t.pattern} name="pattern" required minLength={2} maxLength={80} placeholder="KIOSKO LUNA" />
          <Select label={dictionary.app.transactions.category} name="category" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {dictionary.categories[category.code as keyof typeof dictionary.categories] ?? category.code}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            {t.saveRule}
          </Button>
        </form>
      </div>
      <section className="card overflow-hidden">
        <h2 className="p-6 pb-3 font-display text-lg font-bold">{t.users}</h2>
        <ul className="divide-y divide-line">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <span>
                <span className="font-semibold">{user.fullName}</span>
                <span className="ml-2 text-muted">{user.email}</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  user.role === Role.ADMIN ? "bg-violet/15 text-violet" : "bg-surface-2 text-muted"
                }`}
              >
                {user.role === Role.ADMIN ? "ADMIN" : "USER"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
