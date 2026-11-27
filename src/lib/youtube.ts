const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;

export function getYouTubeVideoId(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id: string | null = null;

    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || null;
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else {
        const [kind, candidate] = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(kind)) id = candidate || null;
      }
    }

    return id && youtubeIdPattern.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function createYouTubeEmbed(videoId: string) {
  const wrapper = document.createElement("div");
  wrapper.className = "youtube-embed";

  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
  iframe.title = "YouTube動画プレーヤー";
  iframe.loading = "lazy";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allowFullscreen = true;
  wrapper.append(iframe);

  return wrapper;
}
