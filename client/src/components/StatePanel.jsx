import { useEffect, useRef, useState } from "react";

const EMPTY_STATE = {
  brandName: "",
  tagline: "",
  targetAudience: "",
  tone: "",
  keywords: [],
};

const FIELD_KEYS = [
  "brandName",
  "tagline",
  "targetAudience",
  "tone",
  "keywords",
];

function keywordsKey(keywords) {
  return Array.isArray(keywords) ? keywords.join("|") : "";
}

export default function StatePanel({ brand }) {
  const state = brand?.state ?? EMPTY_STATE;
  const [flashing, setFlashing] = useState({});
  const prevRef = useRef(null);
  const brandIdRef = useRef(brand?._id);

  useEffect(() => {
    // Reset comparison baseline when switching brands — no flash on load
    if (brandIdRef.current !== brand?._id) {
      brandIdRef.current = brand?._id;
      prevRef.current = brand?.state
        ? {
            brandName: brand.state.brandName || "",
            tagline: brand.state.tagline || "",
            targetAudience: brand.state.targetAudience || "",
            tone: brand.state.tone || "",
            keywords: keywordsKey(brand.state.keywords),
          }
        : null;
      setFlashing({});
      return;
    }

    if (!brand?.state) return;

    const prev = prevRef.current;
    const next = {
      brandName: state.brandName || "",
      tagline: state.tagline || "",
      targetAudience: state.targetAudience || "",
      tone: state.tone || "",
      keywords: keywordsKey(state.keywords),
    };

    if (!prev) {
      prevRef.current = next;
      return;
    }

    const changed = {};
    for (const key of FIELD_KEYS) {
      if (prev[key] !== next[key]) {
        changed[key] = true;
      }
    }

    prevRef.current = next;

    if (Object.keys(changed).length === 0) return;

    setFlashing(changed);
    const timer = setTimeout(() => setFlashing({}), 1500);
    return () => clearTimeout(timer);
  }, [brand?._id, brand?.state, state]);

  const fields = [
    { key: "brandName", label: "Brand name", value: state.brandName },
    { key: "tagline", label: "Tagline", value: state.tagline },
    {
      key: "targetAudience",
      label: "Target audience",
      value: state.targetAudience,
    },
    { key: "tone", label: "Tone", value: state.tone },
  ];

  return (
    <div className="rounded-[10px] border border-slate-200 bg-white p-4">
      <h2 className="text-[13px] font-semibold text-slate-500">Brand state</h2>
      <p className="mt-1 text-[12px] text-slate-500">
        Updates after each chat turn — proves context per brand.
      </p>

      {!brand ? (
        <p className="mt-4 text-[14px] text-slate-500">No brand selected.</p>
      ) : (
        <dl className="mt-4 space-y-3">
          {fields.map((f) => (
            <div
              key={f.key}
              className={`-mx-1 rounded-[8px] px-1 py-0.5 ${
                flashing[f.key] ? "state-flash" : "state-flash-idle"
              }`}
            >
              <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {f.label}
              </dt>
              <dd className="mt-0.5 text-[14px] text-slate-900">
                {f.value || "—"}
              </dd>
            </div>
          ))}
          <div
            className={`-mx-1 rounded-[8px] px-1 py-0.5 ${
              flashing.keywords ? "state-flash" : "state-flash-idle"
            }`}
          >
            <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Keywords
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1.5 text-[14px] text-slate-900">
              {state.keywords?.length
                ? state.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[12px] text-indigo-800"
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
