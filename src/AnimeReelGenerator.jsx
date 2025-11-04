import React, { useState } from "react";

export default function AnimeReelGenerator() {
  const [anime, setAnime] = useState("");
  const [scene, setScene] = useState("Fight");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const sceneOptions = [
    "Fight",
    "Sad",
    "Funny",
    "Emotional",
    "Romantic",
    "Action",
    "Reveal",
    "Transformation",
  ];

  function localGenerate(anime, scene, n) {
    const hooks = {
      Fight: ["Clash of fate", "Last strike", "Unleashed power", "Shocking counter"],
      Sad: ["Tearful goodbye", "Lonely rain", "Regret whispers", "Empty room"],
      Funny: ["Awkward moment", "Mischief plan", "Epic fail", "Meme reaction"],
      Emotional: ["Heartbroken truth", "Promise kept", "Memories flash", "Silent vow"],
      Romantic: ["Starry confession", "A shy smile", "Hold my hand", "First kiss"],
      Action: ["Chase sequence", "Explosive entry", "Hero landing", "High-speed clash"],
      Reveal: ["Hidden truth", "Masked identity", "Secret past", "Plot twist"],
      Transformation: ["Awaken power", "Metamorphosis", "New form", "Rising phoenix"],
    };

    const musicSuggestions = [
      "Epic orchestral build",
      "Slow piano emotional",
      "Lo-fi chill beat",
      "Fast EDM drop",
      "Anime OP-style anthem",
    ];

    const hashtagsBase = ["#anime", "#animeedit", "#amv", "#otaku", "#animeclips"];

    const out = [];
    for (let i = 0; i < n; i++) {
      const hook = hooks[scene] ? hooks[scene][i % hooks[scene].length] : hooks["Fight"][i % 4];
      const dialogue = `"${hook} — ${anime || "Unknown"}"`;
      const caption = `${hook} • ${anime || "Anime"}`;
      const tags = [...hashtagsBase, `#${anime ? anime.replace(/\s+/g, "") : "AnimeFan"}`, `#${scene}`]
        .slice(0, 8)
        .join(" ");
      const music = musicSuggestions[i % musicSuggestions.length];
      out.push({ anime: anime || "Unknown", scene, dialogue, caption, hashtags: tags, music });
    }
    return out;
  }

  async function generateIdeas() {
    setError("");
    setResults([]);
    setLoading(true);

    const n = Math.max(1, Math.min(10, parseInt(count) || 3));

    if (!apiKey) {
      const out = localGenerate(anime, scene, n);
      setResults(out);
      setLoading(false);
      return;
    }

    try {
      const system = `You are an assistant that creates short, punchy Instagram Reel ideas for anime edits. For each idea return: Anime Name, Scene Type, Dialogue Idea (short), Short Caption (<=10 words), 5 trending hashtags, and a brief music suggestion.`;
      const userPrompt = `Create ${n} anime reel ideas for anime: "${anime || "any popular anime"}" and scene type: "${scene}". Format the response as JSON array of objects with keys: anime, scene, dialogue, caption, hashtags (array of strings), music.`;

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 700,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API Error: ${resp.status} ${text}`);
      }

      const data = await resp.json();
      const assistantMsg = data?.choices?.[0]?.message?.content || "";

      let parsed = null;
      try {
        parsed = JSON.parse(assistantMsg);
      } catch (e) {
        const match = assistantMsg.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) parsed = JSON.parse(match[0]);
      }

      if (!parsed) {
        setResults([{ anime: anime || "Unknown", scene, dialogue: assistantMsg.slice(0, 400), caption: "", hashtags: "", music: "" }]);
      } else {
        const normalized = parsed.map((it) => ({
          anime: it.anime || anime || "Unknown",
          scene: it.scene || scene,
          dialogue: it.dialogue || it.line || "",
          caption: it.caption || "",
          hashtags: Array.isArray(it.hashtags) ? it.hashtags.join(" ") : (it.hashtags || "").toString(),
          music: it.music || "",
        }));
        setResults(normalized);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
      const out = localGenerate(anime, scene, n);
      setResults(out);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard");
    }).catch(() => alert("Copy failed"));
  }

  function downloadCSV() {
    const rows = results.map((r) => [r.anime, r.scene, `"${r.dialogue.replace(/"/g, '""')}"`, `"${r.caption.replace(/"/g, '""')}"`, `"${r.hashtags.replace(/"/g, '""')}"`, `"${r.music.replace(/"/g, '""')}"`]);
    const header = ["Anime", "Scene", "Dialogue", "Caption", "Hashtags", "Music"];
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anime_reel_ideas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-xl mx-auto p-4 min-h-screen bg-gradient-app text-white">
      <div className="bg-black/60 rounded-2xl p-4 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Anime Reel Generator</h1>
        <p className="text-sm text-gray-300 mb-4">Mobile-friendly tool to create reel ideas, captions & hashtags. Use your OpenAI API key for richer output (optional).</p>

        <label className="block mb-2 text-gray-200 text-sm">Anime name</label>
        <input value={anime} onChange={e=>setAnime(e.target.value)} className="w-full mb-3 p-3 rounded-lg text-black" placeholder="e.g. Attack on Titan" />

        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-200 mb-1">Scene type</label>
            <select value={scene} onChange={e=>setScene(e.target.value)} className="w-full p-3 rounded-lg text-black">
              {sceneOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-sm text-gray-200 mb-1">Count</label>
            <input type="number" min={1} max={10} value={count} onChange={e=>setCount(e.target.value)} className="w-full p-3 rounded-lg text-black" />
          </div>
        </div>

        <label className="block mb-1 text-sm text-gray-200">OpenAI API Key (optional)</label>
        <input value={apiKey} onChange={e=>setApiKey(e.target.value)} className="w-full mb-3 p-3 rounded-lg text-black" placeholder="sk-... (leave empty to use local generator)" />
        <div className="flex gap-2">
          <button onClick={generateIdeas} disabled={loading} className="flex-1 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold">{loading ? 'Generating...' : 'Generate Ideas'}</button>
          <button onClick={()=>{ setResults([]); setError(''); }} className="p-3 rounded-xl bg-gray-700">Clear</button>
        </div>

        {error && <div className="mt-3 p-3 bg-red-600 rounded-md">{error}</div>}

        <div className="mt-4 space-y-3">
          {results.length > 0 && <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">{results.length} idea(s) ready</div>
            <div className="flex gap-2">
              <button onClick={downloadCSV} className="text-sm p-2 rounded-md bg-emerald-600">Save CSV</button>
            </div>
          </div>}

          {results.map((r, idx) => (
            <div key={idx} className="bg-white/6 p-3 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-300">{r.anime} • {r.scene}</div>
                  <div className="font-semibold text-lg mt-1">{r.caption}</div>
                </div>
                <div className="text-xs text-gray-400">#{idx+1}</div>
              </div>

              <div className="mt-3 text-sm text-gray-200">Dialogue: <span className="font-medium">{r.dialogue}</span></div>
              <div className="mt-2 text-sm text-gray-200">Music: <span className="font-medium">{r.music}</span></div>
              <div className="mt-2 text-sm text-gray-200">Hashtags:</div>
              <pre className="bg-black/40 p-2 rounded mt-1 text-xs overflow-x-auto">{typeof r.hashtags === 'string' ? r.hashtags : (r.hashtags || []).join(' ')}</pre>

              <div className="mt-3 flex gap-2">
                <button onClick={()=>copyToClipboard(r.caption)} className="p-2 rounded-md bg-indigo-600 text-sm">Copy Caption</button>
                <button onClick={()=>copyToClipboard(typeof r.hashtags === 'string' ? r.hashtags : (r.hashtags || []).join(' '))} className="p-2 rounded-md bg-yellow-600 text-sm">Copy Hashtags</button>
                <button onClick={()=>copyToClipboard(`${r.dialogue}\n\n${r.caption}\n\n${typeof r.hashtags === 'string' ? r.hashtags : (r.hashtags || []).join(' ')}`)} className="p-2 rounded-md bg-gray-700 text-sm">Copy All</button>
              </div>
            </div>
          ))}

        </div>

        <div className="mt-4 text-xs text-gray-400">
          <p><strong>Note:</strong> Putting your OpenAI API key in the browser exposes it to anyone using your device. For safe usage, consider running a small backend that holds the key and forwards requests.</p>
        </div>
      </div>
    </div>
  );
}
