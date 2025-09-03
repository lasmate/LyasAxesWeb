// Local mock fetcher: reads a local CSV and renders repo cards like the online fetcher.
// Usage: include <script src="../scripts/githumrepofetch_local.js" defer></script> on pages that need prototyping.

const CACHE_DURATION_LOCAL = 3600000; // 1 hour
const CACHE_KEYS_LOCAL = { REPOS: 'github_repos_local_cache', TIMESTAMP: 'github_repos_local_cache_time' };
const MOCK_CSV_PATH = 'scripts/mock_repos.csv'; // default path; function will try a few common alternatives
const GITHUB_USERNAME_LOCAL = 'lasmate';

document.addEventListener('DOMContentLoaded', () => {
  // try cache first
  const cache = localStorage.getItem(CACHE_KEYS_LOCAL.REPOS);
  const cacheTime = localStorage.getItem(CACHE_KEYS_LOCAL.TIMESTAMP);
  if (cache && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION_LOCAL) {
    const repos = JSON.parse(cache);
    renderReposLocal(repos);
    return;
  }

  fetchLocalCSVAndRender();
});

async function fetchLocalCSVAndRender() {
  const repoList = document.getElementById('repo-list');
  if (!repoList) return;
  try {
  repoList.innerHTML = '<li><div style="background-color: var(--bg-0b344f); border-radius: 10px; padding: 10px; margin-bottom: 15px; width:80vw;">Loading mock repositories...</div></li>';
    // try a set of candidate paths because pages may live in subfolders
    const candidates = [MOCK_CSV_PATH, '../' + MOCK_CSV_PATH, './' + MOCK_CSV_PATH, '/' + MOCK_CSV_PATH];
    let resp = null;
    let tried = [];
    for (const p of candidates) {
      try {
        tried.push(p);
        const r = await fetch(p);
        if (r && r.ok) { resp = r; break; }
      } catch (e) {
        // continue trying
      }
    }
    if (!resp) throw new Error('Failed to load mock CSV from candidates: ' + tried.join(', '));
    const text = await resp.text();
    const repos = parseMockCSV(text);
    // cache
    localStorage.setItem(CACHE_KEYS_LOCAL.REPOS, JSON.stringify(repos));
    localStorage.setItem(CACHE_KEYS_LOCAL.TIMESTAMP, Date.now().toString());
    renderReposLocal(repos);
  } catch (err) {
  console.error('Error loading mock repos CSV:', err);
    // fall back to empty state
  repoList.innerHTML = '<li><div style="background-color: var(--bg-0b344f); border-radius: 10px; padding: 10px; margin-bottom: 15px; width:80vw;">Unable to load mock repos.</div></li>';
  }
}

function parseMockCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length <= 1) return [];
  const header = lines[0].split(',');
  const rows = lines.slice(1);
  const repos = rows.map(line => {
    // split by commas not inside quotes
    const parts = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(p => p.trim());
    // remove surrounding quotes from fields
    const clean = parts.map(p => (p.startsWith('"') && p.endsWith('"')) ? p.slice(1, -1) : p);
    const [name, html_url, description, updated_at, languages] = clean;
    return {
      name: name || 'untitled',
      html_url: html_url || '#',
      description: description || '',
      updated_at: updated_at || new Date().toISOString(),
      languages: parseLanguagesField(languages || '')
    };
  });
  return repos;
}

function parseLanguagesField(field) {
  // field format: "Lang1:bytes;Lang2:bytes"
  if (!field) return {};
  const parts = field.split(';').map(s => s.trim()).filter(Boolean);
  const obj = {};
  for (const p of parts) {
    const [k, v] = p.split(':');
    if (!k) continue;
    obj[k.trim()] = Number(v) || 0;
  }
  return obj;
}

function renderReposLocal(repos) {
  const repoList = document.getElementById('repo-list');
  if (!repoList) return;
  repoList.innerHTML = '';
  const frag = document.createDocumentFragment();

  for (const repo of repos) {
    const languagesList = Object.entries(repo.languages || {})
      .sort((a,b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0,3);

    const li = document.createElement('li');
    li.innerHTML = `
  <div style="background-color: var(--bg-353535); border-radius: 10px; padding: 10px; margin-bottom: 15px; width:60vw;" class="repo-card">
        <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 10px;">
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" style="font-weight: thin; font-size: large;">${repo.name} :</a><br> ${repo.description || 'No description available'}<br>
  <div style="color: rgba(217,217,217,1); font-size: larger;">Main languages: ${languagesList.length ? languagesList.join(', ') : 'None detected'}</div><br>
        Last updated: ${new Date(repo.updated_at).toLocaleString()}<br>
        <div class="github-embed" style="margin-top: 10px;">
          <iframe 
            src="https://ghbtns.com/github-btn.html?user=${GITHUB_USERNAME_LOCAL}&repo=${repo.name}&type=star&count=true&size=large" 
            frameborder="0" 
            scrolling="0" 
            width="170" 
            height="30" 
            title="${repo.name} GitHub Stars"
            loading="lazy">
          </iframe>
        </div>
      </div>
    `;
    frag.appendChild(li);
  }

  // refresh button
  const refreshItem = document.createElement('li');
  refreshItem.innerHTML = `
    <button id="mock-refresh" style="background: rgba(13,17,23,1); border: 1px solid rgba(48,54,61,1); color: rgba(201,209,217,1); padding: 5px 10px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
      Refresh Mock Data
    </button>
  `;
  frag.appendChild(refreshItem);

  repoList.appendChild(frag);

  document.getElementById('mock-refresh').addEventListener('click', () => {
    localStorage.removeItem(CACHE_KEYS_LOCAL.REPOS);
    localStorage.removeItem(CACHE_KEYS_LOCAL.TIMESTAMP);
    fetchLocalCSVAndRender();
  });
}
