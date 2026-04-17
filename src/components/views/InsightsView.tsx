import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CommonplaceYear } from '../../types/commonplace';
import { StatsCard } from '../shared/StatsCard';
import { EmptyState } from '../shared/EmptyState';
import {
  BookOpenIcon,
  StarFilledIcon,
  TagIcon,
  UserSilhouetteIcon,
  BookmarkIcon,
  CalendarDotIcon,
  InfoIcon,
} from '../../lib/icons';
import {
  coCitationPairs,
  lessonsPerMonth,
  summaryStats,
  themeDistribution,
  topSources,
} from '../../lib/stats';

interface InsightsViewProps {
  data: CommonplaceYear;
}

export function InsightsView({ data }: InsightsViewProps) {
  const [importantOnly, setImportantOnly] = useState(false);

  const summary = useMemo(() => summaryStats(data), [data]);
  const perMonth = useMemo(() => lessonsPerMonth(data), [data]);
  const sources = useMemo(() => topSources(data, 10, importantOnly), [
    data,
    importantOnly,
  ]);
  const themes = useMemo(
    () => themeDistribution(data, importantOnly),
    [data, importantOnly],
  );
  const pairs = useMemo(() => coCitationPairs(data, 5), [data]);

  if (data.lessons.length === 0) {
    return (
      <div className="cp-insights-view cp-insights-empty">
        <EmptyState
          icon={<InfoIcon size={32} />}
          title="No lessons yet"
          description="Insights light up after you've written a few lessons."
        />
      </div>
    );
  }

  return (
    <div className="cp-insights-view">
      <div className="cp-insights-toolbar">
        <label className="cp-insights-toggle">
          <input
            type="checkbox"
            checked={importantOnly}
            onChange={(e) => setImportantOnly(e.target.checked)}
          />
          <span>Important only</span>
        </label>
      </div>

      <section className="cp-insights-cards">
        <StatsCard
          label="Total lessons"
          value={summary.total}
          icon={<BookOpenIcon size={14} />}
        />
        <StatsCard
          label="Important"
          value={summary.important}
          caption={`${Math.round(summary.priorityRatio * 100)}% of total`}
          accent="priority"
          icon={<StarFilledIcon size={14} />}
        />
        <StatsCard
          label="Untagged"
          value={summary.untagged}
          caption={
            summary.untagged === 0
              ? 'All lessons themed'
              : 'End-of-year review list'
          }
          accent={summary.untagged > 0 ? 'warning' : 'default'}
          icon={<TagIcon size={14} />}
        />
        <StatsCard
          label="Sources"
          value={summary.sources}
          icon={<UserSilhouetteIcon size={14} />}
        />
        <StatsCard
          label="References"
          value={summary.references}
          icon={<BookmarkIcon size={14} />}
        />
        <StatsCard
          label="Dated"
          value={summary.dated}
          caption={
            summary.total > 0
              ? `${Math.round((summary.dated / summary.total) * 100)}% have a date`
              : undefined
          }
          icon={<CalendarDotIcon size={14} />}
        />
      </section>

      <div className="cp-insights-grid">
        <section className="cp-insights-panel">
          <header className="cp-insights-panel-head">
            <h3>Lessons over the year</h3>
            <span className="cp-insights-panel-sub">
              Lessons per month, with important overlay
            </span>
          </header>
          <div className="cp-chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={perMonth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--cp-border)" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="var(--cp-muted)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="var(--cp-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--cp-bg)',
                    border: '1px solid var(--cp-border)',
                    borderRadius: 6,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="All lessons"
                  stroke="var(--cp-accent)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="important"
                  name="Important"
                  stroke="var(--cp-priority)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="cp-insights-panel">
          <header className="cp-insights-panel-head">
            <h3>Top sources</h3>
            <span className="cp-insights-panel-sub">
              Most cited people and works
            </span>
          </header>
          <div className="cp-chart-wrap">
            {sources.length === 0 ? (
              <p className="cp-insights-empty-note">No citations yet.</p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, sources.length * 28)}
              >
                <BarChart
                  data={sources.map((s) => ({
                    name: s.source.name,
                    count: s.count,
                    fill: s.source.color,
                  }))}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 20, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--cp-border)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    stroke="var(--cp-muted)"
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--cp-muted)"
                    fontSize={11}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--cp-bg)',
                      border: '1px solid var(--cp-border)',
                      borderRadius: 6,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {sources.map((s) => (
                      <Cell key={s.source.id} fill={s.source.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="cp-insights-panel">
          <header className="cp-insights-panel-head">
            <h3>Theme distribution</h3>
            <span className="cp-insights-panel-sub">
              Share of lessons per theme
            </span>
          </header>
          <div className="cp-chart-wrap">
            {themes.length === 0 ? (
              <p className="cp-insights-empty-note">No themes yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--cp-bg)',
                      border: '1px solid var(--cp-border)',
                      borderRadius: 6,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                    }}
                  />
                  <Pie
                    data={themes.map((t) => ({
                      name: t.name,
                      value: t.count,
                      fill: t.color,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {themes.map((t, i) => (
                      <Cell key={i} fill={t.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="cp-insights-panel">
          <header className="cp-insights-panel-head">
            <h3>Priority ratio</h3>
            <span className="cp-insights-panel-sub">
              Your canon so far
            </span>
          </header>
          <div className="cp-priority-ratio">
            <div className="cp-priority-bar-track">
              <div
                className="cp-priority-bar-fill"
                style={{ width: `${summary.priorityRatio * 100}%` }}
              />
            </div>
            <p className="cp-priority-ratio-text">
              <strong>{summary.important}</strong> of{' '}
              <strong>{summary.total}</strong> lessons marked important
              {summary.total > 0 && (
                <>
                  {' '}
                  (
                  <strong>
                    {Math.round(summary.priorityRatio * 100)}%
                  </strong>
                  )
                </>
              )}
              .
            </p>
          </div>
        </section>

        <section className="cp-insights-panel cp-insights-panel-wide">
          <header className="cp-insights-panel-head">
            <h3>Cross-pollination</h3>
            <span className="cp-insights-panel-sub">
              Sources most often cited together
            </span>
          </header>
          {pairs.length === 0 ? (
            <p className="cp-insights-empty-note">
              No multi-source lessons yet.
            </p>
          ) : (
            <ul className="cp-insights-pairs">
              {pairs.map((p, i) => (
                <li key={i} className="cp-insights-pair">
                  <span
                    className="cp-insights-pair-dot"
                    style={{ background: p.a.color }}
                  />
                  <span>{p.a.name}</span>
                  <span className="cp-insights-pair-sep">&amp;</span>
                  <span
                    className="cp-insights-pair-dot"
                    style={{ background: p.b.color }}
                  />
                  <span>{p.b.name}</span>
                  <span className="cp-insights-pair-count">×{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
