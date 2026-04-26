const cache = new Map();

async function fetchOnce(url) {
  if (cache.has(url)) return cache.get(url);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  const data = await response.json();
  cache.set(url, data);
  return data;
}

export function getShows() {
  const url = "https://api.tvmaze.com/shows";

  return fetchOnce(url);
}
