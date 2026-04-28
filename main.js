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

const state = {
  shows: [],
  episodes: {},
  showsSearchTerm: "",
  episodesSearchTerm: "",
  selectedShowId: undefined,
};

episodesSearch.addEventListener("input", function (e) {
  if (!state.selectedShowId) return;
  const searchTerm = e.target.value.toLowerCase().trim();
  state.episodesSearchTerm = searchTerm;
  renderEpisodes();
});

showsSearch.addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  state.showsSearchTerm = searchTerm;
  renderShows();
});

backArrow.addEventListener("click", function () {
  resetSearchValue();
  state.selectedShowId = undefined;
  showShowsSection();
  renderShows();
});

showsSection.addEventListener("click", async function (e) {
  const clickedCard = e.target.closest(".show-card");
  if (!clickedCard) return;
  state.selectedShowId = clickedCard.dataset.id;

  if (!state.episodes[state.selectedShowId]) {
    const allEpisodes = await getEpisodes(state.selectedShowId);
    state.episodes[state.selectedShowId] = checkForArray(allEpisodes);
  }

  renderEpisodes();
});

async function setup() {
  try {
    if (state.shows.length === 0) {
      const allShows = await getShows();

      state.shows = checkForArray(allShows);
      state.shows.sort((a, b) => a.name.localeCompare(b.name));
    }

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
}

function renderEpisodes() {
  episodesSection.innerHTML = "";

  const { episodesSearchTerm } = state;
  const episodes = state.episodes[state.selectedShowId] ?? [];

  const filteredEpisodes = episodesSearchTerm
    ? search(episodes, episodesSearchTerm)
    : episodes;
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

    title.textContent = redefineEpisodeName(episode);
    imageElem.src = image?.medium ?? `./assets/404.png`;
    imageElem.alt = title.textContent;
    summaryElem.innerHTML = summary;

    return card;
  });

  episodesSection.append(...episodeCards);
  populateDropDownMenus();
  showEpisodesSection();
}

function resetSearchValue() {
  episodesSearch.value = "";
  showsSearch.value = "";
  state.episodesSearchTerm = "";
  state.showsSearchTerm = "";
}

function populateDropDownMenus() {
  showsDropDown.innerHTML = "";
  episodesDropDown.innerHTML = "";

  //Shows dropdown menu
  const showsOptions = state.shows.map((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    return option;
  });
  const defaultShowsOption = document.createElement("option");
  defaultShowsOption.value = "";
  defaultShowsOption.textContent = "All shows";
  showsDropDown.append(defaultShowsOption, ...showsOptions);
  if (state.selectedShowId) {
    const selectedOption = showsDropDown.querySelector(
      `option[value="${state.selectedShowId}"]`,
    );
    if (selectedOption) selectedOption.selected = true;
  }

  // Episodes dropdown menu
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

document.addEventListener("DOMContentLoaded", setup);
