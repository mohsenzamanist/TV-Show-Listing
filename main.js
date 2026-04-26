import { getShows } from "./data.js";

const showsSection = document.getElementById("shows");
const showsHeader = document.getElementById("shows-header");
const episodeSection = document.getElementById("episode");
const episodeHeader = document.getElementById("episode-header");
const showCardTemplate = document.getElementById("show-card-template");
const showsSearch = document.getElementById("shows-search");

const state = { shows: [], searchTerm: "" };

showsSearch.addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  state.searchTerm = searchTerm;
  renderShows();
});

async function setup() {
  try {
    const allShows = await getShows();

    state.shows = Array.isArray(allShows) ? allShows : [];

    renderShows();
  } catch (error) {
    console.error(error);
    showsSection.textContent = "Failed to load shows";
  }
}

function renderShows() {
  showsSection.innerHTML = "";
  const { shows, searchTerm } = state;
  const filteredShows = searchTerm
    ? shows.filter((show) => {
        const name = show.name?.toLowerCase() ?? "";
        const summary = show.summary?.toLowerCase() ?? "";
        const genres = show.genres ?? [];

        return (
          name.includes(searchTerm) ||
          summary.includes(searchTerm) ||
          genres.some((genre) => genre.toLowerCase().includes(searchTerm))
        );
      })
    : shows;
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
    card.querySelector("h1").textContent = show.name ?? "N/A";
    card.querySelector("img").src = show.image?.medium || "./assets/404.png";
    card.querySelector("img").alt = show.name ?? "Show image";
    card.querySelector(".summary").innerHTML = show.summary ?? "N/A";
    card.querySelector(".rated span").textContent =
      show.rating?.average ?? "N/A";
    card.querySelector(".genres span").textContent =
      show.genres?.join(" | ") ?? "N/A";
    card.querySelector(".status span").textContent = show.status ?? "N/A";
    card.querySelector(".runtime span").textContent = show.runtime ?? "N/A";
    return card;
  });
  showsSection.append(...showCards);
}

document.addEventListener("DOMContentLoaded", setup);
