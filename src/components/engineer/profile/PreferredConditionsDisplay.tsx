interface PreferredConditionsDisplayProps {
  contractTypeLabels: string[];
  locations: string[];
  workStyleLabel: string | null;
  availableFrom: string | null;
  /** 円/時間, engineer_profiles.desired_hourly_rate_max. */
  desiredHourlyRate: number | null;
  /** 円/時間, engineer_profiles.desired_hourly_rate_min. */
  minimumHourlyRate: number | null;
  /** 円/年, engineer_profiles.desired_annual_income_yen. */
  desiredAnnualIncome: number | null;
}

/** Shared between the engineer's own profile page and the company detail view -- restores the old PreferredConditions.tsx sharing pattern. */
export function PreferredConditionsDisplay({
  contractTypeLabels,
  locations,
  workStyleLabel,
  availableFrom,
  desiredHourlyRate,
  minimumHourlyRate,
  desiredAnnualIncome,
}: PreferredConditionsDisplayProps) {
  const hasHourlyRate = desiredHourlyRate !== null && minimumHourlyRate !== null;
  const hasAnnualIncome = desiredAnnualIncome !== null;

  return (
    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {contractTypeLabels.length > 0 && (
        <div>
          <dt className="text-xs text-muted-foreground">希望契約形態</dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {contractTypeLabels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                {label}
              </span>
            ))}
          </dd>
        </div>
      )}
      {locations.length > 0 && (
        <div>
          <dt className="text-xs text-muted-foreground">希望勤務地</dt>
          <dd className="mt-1.5 flex flex-wrap gap-1.5">
            {locations.map((location) => (
              <span
                key={location}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground"
              >
                {location}
              </span>
            ))}
          </dd>
        </div>
      )}
      {workStyleLabel && (
        <div>
          <dt className="text-xs text-muted-foreground">リモート希望</dt>
          <dd className="mt-1.5 text-sm font-semibold text-foreground">{workStyleLabel}</dd>
        </div>
      )}
      {availableFrom && (
        <div>
          <dt className="text-xs text-muted-foreground">稼働開始可能日</dt>
          <dd className="mt-1.5 text-sm font-semibold text-foreground">{availableFrom}</dd>
        </div>
      )}
      {hasHourlyRate && (
        <div>
          <dt className="text-xs text-muted-foreground">希望単価・最低単価</dt>
          <dd className="mt-1.5 text-sm font-semibold text-foreground">
            {minimumHourlyRate}円〜{desiredHourlyRate}円/時間
          </dd>
        </div>
      )}
      {hasAnnualIncome && (
        <div>
          <dt className="text-xs text-muted-foreground">希望年収</dt>
          <dd className="mt-1.5 text-sm font-semibold text-foreground">
            {desiredAnnualIncome}円/年
          </dd>
        </div>
      )}
    </dl>
  );
}
