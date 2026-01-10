document.addEventListener("DOMContentLoaded", function () {
    loadYouTube();
    loadMedium();
});

function loadYouTube() {
    const rssUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCt23oKZgRHDn7gmWVbs-IsQ";
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const container = document.getElementById("youtube-feed");

    if (!container) return;

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "ok") {
                container.innerHTML = "";
                const items = data.items.slice(0, 3);

                items.forEach((item) => {
                    const card = createCard(item, 'youtube');
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = "<p>Unable to load videos.</p>";
            }
        })
        .catch((error) => {
            console.error("Error fetching YouTube feed:", error);
            container.innerHTML = "<p>Unable to load videos.</p>";
        });
}

function loadMedium() {
    const rssUrl = "https://medium.com/feed/@maureenbarahona";
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const container = document.getElementById("medium-feed");

    if (!container) return;

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "ok") {
                container.innerHTML = "";
                const items = data.items.slice(0, 3);

                items.forEach((item) => {
                    const card = createCard(item, 'medium');
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = "<p>Unable to load articles.</p>";
            }
        })
        .catch((error) => {
            console.error("Error fetching Medium feed:", error);
            container.innerHTML = "<p>Unable to load articles.</p>";
        });
}

function createCard(item, type) {
    const card = document.createElement("a");
    card.href = item.link;
    card.target = "_blank";
    card.classList.add("blog-card");

    // Image handling
    const thumb = document.createElement("img");
    thumb.classList.add("blog-card-img");

    if (type === 'youtube') {
        const videoId = item.guid.split(":")[2];
        thumb.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    } else {
        // Medium usually puts the image in the content or thumbnail field
        // rss2json often extracts it to 'thumbnail', otherwise we try a regex on content
        if (item.thumbnail && item.thumbnail.startsWith("http")) {
            thumb.src = item.thumbnail;
        } else {
            // Fallback or extraction from content if needed
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            thumb.src = imgMatch ? imgMatch[1] : './img/logo.png'; // Fallback to logo
        }
    }
    thumb.alt = item.title;

    const info = document.createElement("div");
    info.classList.add("blog-card-info");

    const title = document.createElement("h4");
    title.textContent = item.title;

    const date = document.createElement("p");
    date.classList.add("blog-card-date");
    const dateObj = new Date(item.pubDate);
    date.textContent = dateObj.toLocaleDateString();

    info.appendChild(title);
    info.appendChild(date);
    card.appendChild(thumb);
    card.appendChild(info);

    return card;
}
