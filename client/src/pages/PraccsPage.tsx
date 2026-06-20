import { CalendarClock, Filter, Map, Plus, Settings2, Swords } from "lucide-react";
import { useMemo, useState } from "react";
import { faceitLevelClass } from "../utils/faceitLevel";

type Pracc = {
  id: number;
  title: string;
  map: string;
  date: string;
  time: string;
  format: string;
  level: string;
  region: string;
  server: string;
  requirements: string;
};

const initialPraccs: Pracc[] = [
  {
    id: 1,
    title: "Ищем соперника на Ancient",
    map: "Ancient",
    date: "2026-06-19",
    time: "21:00 MSK",
    format: "BO1, MR12",
    level: "Faceit 7-9",
    region: "RU / EU",
    server: "Москва / Варшава",
    requirements: "Нужна команда со стабильным составом, без токсичности, готовая сыграть 2 карты при хорошем темпе."
  },
  {
    id: 2,
    title: "Тактическая тренировка Inferno",
    map: "Inferno",
    date: "2026-06-20",
    time: "19:30 MSK",
    format: "BO3 practice",
    level: "Faceit 5-7",
    region: "EU",
    server: "Германия",
    requirements: "Отработка дефолтов, ретейков и выходов на B. Желательно наличие тренера или капитана."
  },
  {
    id: 3,
    title: "Mirage вечерний пракк",
    map: "Mirage",
    date: "2026-06-21",
    time: "20:00 MSK",
    format: "BO1, demo review",
    level: "Faceit 6-8",
    region: "RU / EU",
    server: "Москва",
    requirements: "Спокойная тренировка: пистолетки, дефолт, мидраунд и разбор после игры."
  }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function PraccsPage() {
  const [praccs, setPraccs] = useState(initialPraccs);
  const [search, setSearch] = useState("");
  const [mapFilter, setMapFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [serverFilter, setServerFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [form, setForm] = useState({
    title: "Пракк Mirage под вечер",
    map: "Mirage",
    date: "2026-06-21",
    time: "20:00 MSK",
    format: "BO1, full demo review",
    level: "Faceit 6-8",
    region: "RU / EU",
    server: "Москва",
    requirements: "Ищем команду для спокойной тренировки: пистолетки, дефолт, мидраунд и разбор после игры."
  });

  const filteredPraccs = useMemo(() => {
    const titleQuery = normalize(search);
    const mapQuery = normalize(mapFilter);
    const timeQuery = normalize(timeFilter);
    const serverQuery = normalize(serverFilter);
    const formatQuery = normalize(formatFilter);

    return praccs.filter((pracc) => {
      return (
        (!titleQuery || normalize(pracc.title).includes(titleQuery)) &&
        (!mapQuery || normalize(pracc.map).includes(mapQuery)) &&
        (!timeQuery || normalize(`${pracc.date} ${pracc.time}`).includes(timeQuery)) &&
        (!serverQuery || normalize(`${pracc.region} ${pracc.server}`).includes(serverQuery)) &&
        (!formatQuery || normalize(pracc.format).includes(formatQuery))
      );
    });
  }, [praccs, search, mapFilter, timeFilter, serverFilter, formatFilter]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function createPracc(event: React.FormEvent) {
    event.preventDefault();
    setPraccs((current) => [{ id: Date.now(), ...form }, ...current]);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Тренировки</p>
          <h1>Пракки</h1>
        </div>
      </header>

      <section className="pracc-filters panel">
        <Filter size={18} />
        <input placeholder="Поиск по названию пракка" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={mapFilter} onChange={(event) => setMapFilter(event.target.value)}>
          <option value="">Любая карта</option>
          <option>Mirage</option>
          <option>Inferno</option>
          <option>Ancient</option>
          <option>Nuke</option>
          <option>Anubis</option>
          <option>Dust2</option>
        </select>
        <input placeholder="Время: 20:00 или дата" value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} />
        <input placeholder="Сервер или регион" value={serverFilter} onChange={(event) => setServerFilter(event.target.value)} />
        <input placeholder="Формат: BO1, BO3..." value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)} />
      </section>

      <section className="pracc-layout">
        <form className="panel pracc-form" onSubmit={createPracc}>
          <div className="panel-title">
            <Settings2 size={20} />
            <div>
              <h2>Создать тренировочный матч</h2>
              <p className="muted">Карта, время, формат, уровень соперника и условия</p>
            </div>
          </div>

          <div className="form-grid compact">
            <label className="full">
              Название заявки
              <input value={form.title} onChange={(event) => update("title", event.target.value)} />
            </label>
            <label>
              Карта
              <select value={form.map} onChange={(event) => update("map", event.target.value)}>
                <option>Mirage</option>
                <option>Inferno</option>
                <option>Ancient</option>
                <option>Nuke</option>
                <option>Anubis</option>
                <option>Dust2</option>
              </select>
            </label>
            <label>
              Дата
              <input value={form.date} onChange={(event) => update("date", event.target.value)} type="date" />
            </label>
            <label>
              Время
              <input value={form.time} onChange={(event) => update("time", event.target.value)} />
            </label>
            <label>
              Формат
              <input value={form.format} onChange={(event) => update("format", event.target.value)} />
            </label>
            <label>
              Уровень команды
              <input value={form.level} onChange={(event) => update("level", event.target.value)} />
            </label>
            <label>
              Регион
              <input value={form.region} onChange={(event) => update("region", event.target.value)} />
            </label>
            <label className="full">
              Сервер
              <input value={form.server} onChange={(event) => update("server", event.target.value)} />
            </label>
            <label className="full">
              Описание и требования
              <textarea value={form.requirements} onChange={(event) => update("requirements", event.target.value)} rows={4} />
            </label>
          </div>

          <button className="button primary" type="submit">
            <Plus size={16} /> Опубликовать пракк
          </button>
        </form>

        <div className="match-list">
          {filteredPraccs.length === 0 && (
            <section className="empty-state">
              <h2>Пракки не найдены</h2>
              <p className="muted">Попробуйте изменить карту, время, сервер, формат или строку поиска.</p>
            </section>
          )}

          {filteredPraccs.map((pracc) => (
            <article className="panel match-card" key={pracc.id}>
              <div className="match-card__head">
                <div>
                  <h2>{pracc.title}</h2>
                  <p className="muted">{pracc.region} · {pracc.server}</p>
                </div>
                <span className={`level-badge ${faceitLevelClass(pracc.level)}`}>{pracc.level}</span>
              </div>

              <div className="match-grid">
                <span><Map size={15} /> Карта<b>{pracc.map}</b></span>
                <span><CalendarClock size={15} /> Время<b>{pracc.date}, {pracc.time}</b></span>
                <span><Swords size={15} /> Формат<b>{pracc.format}</b></span>
              </div>

              <p>{pracc.requirements}</p>
              <button className="button secondary" type="button">Откликнуться</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
