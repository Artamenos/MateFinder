import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Invite, InviteStatus } from "../types";

export function InvitesPage() {
  const [incoming, setIncoming] = useState<Invite[]>([]);
  const [outgoing, setOutgoing] = useState<Invite[]>([]);

  async function load() {
    const data = await api<{ incoming: Invite[]; outgoing: Invite[] }>("/invites");
    setIncoming(data.incoming);
    setOutgoing(data.outgoing);
  }

  async function update(id: string, status: InviteStatus) {
    await api(`/invites/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Командные заявки</p>
          <h1>Приглашения</h1>
        </div>
      </header>

      <section className="invite-columns">
        <div className="panel">
          <h2>Входящие</h2>
          {incoming.length === 0 && <p className="muted">Пока нет входящих приглашений.</p>}
          {incoming.map((invite) => (
            <article className="invite-card" key={invite.id}>
              <b>{invite.sender?.profile?.nickname ?? invite.sender?.email}</b>
              <p>{invite.message}</p>
              <span className={`status ${invite.status.toLowerCase()}`}>{invite.status}</span>
              {invite.status === "PENDING" && (
                <div className="form-actions">
                  <button className="button secondary" onClick={() => update(invite.id, "ACCEPTED")}><Check size={16} /> Принять</button>
                  <button className="button danger" onClick={() => update(invite.id, "DECLINED")}><X size={16} /> Отклонить</button>
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="panel">
          <h2>Исходящие</h2>
          {outgoing.length === 0 && <p className="muted">Вы еще не отправляли приглашения.</p>}
          {outgoing.map((invite) => (
            <article className="invite-card" key={invite.id}>
              <b>{invite.receiver?.profile?.nickname ?? invite.receiver?.email}</b>
              <p>{invite.message}</p>
              <span className={`status ${invite.status.toLowerCase()}`}>{invite.status}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
