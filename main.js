import { getShows } from "./data.js";

const showsSection = document.getElementById("shows");
const showsHeader = document.getElementById("shows-header");
const episodeSection = document.getElementById("episode");
const episodeHeader = document.getElementById("episode-header");
const showCardTemplate = document.getElementById("show-card-template");
const showsSearch = document.getElementById("shows-search");

let shows = [];

showsSearch.addEventListener("input", function (e) {
  const searchTerm = e.target.toLowerCase();
});

async function setup() {
  try {
    const allShows = await getShows();

    if (!allShows || allShows.length === 0) {
      showsSection.textContent = "No shows available";
      return;
    }

    shows = allShows;

    makePageForShows();
  } catch (error) {
    console.error(error);
    showsSection.textContent = "Failed to load shows";
  }
}

function makePageForShows() {
  showsSection.innerHTML = "";
  const showCards = shows.map((show) => {
    const card = showCardTemplate.content.cloneNode(true);
    card.querySelector("h1").textContent = show.name ?? "N/A";
    card.querySelector("img").src = show.image?.medium || "./assets/404.png";
    card.querySelector("img").alt = show.name;
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
