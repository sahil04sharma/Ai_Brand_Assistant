async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

export function getBrands() {
  return request("/brands");
}

export function createBrand(name) {
  return request("/brands", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getBrandById(id) {
  return request(`/brands/${id}`);
}

export function sendChat(brandId, message) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ brand_id: brandId, message }),
  });
}
