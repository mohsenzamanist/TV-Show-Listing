import { getEpisodes, getShows } from "./data.js";

const showsSection = document.getElementById("shows");
const showsHeader = document.getElementById("shows-header");
const episodesSection = document.getElementById("episodes");
const episodeHeader = document.getElementById("episode-header");
const showCardTemplate = document.getElementById("show-card-template");
const episodeCardTemplate = document.getElementById("episode-card-template");
const showsSearch = document.getElementById("shows-search");

const state = { shows: [], episodes: [], searchTerm: "" };

showsSearch.addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  state.searchTerm = searchTerm;
  renderShows();
});

async function setup() {
  try {
    const allShows = await getShows();

    state.shows = checkForArray(allShows);
    state.shows.sort((a, b) => a.name.localeCompare(b.name));

    renderShows();
  } catch (error) {
    console.error(error);
    showsSection.textContent = "Failed to load shows";
  }
}

function search() {
  return list.filter((item) => {
    const name = item.name?.toLowerCase() ?? "";
    const summary = item.summary?.toLowerCase() ?? "";
    const genres = item.genres ?? [];

    return (
      name.includes(searchTerm) ||
      summary.includes(searchTerm) ||
      genres.some((genre) => genre.toLowerCase().includes(searchTerm))
    );
  });
}

function renderShows() {
  showsSection.innerHTML = "";
  const { shows, searchTerm } = state;
  const filteredShows = searchTerm ? search(shows) : shows;
  if (filteredShows.length === 0) {
    const errorMessage = document.createElement("p");
    errorMessage.textContent = searchTerm
      ? "No matching shows to display."
      : "No shows available";
    showsSection.append(errorMessage);
    return;
  }
  const showCards = filteredShows.map((show) => {
    const card = showCardTemplate.content.cloneNode(true);

    const showCardDiv = card.querySelector(".show-card");
    const title = card.querySelector("h1");
    const image = card.querySelector("img");
    const summary = card.querySelector(".summary");
    const ratedSpan = card.querySelector(".rated span");
    const genres = card.querySelector(".genres span");
    const runtimeSpan = card.querySelector(".runtime span");
    const statusSpan = card.querySelector(".status span");

    showCardDiv.dataset.id = show.id;
    title.textContent = show.name ?? "N/A";
    image.src = show.image?.medium || "./assets/404.png";
    image.alt = show.name ?? "Show image";
    summary.innerHTML = show.summary ?? "N/A";
    ratedSpan.textContent = show.rating?.average ?? "N/A";
    genres.textContent = show.genres?.join(" | ") ?? "N/A";
    statusSpan.textContent = show.status ?? "N/A";
    runtimeSpan.textContent = show.runtime ?? "N/A";

    return card;
  });
  showsSection.append(...showCards);
  showShowsSection();
  showsSection.addEventListener("click", async function (e) {
    const clickedCard = e.target.closest(".show-card");
    if (!clickedCard) return;
    const allEpisodes = await getEpisodes(clickedCard.dataset.id);

    state.episodes = checkForArray(allEpisodes);
    renderEpisodes();
  });
}

function renderEpisodes() {
  episodesSection.innerHTML = "";
  const { episodes, searchTerm } = state;
  // searchTerm = "";

  const filteredEpisodes = searchTerm ? search(episodes) : episodes;
  if (filteredEpisodes.length === 0) {
    const errorMessage = document.createElement("p");
    errorMessage.textContent = searchTerm
      ? "no matching episode."
      : "no episodes to display";
    episodeSection.append(errorMessage);
  }

  const episodeCards = filteredEpisodes.map(
    ({ name, season, number, summary, image }) => {
      const card = episodeCardTemplate.content.cloneNode(true);
      const title = card.querySelector("h3");
      const imageElem = card.querySelector("img");
      const summaryElem = card.querySelector("p");

      title.textContent = redefineEpisodeName(name, season, number);
      imageElem.src = image.medium;
      imageElem.alt = title.textContent;
      summaryElem.innerHTML = summary;

      return card;
    },
  );

  episodesSection.append(...episodeCards);
  showEpisodesSection();
}

function showShowsSection() {
  showsSection.classList.remove("hidden");
  episodesSection.classList.add("hidden");
}
function showEpisodesSection() {
  showsSection.classList.add("hidden");
  episodesSection.classList.remove("hidden");
}

function redefineEpisodeName(name, season, number) {
  return `${name} - S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

function checkForArray(list) {
  return Array.isArray(list) ? list : [];
}

document.addEventListener("DOMContentLoaded", setup);
