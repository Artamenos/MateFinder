import { DownloadCloud, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";

type ImportResult = {
  input: string;
  nickname: string;
  status: "imported" | "failed";
  message?: string;
  profileId?: string;
};

export function AdminPage() {
  const [faceitImport, setFaceitImport] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);
  const [status, setStatus] = useState("");

  async function importFaceitProfiles(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    setResults([]);

    const profiles = faceitImport
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (profiles.length === 0) {
      setStatus("Добавьте хотя бы один Faceit ник или ссылку.");
      return;
    }

    try {
      const data = await api<{ results: ImportResult[] }>("/faceit/import-profiles", {
        method: "POST",
        body: JSON.stringify({ profiles })
      });
      const imported = data.results.filter((result) => result.status === "imported").length;
      const failed = data.results.length - imported;
      setResults(data.results);
      setStatus(`Импортировано: ${imported}. Ошибок: ${failed}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось импортировать профили.");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Управление</p>
          <h1>Администрирование</h1>
        </div>
      </header>

      <section className="admin-layout">
        <form className="panel admin-import" onSubmit={importFaceitProfiles}>
          <div className="panel-title">
            <ShieldCheck size={20} />
            <div>
              <h2>Импорт Faceit профилей</h2>
              <p className="muted">Доступно только администратору. Вставьте ники или ссылки на профили, каждый с новой строки или через запятую.</p>
            </div>
          </div>

          <textarea
            value={faceitImport}
            onChange={(event) => setFaceitImport(event.target.value)}
            placeholder="https://www.faceit.com/ru/players/example&#10;another_nickname"
            rows={8}
          />

          <div className="form-actions">
            <button className="button primary" type="submit">
              <DownloadCloud size={16} /> Подтянуть с Faceit
            </button>
            {status && <span className="muted">{status}</span>}
          </div>
        </form>

        <aside className="panel admin-note">
          <h2>Как это работает</h2>
          <p className="muted">
            Backend берет только указанные профили, обращается к официальному Faceit Data API и сохраняет их в базу MateFinder.
          </p>
          <p className="muted">
            Для работы нужен ключ `FACEIT_API_KEY` в файле `server/.env`.
          </p>
        </aside>
      </section>

      {results.length > 0 && (
        <section className="panel">
          <h2>Результат импорта</h2>
          <div className="admin-results">
            {results.map((result) => (
              <div className={`import-result ${result.status}`} key={`${result.input}-${result.nickname}`}>
                <b>{result.nickname || result.input}</b>
                <span>{result.status === "imported" ? "Импортирован" : result.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
