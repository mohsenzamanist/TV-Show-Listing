import { getEpisodes, getShows } from "./data.js";

const showsSection = document.getElementById("shows");
const showsHeader = document.getElementById("shows-header");
const episodesSection = document.getElementById("episodes");
const episodesHeader = document.getElementById("episodes-header");
const showCardTemplate = document.getElementById("show-card-template");
const episodeCardTemplate = document.getElementById("episode-card-template");
const showsSearch = document.getElementById("shows-search");
const episodesSearch = document.getElementById("episodes-search");
const showsDropDown = document.getElementById("shows-drop-down");
const episodesDropDown = document.getElementById("episodes-drop-down");
const backArrow = document.getElementById("back-arrow");
const numberOfEpisodes = document.getElementById("number-of-episodes");
const numberOfShows = document.getElementById("number-of-shows");

const state = {
  shows: [],
  episodes: {},
  showsSearchTerm: "",
  episodesSearchTerm: "",
  selectedShowId: undefined,
};

const handleEpisodesSearch = debounce(function (e) {
  if (!state.selectedShowId) return;
  const searchTerm = e.target.value.toLowerCase().trim();
  state.episodesSearchTerm = searchTerm;
  renderEpisodes();
}, 500);

episodesSearch.addEventListener("input", handleEpisodesSearch);

const handleShowsSearch = debounce(function (e) {
  const searchTerm = e.target.value.toLowerCase().trim();

  state.showsSearchTerm = searchTerm;

  renderShows();
}, 500);

showsSearch.addEventListener("input", handleShowsSearch);

backArrow.addEventListener("click", function () {
  resetSearchValue();
  state.selectedShowId = undefined;
  showShowsSection();
  renderShows();
});

showsSection.addEventListener("click", async function (e) {
  const clickedCard = e.target.closest(".show-card");
  if (!clickedCard) return;
  const showId = clickedCard.dataset.id;

  state.selectedShowId = showId;
  await ensureEpisodesLoaded(showId);

  if (state.selectedShowId === showId) renderEpisodes();
});

showsDropDown.addEventListener("change", async function (e) {
  const showId = e.target.value;
  if (!showId) return;

  state.selectedShowId = showId;
  await ensureEpisodesLoaded(showId);

  resetSearchValue();

  if (state.selectedShowId === showId) {
    renderEpisodes();
  }
});

episodesDropDown.addEventListener("change", function (e) {
  const episodeId = e.target.value;
  if (!episodeId) {
    renderEpisodes();
    return;
  }
  renderSelectedEpisode(episodeId);
});

async function setup() {
  try {
    if (state.shows.length === 0) {
      const allShows = await getShows();

      state.shows = checkForArray(allShows);
      state.shows.sort((a, b) => a.name.localeCompare(b.name));
    }
    populateShowsDropDownMenu();

    renderShows();
  } catch (error) {
    console.error(error);
    showsSection.textContent = "Failed to load shows";
  }
}

function search(list, searchTerm) {
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

  const { shows, showsSearchTerm } = state;
  const filteredShows = showsSearchTerm
    ? search(shows, showsSearchTerm)
    : shows;

  numberOfShows.textContent = `Displaying ${filteredShows.length}/${shows.length} shows`;

  if (filteredShows.length === 0) {
    const errorMessage = document.createElement("p");
    errorMessage.textContent = showsSearchTerm
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
    title.innerHTML = highlightSearchTerm(show.name, showsSearchTerm) ?? "N/A";
    image.src = show.image?.medium || "./assets/404.png";
    image.alt = show.name ?? "Show image";
    summary.innerHTML =
      highlightSearchTerm(show.summary, showsSearchTerm) ?? "N/A";
    ratedSpan.textContent = show.rating?.average ?? "N/A";
    genres.innerHTML =
      highlightSearchTerm(show.genres?.join(" | "), showsSearchTerm) ?? "N/A";
    statusSpan.textContent = show.status ?? "N/A";
    runtimeSpan.textContent = show.runtime ?? "N/A";

    return card;
  });
  showsSection.append(...showCards);

  showShowsSection();
}

function renderEpisodes() {
  episodesSection.innerHTML = "";
  showsDropDown.value = state.selectedShowId ?? "";
  const { episodesSearchTerm } = state;
  const episodes = state.episodes[state.selectedShowId] ?? [];

  const filteredEpisodes = episodesSearchTerm
    ? search(episodes, episodesSearchTerm)
    : episodes;
  numberOfEpisodes.textContent = `Displaying ${filteredEpisodes.length}/${episodes.length} episodes.`;
  if (filteredEpisodes.length === 0) {
    const errorMessage = document.createElement("p");
    errorMessage.textContent = episodesSearchTerm
      ? "no matching episode."
      : "no episodes to display";
    episodesSection.append(errorMessage);

    return;
  }

  const episodeCards = filteredEpisodes.map((episode) => {
    const { name, season, number, summary, image } = episode;
    const card = episodeCardTemplate.content.cloneNode(true);
    const title = card.querySelector("h3");
    const imageElem = card.querySelector("img");
    const summaryElem = card.querySelector("p");

    title.innerHTML = highlightSearchTerm(
      redefineEpisodeName(episode),
      episodesSearchTerm,
    );
    imageElem.src = image?.medium ?? `./assets/404.png`;
    imageElem.alt = title.textContent;
    summaryElem.innerHTML = highlightSearchTerm(summary, episodesSearchTerm);

    return card;
  });

  episodesSection.append(...episodeCards);
  populateEpisodesDropDownMenu();

  showEpisodesSection();
}

function renderSelectedEpisode(id) {
  const episode = state.episodes[state.selectedShowId]?.find(
    (e) => e.id === Number(id),
  );
  if (!episode) return;

  const { image, summary } = episode;

  episodesSection.innerHTML = "";
  resetSearchValue();

  const card = episodeCardTemplate.content.cloneNode(true);
  const title = card.querySelector("h3");
  const imageElem = card.querySelector("img");
  const summaryElem = card.querySelector("p");

  title.textContent = redefineEpisodeName(episode);
  imageElem.src = image?.medium ?? `./assets/404.png`;
  imageElem.alt = title.textContent;
  summaryElem.innerHTML = summary;

  episodesSection.appendChild(card);
  numberOfEpisodes.textContent = `Displaying 1/${state.episodes[state.selectedShowId].length} episodes.`;
}

async function ensureEpisodesLoaded(showId) {
  if (!state.episodes[showId]) {
    const allEpisodes = await getEpisodes(showId);
    state.episodes[showId] = checkForArray(allEpisodes);
  }
}

function resetSearchValue() {
  episodesSearch.value = "";
  showsSearch.value = "";
  state.episodesSearchTerm = "";
  state.showsSearchTerm = "";
}

function populateShowsDropDownMenu() {
  showsDropDown.innerHTML = "";

  const showsOptions = state.shows.map((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    return option;
  });
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a show";

  showsDropDown.append(defaultOption, ...showsOptions);
  if (state.selectedShowId) {
    const selectedOption = showsDropDown.querySelector(
      `option[value="${state.selectedShowId}"]`,
    );
    if (selectedOption) selectedOption.selected = true;
  }
}

function populateEpisodesDropDownMenu() {
  episodesDropDown.innerHTML = "";

  const episodes = state.episodes[state.selectedShowId] ?? [];
  const defaultEpisodeOption = document.createElement("option");

  const episodesOptions = episodes.map((episode) => {
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = redefineEpisodeName(episode);
    return option;
  });
  defaultEpisodeOption.value = "";
  defaultEpisodeOption.textContent = "All episodes";
  episodesDropDown.append(defaultEpisodeOption, ...episodesOptions);
}

function showShowsSection() {
  showsSection.classList.remove("hidden");
  showsHeader.classList.remove("hidden");
  episodesSection.classList.add("hidden");
  episodesHeader.classList.add("hidden");
}
function showEpisodesSection() {
  showsSection.classList.add("hidden");
  showsHeader.classList.add("hidden");

  episodesSection.classList.remove("hidden");
  episodesHeader.classList.remove("hidden");
}

function redefineEpisodeName({ name, season, number }) {
  return `${name} - S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

function checkForArray(list) {
  return Array.isArray(list) ? list : [];
}

function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(searchTerm, "gi");
  return text.replace(regex, "<mark>$&</mark>");
}

function debounce(callback, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
document.addEventListener("DOMContentLoaded", setup);
