import { useCallback, useEffect, useRef, useState } from "react";
import BrandDropdown from "./components/BrandDropdown";
import ChatWindow from "./components/ChatWindow";
import StatePanel from "./components/StatePanel";
import {
  createBrand,
  getBrandById,
  getBrands,
  sendChat,
} from "./api";

export default function App() {
  const [brands, setBrands] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [listError, setListError] = useState("");
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const refreshBrands = useCallback(async () => {
    const list = await getBrands();
    setBrands(list);
    return list;
  }, []);

  useEffect(() => {
    refreshBrands().catch((err) => setListError(err.message));
  }, [refreshBrands]);

  // Fully reload brand on switch — clears previous brand from UI
  useEffect(() => {
    if (!selectedId) {
      setBrand(null);
      return;
    }

    let cancelled = false;
    setBrand(null);
    setLoadingBrand(true);

    getBrandById(selectedId)
      .then((data) => {
        if (!cancelled) setBrand(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setBrand(null);
          setListError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBrand(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function handleCreated(name) {
    const created = await createBrand(name);
    await refreshBrands();
    setSelectedId(created._id);
  }

  async function handleSend(message) {
    const brandId = selectedId;
    if (!brandId) return;

    await sendChat(brandId, message);
    const updated = await getBrandById(brandId);

    // Ignore stale result if the user switched brands mid-request
    if (selectedIdRef.current === brandId) {
      setBrand(updated);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-[18px] font-semibold tracking-tight sm:text-[20px]">
          AI Brand Assistant
        </h1>
        <p className="text-sm text-slate-500">
          Multi-brand chat with isolated context
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[1fr_280px]">
        <section className="flex min-w-0 flex-col gap-4">
          {listError && (
            <p className="rounded-[8px] bg-red-50 px-3 py-2 text-[14px] text-red-700">
              {listError}
            </p>
          )}

          <BrandDropdown
            brands={brands}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreated={handleCreated}
          />

          {loadingBrand ? (
            <div className="rounded-[10px] border border-slate-200 bg-white p-6 text-[14px] text-slate-500">
              Loading brand…
            </div>
          ) : (
            <ChatWindow
              brand={brand}
              onSend={handleSend}
              disabled={!selectedId}
            />
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="order-2 rounded-[10px] border border-slate-200 bg-white p-4 lg:order-1">
            <h2 className="text-[13px] font-semibold text-slate-500">
              How to use
            </h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[14px] leading-relaxed text-slate-700">
              <li>
                Create a brand (e.g. &quot;Fitness Brand&quot;) or select one from
                the dropdown.
              </li>
              <li>
                Chat about what you want — try &quot;I want a fitness brand&quot;,
                then &quot;Make it more premium&quot;.
              </li>
              <li>
                Watch the Brand state panel update after each reply (name,
                tagline, audience, tone, keywords).
              </li>
              <li>
                Switch brands in the dropdown to load that brand&apos;s own chat
                and state — contexts stay isolated.
              </li>
            </ol>
          </div>

          <div className="order-1 lg:order-2">
            <StatePanel brand={loadingBrand ? null : brand} />
          </div>
        </aside>
      </main>
    </div>
  );
}
