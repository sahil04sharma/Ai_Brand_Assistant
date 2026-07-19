const EMPTY_STATE = {
  brandName: "",
  tagline: "",
  targetAudience: "",
  tone: "",
  keywords: [],
};

export default function StatePanel({ brand }) {
  const state = brand?.state ?? EMPTY_STATE;

  const fields = [
    { label: "Brand name", value: state.brandName },
    { label: "Tagline", value: state.tagline },
    { label: "Target audience", value: state.targetAudience },
    { label: "Tone", value: state.tone },
  ];

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Brand state</h2>
      <p className="mt-1 text-xs text-slate-500">
        Updates after each chat turn — proves context per brand.
      </p>

      {!brand ? (
        <p className="mt-4 text-sm text-slate-500">No brand selected.</p>
      ) : (
        <dl className="mt-4 space-y-3">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {f.label}
              </dt>
              <dd className="mt-0.5 text-sm text-slate-900">
                {f.value || "—"}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Keywords
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {state.keywords?.length
                ? state.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {k}
                    </span>
                  ))
                : "—"}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
