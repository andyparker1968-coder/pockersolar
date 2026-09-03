import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, Calculator, ChevronDown, CircleHelp, Download, RotateCcw, Zap } from 'lucide-react';

type SolarValues = {
  totalSolar: string;
  effectiveOutput: string;
  outputHours: string;
  homeUsage: string;
  costPerKwh: string;
  feedInTariff: string;
};

type FormErrors = Partial<Record<keyof SolarValues, string>>;

const STORAGE_KEY = 'pocket-solar-calculation';
const DEFAULT_VALUES: SolarValues = {
  totalSolar: '4000',
  effectiveOutput: '3200',
  outputHours: '6',
  homeUsage: '1000',
  costPerKwh: '0.00',
  feedInTariff: '0.12',
};

function loadValues(): SolarValues {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_VALUES;
    const parsed = JSON.parse(saved) as Partial<SolarValues>;
    return {
      totalSolar: parsed.totalSolar ?? DEFAULT_VALUES.totalSolar,
      effectiveOutput: parsed.effectiveOutput ?? DEFAULT_VALUES.effectiveOutput,
      outputHours: '6',
      homeUsage: parsed.homeUsage ?? DEFAULT_VALUES.homeUsage,
      costPerKwh: parsed.costPerKwh ?? DEFAULT_VALUES.costPerKwh,
      feedInTariff: parsed.feedInTariff ?? DEFAULT_VALUES.feedInTariff,
    };
  } catch {
    return DEFAULT_VALUES;
  }
}

function formatPounds(value: number): string {
  const absolute = Math.abs(value);
  const pounds = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absolute);
  return value < 0 ? `−${pounds}` : pounds;
}

function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits }).format(value);
}

function formatPence(value: number): string {
  return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value)}p`;
}

function validate(values: SolarValues): FormErrors {
  const errors: FormErrors = {};
  const labels: Record<keyof SolarValues, string> = {
    totalSolar: 'Total amount of solar',
    effectiveOutput: 'Average effective output',
    outputHours: 'Solar output hours',
    homeUsage: 'Average home usage',
    costPerKwh: 'Cost per 1,000 W (1 kW)',
    feedInTariff: 'Feed-in tariff',
  };
  (Object.keys(labels) as (keyof SolarValues)[]).forEach((key) => {
    if (values[key].trim() === '') {
      errors[key] = `${labels[key]} is required.`;
      return;
    }
    const number = Number(values[key]);
    if (!Number.isFinite(number)) {
      errors[key] = 'Enter a valid number.';
    } else if (number < 0) {
      errors[key] = 'Use zero or a positive number.';
    }
  });
  return errors;
}

function BrandMark() {
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[14px] shadow-[0_7px_0_hsl(195_28%_19%/0.12)]" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="" className="h-full w-full object-cover" />
    </span>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  suffix,
  prefix,
  testId,
}: {
  id: keyof SolarValues;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  suffix?: string;
  prefix?: string;
  testId: string;
}) {
  return (
    <div className="group">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-bold tracking-[-0.01em]">{label}</label>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">{hint}</span>
      </div>
      <div className={`relative flex items-center rounded-2xl border bg-[hsl(var(--card))] transition-all duration-200 ${error ? 'border-[hsl(var(--destructive)/.7)] bg-[hsl(var(--destructive)/.03)]' : 'border-[hsl(var(--border))] focus-within:border-[hsl(var(--primary))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary)/.13)]'}`}>
        {prefix && <span className="pl-4 font-mono text-[15px] text-[hsl(var(--muted-foreground))]">{prefix}</span>}
        <input
          id={id}
          data-testid={testId}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          className="number-input focus-ring min-h-[52px] w-full min-w-0 bg-transparent px-4 font-mono text-[16px] font-medium outline-none placeholder:text-[hsl(var(--muted-foreground)/.5)]"
        />
        {suffix && <span className="pr-4 font-mono text-[11px] text-[hsl(var(--muted-foreground))]">{suffix}</span>}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[11px] font-medium text-[hsl(var(--destructive))]">{error}</p>
      ) : (
        <p id={`${id}-hint`} className="mt-1.5 text-[11px] leading-[1.4] text-[hsl(var(--muted-foreground))]">{hint}</p>
      )}
    </div>
  );
}

function DerivedField({
  label,
  hint,
  value,
  testId,
}: {
  label: string;
  hint: string;
  value: string;
  testId: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-bold">{label}</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Calculated</span>
      </div>
      <output data-testid={testId} className="flex min-h-[52px] items-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.44)] px-4 font-mono text-[16px] font-medium">
        {value}
      </output>
      <p className="mt-1.5 text-[11px] leading-[1.4] text-[hsl(var(--muted-foreground))]">{hint}</p>
    </div>
  );
}

function App() {
  const [values, setValues] = useState<SolarValues>(loadValues);
  const [touched, setTouched] = useState(false);
  const [setupOpen, setSetupOpen] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // Local persistence is a convenience; the calculator remains usable if storage is unavailable.
    }
  }, [values]);

  const errors = useMemo(() => validate(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;
  const numbers = useMemo(() => ({
    totalSolar: Number(values.totalSolar),
    effectiveOutput: Number(values.effectiveOutput),
    outputHours: Number(values.outputHours),
    homeUsage: Number(values.homeUsage),
    costPerKwh: Number(values.costPerKwh),
    feedInTariff: Number(values.feedInTariff),
  }), [values]);
  const totalSavings = useMemo(() => {
    if (hasErrors) return null;
    const homeCoveredWatts = Math.min(numbers.effectiveOutput, numbers.homeUsage);
    return (homeCoveredWatts / 1000) * (numbers.costPerKwh * numbers.outputHours);
  }, [hasErrors, numbers]);
  const outputDifference = hasErrors ? 0 : numbers.effectiveOutput - numbers.homeUsage;
  const feedInWatts = hasErrors ? 0 : Math.max(outputDifference, 0);
  const feedInKw = feedInWatts / 1000;
  const feedInEarnings = hasErrors ? null : feedInKw * (numbers.feedInTariff / 100) * numbers.outputHours;
  const totalBenefit = totalSavings === null || feedInEarnings === null ? null : totalSavings + feedInEarnings;
  const thirtyDayBenefit = totalBenefit === null ? null : totalBenefit * 30;
  const annualBenefit = totalBenefit === null ? null : totalBenefit * 365;
  const isShortfall = outputDifference < 0;

  const updateValue = (key: keyof SolarValues, value: string) => {
    setTouched(true);
    setValues((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setValues(DEFAULT_VALUES);
    setTouched(false);
  };

  return (
    <div className="solar-shell app-noise flex bg-[hsl(var(--background))]">
      <aside className="hidden w-[252px] shrink-0 flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] md:flex">
        <div className="flex items-center gap-3 px-2">
          <BrandMark />
          <div>
            <p className="font-serif text-[21px] font-semibold leading-none tracking-[-0.03em]">Pocket Solar</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--sidebar-foreground)/.48)]">your solar, calculated</p>
          </div>
        </div>
        <div className="mt-14">
          <p className="mb-3 px-3.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--sidebar-foreground)/.4)]">Your space</p>
          <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-[hsl(var(--sidebar-accent))] px-3.5 text-[14px] font-semibold text-[hsl(var(--sidebar-accent-foreground))] shadow-[inset_3px_0_0_hsl(var(--sidebar-primary))]">
            <Calculator className="h-[18px] w-[18px] text-[hsl(var(--sidebar-primary))]" strokeWidth={2.3} />
            <span>Calculator</span>
          </div>
        </div>
        <div className="mt-auto px-3.5 pt-6">
          <div className="flex items-center gap-2.5 text-[hsl(var(--sidebar-foreground)/.48)]">
            <CircleHelp className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[12px] font-semibold">Private on this device</span>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="relative flex items-center justify-between px-5 pb-2 pt-[max(1.1rem,env(safe-area-inset-top))] md:hidden">
          <div className="flex min-h-11 items-center gap-2.5">
            <BrandMark />
            <span className="font-serif text-[22px] font-semibold tracking-[-0.04em]">Pocket Solar</span>
          </div>
          <span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">Calculator</span>
        </header>

        <div className="solar-content mx-auto flex min-h-[100dvh] max-w-[1160px] flex-col px-5 sm:px-8 md:px-12 lg:px-16">
        <main className="flex-1 pb-10 pt-8 sm:pb-14 md:pt-12">
          <section className="animate-rise-in grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Solar calculator</p>
              <h1 className="mt-3 max-w-[760px] font-serif text-[clamp(2.6rem,6vw,4.4rem)] font-semibold leading-[.96] tracking-[-0.055em]">
                Your solar savings.
              </h1>
              <p className="mt-4 max-w-[510px] text-[14px] leading-[1.6] text-[hsl(var(--muted-foreground))]">
                See how much your panels could save at home, earn from exported energy, and deliver over a month or a year.
              </p>
            </div>
            <div className="hidden rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.54)] p-5 lg:block">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">The daylight window</span>
                <Zap className="h-4 w-4 text-[hsl(var(--accent))]" strokeWidth={2.2} />
              </div>
              <p className="mt-5 font-serif text-[30px] font-semibold leading-none tracking-[-.05em]">10:00 <span className="font-sans text-[16px] font-medium text-[hsl(var(--muted-foreground))]">—</span> 16:00</p>
              <p className="mt-2 text-[12px] leading-[1.45] text-[hsl(var(--muted-foreground))]">Six effective output hours, kept deliberately simple.</p>
            </div>
          </section>

          <section className="animate-rise-in delay-1 mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.04fr)_minmax(340px,.96fr)] lg:gap-7">
            <form
              className="rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[var(--shadow-sm)] sm:p-7"
              onSubmit={(event) => {
                event.preventDefault();
                setTouched(true);
              }}
              noValidate
            >
              <button
                type="button"
                className="focus-ring flex w-full items-start justify-between gap-4 border-b border-[hsl(var(--border)/.75)] pb-5 text-left"
                aria-expanded={setupOpen}
                aria-controls="solar-setup-fields"
                data-testid="button-toggle-setup"
                onClick={() => setSetupOpen((open) => !open)}
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--primary))]">01 — Your setup</p>
                  <h2 className="mt-2 font-serif text-[26px] font-semibold tracking-[-.04em]">A few figures.</h2>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                  <ChevronDown className={`h-[19px] w-[19px] transition-transform duration-200 ${setupOpen ? 'rotate-180' : ''}`} strokeWidth={1.8} />
                </div>
              </button>
              <div id="solar-setup-fields" hidden={!setupOpen}>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field id="totalSolar" label="Total amount of solar" hint="Panel capacity" value={values.totalSolar} onChange={(value) => updateValue('totalSolar', value)} error={touched ? errors.totalSolar : undefined} suffix="W" testId="input-total-solar" />
                  <Field id="effectiveOutput" label="Average effective output" hint="Real-world average" value={values.effectiveOutput} onChange={(value) => updateValue('effectiveOutput', value)} error={touched ? errors.effectiveOutput : undefined} suffix="W" testId="input-effective-output" />
                  <div className="sm:col-span-2">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-bold">Solar output hours</span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Fixed window</span>
                    </div>
                    <div className="flex min-h-[52px] items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.44)] px-4">
                      <span className="font-mono text-[15px] font-medium">10:00 <span className="px-1.5 text-[hsl(var(--muted-foreground))]">to</span> 16:00</span>
                      <span className="rounded-full bg-[hsl(var(--card))] px-2.5 py-1 font-mono text-[10px] text-[hsl(var(--primary))]">6 hours</span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-[1.4] text-[hsl(var(--muted-foreground))]">The estimate uses six effective daylight hours.</p>
                  </div>
                  <Field id="homeUsage" label="Average home usage per hour" hint="What home draws each hour" value={values.homeUsage} onChange={(value) => updateValue('homeUsage', value)} error={touched ? errors.homeUsage : undefined} suffix="W" testId="input-home-usage" />
                  <Field id="costPerKwh" label="Cost per 1,000 W (1 kW)" hint="25p = £0.25 / kWh" value={values.costPerKwh} onChange={(value) => updateValue('costPerKwh', value)} error={touched ? errors.costPerKwh : undefined} prefix="£" testId="input-cost-per-kwh" />
                  <Field id="feedInTariff" label="Feed-in tariff" hint="Rate paid for exported energy" value={values.feedInTariff} onChange={(value) => updateValue('feedInTariff', value)} error={touched ? errors.feedInTariff : undefined} suffix="p / kWh" testId="input-feed-in-tariff" />
                  <DerivedField label="Total feed-in watts (kW)" hint="Surplus solar after home usage" value={hasErrors ? '—' : `${formatNumber(feedInKw, 3)} kW`} testId="text-feed-in-kw" />
                </div>
                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[hsl(var(--border)/.75)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-[280px] text-[11px] leading-[1.45] text-[hsl(var(--muted-foreground))]">Your figures stay in this browser. No account, no upload, no fuss.</p>
                  <button type="button" data-testid="button-reset" onClick={reset} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[12px] font-bold text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
                    <RotateCcw className="h-3.5 w-3.5" /> Reset figures
                  </button>
                </div>
              </div>
            </form>

            <div className="animate-rise-in delay-2 flex flex-col gap-5">
              <section className="relative overflow-hidden rounded-[28px] bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-md)] sm:p-8" aria-live="polite" data-testid="result-card">
                <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border-[18px] border-[hsl(var(--accent)/.26)]" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--primary-foreground)/.66)]">02 — Daily total benefit</p>
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--accent)/.2)] text-[hsl(var(--accent))]">
                      <ArrowUp className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-10 font-serif text-[clamp(3rem,7vw,5.4rem)] font-semibold leading-none tracking-[-.075em]" data-testid="text-estimated-savings">
                    {totalBenefit === null ? '—' : formatPounds(totalBenefit)}
                  </p>
                  <p className="mt-3 max-w-[290px] text-[13px] leading-[1.5] text-[hsl(var(--primary-foreground)/.7)]">
                    {totalBenefit === null
                      ? 'Complete the figures to see your estimate.'
                      : isShortfall
                        ? 'Home-use savings for one day, based on the six-hour daylight window.'
                        : 'Home-use savings plus earnings from surplus energy exported in one day.'}
                  </p>
                </div>
              </section>

              <section className="rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.82)] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">The quick breakdown</h2>
                  <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">GBP / day</span>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Solar used at home</span>
                    <strong className="font-mono text-[12px]" data-testid="text-output-difference">{hasErrors ? '—' : `${formatNumber(Math.min(numbers.effectiveOutput, numbers.homeUsage))} W`}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Grid cost × output hours</span>
                    <strong className="font-mono text-[12px]" data-testid="text-rate-hours">{hasErrors ? '—' : `${formatPounds(numbers.costPerKwh)} / kWh × ${formatNumber(numbers.outputHours, 0)} hrs`}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Total feed-in watts</span>
                    <strong className="font-mono text-[12px]" data-testid="text-breakdown-feed-in-kw">{hasErrors ? '—' : `${formatNumber(feedInKw, 3)} kW`}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Feed-in earnings</span>
                    <strong className="font-mono text-[12px] text-[hsl(var(--primary))]" data-testid="text-feed-in-earnings">{feedInEarnings === null ? '—' : formatPounds(feedInEarnings)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-[hsl(var(--border)/.75)] pt-3">
                    <span className="text-[12px] font-bold">Total benefit</span>
                    <strong className="font-mono text-[12px] font-bold" data-testid="text-total-benefit">{totalBenefit === null ? '—' : formatPounds(totalBenefit)}</strong>
                  </div>
                  <div className="mt-4 border-t border-[hsl(var(--border)/.75)] pt-4">
                    <p className="font-mono text-[10px] leading-[1.6] text-[hsl(var(--muted-foreground))]" data-testid="text-formula">
                      Home savings = (solar used at home / 1,000) × (grid cost per kWh × output hours)
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] font-medium text-[hsl(var(--primary))]" data-testid="text-formula-value">
                      {hasErrors ? 'Add valid figures above' : `(${formatNumber(Math.min(numbers.effectiveOutput, numbers.homeUsage))} ÷ 1,000) × (${formatPounds(numbers.costPerKwh)} × ${formatNumber(numbers.outputHours, 0)})`}
                    </p>
                    <p className="mt-2 font-mono text-[10px] leading-[1.6] text-[hsl(var(--muted-foreground))]">
                      Feed-in earnings = (surplus / 1,000) × (feed-in tariff ÷ 100 × output hours)
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] font-medium text-[hsl(var(--primary))]">
                      {hasErrors ? 'Add valid figures above' : `(${formatNumber(feedInKw, 3)} × ${formatPence(numbers.feedInTariff)} ÷ 100) × ${formatNumber(numbers.outputHours, 0)}`}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section className="relative animate-rise-in delay-3 mt-7 overflow-hidden rounded-[28px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-md)]" aria-live="polite" data-testid="savings-summary">
            <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border-[18px] border-[hsl(var(--accent)/.26)]" aria-hidden="true" />
            <div className="relative flex flex-col gap-2 border-b border-[hsl(var(--primary-foreground)/.18)] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--primary-foreground)/.66)]">03 — Potential savings</p>
                <h2 className="mt-2 font-serif text-[26px] font-semibold tracking-[-.04em]">Your longer-term picture.</h2>
              </div>
              <p className="max-w-[330px] text-[11px] leading-[1.5] text-[hsl(var(--primary-foreground)/.7)]">Based on the same daily output repeating. Includes home-use savings and feed-in earnings.</p>
            </div>
            <div className="relative grid sm:grid-cols-3">
              <div className="px-5 py-6 sm:px-7">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--primary-foreground)/.62)]">One day</p>
                <strong className="mt-3 block font-serif text-[32px] font-semibold tracking-[-.05em]" data-testid="text-benefit-daily">{totalBenefit === null ? '—' : formatPounds(totalBenefit)}</strong>
                <p className="mt-1 text-[11px] text-[hsl(var(--primary-foreground)/.7)]">Your daily estimated benefit</p>
              </div>
              <div className="border-t border-[hsl(var(--primary-foreground)/.18)] px-5 py-6 sm:border-l sm:border-t-0 sm:px-7">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--primary-foreground)/.62)]">30 days</p>
                <strong className="mt-3 block font-serif text-[32px] font-semibold tracking-[-.05em]" data-testid="text-benefit-30-days">{thirtyDayBenefit === null ? '—' : formatPounds(thirtyDayBenefit)}</strong>
                <p className="mt-1 text-[11px] text-[hsl(var(--primary-foreground)/.7)]">Daily benefit × 30</p>
              </div>
              <div className="border-t border-[hsl(var(--primary-foreground)/.18)] px-5 py-6 sm:border-l sm:border-t-0 sm:px-7">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[hsl(var(--primary-foreground)/.62)]">One year</p>
                <strong className="mt-3 block font-serif text-[32px] font-semibold tracking-[-.05em]" data-testid="text-benefit-year">{annualBenefit === null ? '—' : formatPounds(annualBenefit)}</strong>
                <p className="mt-1 text-[11px] text-[hsl(var(--primary-foreground)/.7)]">Daily benefit × 365</p>
              </div>
            </div>
          </section>

          <footer className="animate-rise-in delay-3 mt-10 flex flex-col gap-3 border-t border-[hsl(var(--border)/.7)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <p className="text-[11px] leading-[1.5] text-[hsl(var(--muted-foreground))]">A planning estimate, not a bill. Actual generation changes with weather, shade, and the season.</p>
              <a
                href={`${import.meta.env.BASE_URL}downloads/pocket-solar-project.zip`}
                download
                className="focus-ring inline-flex min-h-10 w-fit shrink-0 items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-3.5 text-[11px] font-semibold text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
                data-testid="link-download-project"
              >
                <Download className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Download project ZIP
              </a>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-[hsl(var(--muted-foreground)/.72)]">Pocket Solar · v1</p>
          </footer>
        </main>
      </div>
      </div>
    </div>
  );
}

export default App;