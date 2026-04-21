(function () {
    const repoOwner = 'krasyid822';
    const apiBase = `https://api.github.com/users/${repoOwner}/repos`;
    const searchApiBase = 'https://api.github.com/search/repositories';
    const repoCacheKey = `repo-cache-${repoOwner}-v1`;
    const repoCacheTtlMs = 1000 * 60 * 60 * 6;
    const container = document.getElementById('shortcut-container');
    const title = document.querySelector('h1');

    if (!container) {
        return;
    }

    document.title = `${repoOwner} Repositories`;
    if (title) {
        title.textContent = `${repoOwner} Repositories`;
    }

    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .repo-controls {
            width: min(1200px, 100%);
            margin: 0 auto 20px;
            display: grid;
            gap: 14px;
            padding: 18px;
            border-radius: 22px;
            border: 1px solid var(--border-color);
            background: var(--card-background);
            box-shadow: 0 12px 28px var(--shadow-color);
            backdrop-filter: blur(10px);
            box-sizing: border-box;
        }

        .repo-dark-toggle {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 14px;
            justify-content: space-between;
        }

        .repo-dark-text {
            display: grid;
            gap: 4px;
            min-width: 180px;
        }

        .repo-dark-actions {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .repo-search-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 12px;
            align-items: center;
        }

        .repo-search-input {
            width: 100%;
            min-width: 0;
            padding: 14px 16px;
            border-radius: 16px;
            border: 1px solid var(--border-color);
            font: inherit;
            color: var(--text-color);
            background: var(--card-background);
        }

        .repo-search-input::placeholder {
            color: var(--muted-color);
            opacity: 1;
        }

        .repo-clear-button {
            padding: 14px 16px;
            border: none;
            border-radius: 16px;
            cursor: pointer;
            font: inherit;
            font-weight: 700;
            color: #ffffff;
            background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
            box-shadow: 0 10px 20px rgba(29, 78, 216, 0.22);
        }

        .repo-metrics {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
        }

        .repo-metric-card {
            padding: 16px;
            border-radius: 18px;
            background: var(--card-background);
            border: 1px solid var(--border-color);
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }

        .repo-metric-label {
            display: block;
            margin-bottom: 6px;
            font-size: 0.85rem;
            color: var(--muted-color);
        }

        .repo-metric-value {
            font-size: 1.65rem;
            line-height: 1;
            color: var(--text-color);
        }

        .repo-status {
            display: inline-flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            justify-self: start;
            padding: 10px 14px;
            border-radius: 999px;
            background: var(--accent-soft);
            border: 1px solid var(--border-color);
            color: var(--text-color);
            font-size: 0.92rem;
        }

        .repo-status-separator {
            color: var(--muted-color);
            opacity: 0.7;
        }

        .repo-status-link {
            color: var(--accent-color);
            text-decoration: none;
            font-weight: 700;
            white-space: nowrap;
        }

        .repo-status-text {
            overflow-wrap: anywhere;
        }

        .repo-status-link:hover {
            text-decoration: underline;
        }

        .repo-status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        @media (max-width: 768px) {
            .repo-controls {
                padding: 14px;
                border-radius: 16px;
            }

            .repo-search-row,
            .repo-metrics {
                grid-template-columns: 1fr;
            }

            .repo-dark-text {
                min-width: 0;
            }

            .repo-dark-actions {
                width: 100%;
                justify-content: flex-start;
            }

            .repo-clear-button {
                width: 100%;
            }

            .repo-status {
                justify-self: stretch;
                justify-content: center;
                border-radius: 16px;
            }
        }

        @media (max-width: 540px) {
            .repo-status {
                align-items: flex-start;
                justify-content: flex-start;
            }

            .repo-status-separator {
                display: none;
            }

            .repo-status-link {
                width: 100%;
                white-space: normal;
            }

            .repo-metric-value {
                font-size: 1.4rem;
            }
        }
    `;
    document.head.appendChild(styleElement);

    const intro = document.createElement('p');
    intro.textContent = `Menampilkan repository publik milik ${repoOwner}. Gunakan pencarian untuk memfilter repo berdasarkan nama, deskripsi, bahasa, atau topic.`;
    intro.style.maxWidth = '1200px';
    intro.style.margin = '0 auto 18px';
    intro.style.textAlign = 'center';
    intro.style.lineHeight = '1.6';
    intro.style.color = 'var(--text-color)';
    intro.style.opacity = '0.85';
    if (title && title.parentElement) {
        title.parentElement.insertAdjacentElement('afterend', intro);
    }

    const controls = document.createElement('section');
    controls.className = 'repo-controls';

    const darkModeCard = document.createElement('div');
    darkModeCard.className = 'shortcut-card toggle-card';
    darkModeCard.style.alignItems = 'stretch';
    darkModeCard.style.textAlign = 'left';
    darkModeCard.style.minHeight = 'auto';
    darkModeCard.style.padding = '18px';
    darkModeCard.innerHTML = `
        <div class="dark-toggle repo-dark-toggle" title="Toggle dark mode">
            <div class="repo-dark-text">
                <div style="font-weight: 700; font-size: 1rem;">Dark Mode</div>
                <div style="font-size: 0.84rem; opacity: 0.72;">Soft, Dim, atau AMOLED</div>
            </div>
            <div class="repo-dark-actions">
                <label class="switch">
                    <input type="checkbox" id="darkModeToggle" aria-label="Toggle dark mode">
                    <span class="slider"></span>
                </label>
                <span class="toggle-icon" aria-hidden="true" style="width: 24px; height: 24px;"></span>
                <select id="darkThemeVariant" title="Theme variant" aria-label="Theme variant">
                    <option value="soft">Soft</option>
                    <option value="dim">Dim</option>
                    <option value="amoled">AMOLED</option>
                </select>
            </div>
        </div>
    `;

    const searchRow = document.createElement('div');
    searchRow.className = 'repo-search-row';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Cari repo, bahasa, deskripsi, topic...';
    searchInput.setAttribute('aria-label', 'Cari repository');
    searchInput.className = 'repo-search-input';
    searchInput.style.color = 'var(--text-color)';

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.textContent = 'Bersihkan';
    clearButton.className = 'repo-clear-button';

    const metrics = document.createElement('div');
    metrics.className = 'repo-metrics';

    const metricTotal = createMetricCard('Total repo', '0');
    const metricVisible = createMetricCard('Ditampilkan', '0');
    const metricPages = createMetricCard('Repo Pages', '0');

    metrics.appendChild(metricTotal.card);
    metrics.appendChild(metricVisible.card);
    metrics.appendChild(metricPages.card);

    const status = document.createElement('div');
    status.className = 'repo-status';

    const statusDot = document.createElement('span');
    statusDot.className = 'repo-status-dot';
    statusDot.style.background = '#f59e0b';
    statusDot.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.16)';

    const statusText = document.createElement('span');
    statusText.className = 'repo-status-text';
    statusText.textContent = 'Memuat repository...';

    const statusSeparator = document.createElement('span');
    statusSeparator.className = 'repo-status-separator';
    statusSeparator.textContent = '|';

    const bookmarksLink = document.createElement('a');
    bookmarksLink.className = 'repo-status-link';
    bookmarksLink.href = './rsc/Rasyid%20Kurniawan%27s%20Bookmarks/index.html';
    bookmarksLink.textContent = "Rasyid Kurniawan's Bookmarks";
    bookmarksLink.target = '_blank';
    bookmarksLink.rel = 'noopener noreferrer';

    status.appendChild(statusDot);
    status.appendChild(statusText);
    status.appendChild(statusSeparator);
    status.appendChild(bookmarksLink);

    searchRow.appendChild(searchInput);
    searchRow.appendChild(clearButton);
    controls.appendChild(darkModeCard);
    controls.appendChild(searchRow);
    controls.appendChild(metrics);
    controls.appendChild(status);
    container.insertAdjacentElement('beforebegin', controls);

    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state hidden';
    emptyState.style.width = '100%';
    emptyState.style.marginTop = '4px';
    emptyState.textContent = 'Tidak ada repository yang cocok dengan pencarian.';
    container.insertAdjacentElement('afterend', emptyState);

    const loadingCard = document.createElement('div');
    loadingCard.className = 'shortcut-card';
    loadingCard.style.justifyContent = 'center';
    loadingCard.style.minHeight = '220px';
    loadingCard.innerHTML = '<span>Memuat repository publik...</span>';
    container.innerHTML = '';
    container.appendChild(loadingCard);

    let allRepos = [];
    const thumbnailCache = new Map();

    function createMetricCard(label, value) {
        const card = document.createElement('div');
        card.className = 'repo-metric-card';

        const metricLabel = document.createElement('span');
        metricLabel.textContent = label;
        metricLabel.className = 'repo-metric-label';

        const metricValue = document.createElement('strong');
        metricValue.textContent = value;
        metricValue.className = 'repo-metric-value';

        card.appendChild(metricLabel);
        card.appendChild(metricValue);
        return { card, metricValue };
    }

    function titleize(value) {
        return value
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, character => character.toUpperCase())
            .replace(/\s+/g, ' ')
            .trim();
    }

    function repoUrl(repo) {
        if (repo.homepage && repo.homepage.trim()) {
            return repo.homepage.trim();
        }

        if (repo.has_pages) {
            if (repo.name === `${repoOwner}.github.io`) {
                return `https://${repoOwner}.github.io/`;
            }

            return `https://${repoOwner}.github.io/${repo.name}/`;
        }

        return repo.html_url;
    }

    function repoInitials(name) {
        const segments = name.split(/[-_.\s]+/).filter(Boolean);
        if (!segments.length) return 'RE';
        if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase();
        return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase();
    }

    function repoGradient(name, language) {
        const seed = `${name}:${language || ''}`;
        let hash = 0;

        for (let index = 0; index < seed.length; index += 1) {
            hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
        }

        const palettes = [
            ['#1d4ed8', '#0ea5e9'],
            ['#7c3aed', '#c084fc'],
            ['#0f766e', '#14b8a6'],
            ['#f59e0b', '#f97316'],
            ['#db2777', '#fb7185'],
            ['#334155', '#64748b']
        ];

        return palettes[hash % palettes.length];
    }

    function createIcon(repo) {
        const [startColor, endColor] = repoGradient(repo.name, repo.language);
        const label = repoInitials(repo.name);
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
                <defs>
                    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="${startColor}" />
                        <stop offset="100%" stop-color="${endColor}" />
                    </linearGradient>
                </defs>
                <rect width="120" height="120" rx="24" fill="url(#g)" />
                <rect x="26" y="24" width="68" height="72" rx="14" fill="#ffffff" fill-opacity="0.12" />
                <path d="M40 43h40M40 57h28M40 71h34" stroke="#ffffff" stroke-opacity="0.9" stroke-width="6" stroke-linecap="round" />
                <text x="60" y="97" text-anchor="middle" fill="#ffffff" font-size="18" font-family="Montserrat, Arial, sans-serif" font-weight="700">${label}</text>
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function screenshotUrlFor(targetUrl) {
        return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=400`;
    }

    function resolveReadmeImageUrl(candidate, repo, readmeRawUrl) {
        if (!candidate) return '';

        const cleaned = candidate.trim().replace(/^<|>$/g, '').replace(/&amp;/g, '&');
        if (!cleaned) return '';

        const githubBlobMatch = cleaned.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
        if (githubBlobMatch) {
            const owner = githubBlobMatch[1];
            const name = githubBlobMatch[2];
            const branch = githubBlobMatch[3];
            const filePath = githubBlobMatch[4];
            return `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${filePath}`;
        }

        if (/^https?:\/\//i.test(cleaned) || cleaned.startsWith('data:image/')) {
            return cleaned;
        }

        if (cleaned.startsWith('//')) {
            return `https:${cleaned}`;
        }

        const baseRaw = `https://raw.githubusercontent.com/${repoOwner}/${repo.name}/${repo.default_branch || 'main'}`;

        if (cleaned.startsWith('/')) {
            return `${baseRaw}${cleaned}`;
        }

        try {
            if (readmeRawUrl) {
                return new URL(cleaned, readmeRawUrl).toString();
            }
        } catch (_error) {
            // ignore URL resolution errors and fallback to root-based raw URL
        }

        return `${baseRaw}/${cleaned}`;
    }

    function normalizeMarkdownImageTarget(target) {
        if (!target) return '';

        const trimmed = target.trim();
        if (!trimmed) return '';

        if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
            return trimmed.slice(1, -1).trim();
        }

        const withOptionalTitle = trimmed.match(/^([^\s]+)(?:\s+["'][^"']*["'])?$/);
        if (withOptionalTitle && withOptionalTitle[1]) {
            return withOptionalTitle[1].trim();
        }

        return trimmed;
    }

    function getFirstImageFromMarkdown(markdown) {
        if (!markdown) return '';

        const markdownImage = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/i);
        if (markdownImage && markdownImage[1]) {
            return normalizeMarkdownImageTarget(markdownImage[1]);
        }

        const htmlImage = markdown.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (htmlImage && htmlImage[1]) {
            return htmlImage[1].trim();
        }

        return '';
    }

    async function fetchReadmeMarkdown(repo) {
        const branch = repo.default_branch || 'main';
        const candidates = [
            'README.md',
            'readme.md',
            'Readme.md',
            'README.MD',
            'docs/README.md',
            'docs/readme.md',
            '.github/README.md'
        ];

        for (const candidate of candidates) {
            const readmeRawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repo.name}/${branch}/${candidate}`;

            try {
                const response = await fetch(readmeRawUrl);
                if (!response.ok) {
                    continue;
                }

                const markdown = await response.text();
                if (!markdown.trim()) {
                    continue;
                }

                return {
                    markdown,
                    readmeRawUrl
                };
            } catch (_error) {
                // Continue trying next candidate if one URL fails
            }
        }

        return {
            markdown: '',
            readmeRawUrl: ''
        };
    }

    async function getReadmeThumbnail(repo) {
        const { markdown, readmeRawUrl } = await fetchReadmeMarkdown(repo);
        if (!markdown) {
            return '';
        }

        const firstImage = getFirstImageFromMarkdown(markdown);
        if (!firstImage) {
            return '';
        }

        return resolveReadmeImageUrl(firstImage, repo, readmeRawUrl);
    }

    async function resolveThumbnail(repo) {
        const cacheKey = repo.full_name || repo.name;
        if (thumbnailCache.has(cacheKey)) {
            return thumbnailCache.get(cacheKey);
        }

        const job = (async () => {
            if (repo.has_pages) {
                const pageTarget = repoUrl(repo);
                if (/^https?:\/\//i.test(pageTarget)) {
                    return screenshotUrlFor(pageTarget);
                }
            }

            try {
                return await getReadmeThumbnail(repo);
            } catch (_error) {
                return '';
            }
        })();

        thumbnailCache.set(cacheKey, job);
        return job;
    }

    async function applyThumbnail(imgElement, repo, fallbackIcon) {
        const thumbnail = await resolveThumbnail(repo);
        if (!thumbnail) {
            imgElement.src = fallbackIcon;
            return;
        }

        imgElement.src = thumbnail;
        imgElement.addEventListener('error', () => {
            imgElement.src = fallbackIcon;
        }, { once: true });
    }

    function formatDate(value) {
        if (!value) return 'unknown';
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(new Date(value));
    }

    function matchesQuery(repo, query) {
        if (!query) return true;

        const haystack = [
            repo.name,
            repo.full_name,
            repo.description,
            repo.language,
            repo.homepage,
            repo.html_url,
            ...(Array.isArray(repo.topics) ? repo.topics : [])
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return haystack.includes(query);
    }

    function filteredRepos() {
        const query = searchInput.value.trim().toLowerCase();
        return allRepos.filter(repo => matchesQuery(repo, query));
    }

    function updateMetrics(total, visible, pages) {
        metricTotal.metricValue.textContent = String(total);
        metricVisible.metricValue.textContent = String(visible);
        metricPages.metricValue.textContent = String(pages);
    }

    function buildPageBadge(repo) {
        const badge = document.createElement('span');
        badge.className = 'shortcut-badge';
        badge.textContent = repo.has_pages ? 'GitHub Pages' : 'GitHub Repo';
        return badge;
    }

    function buildRepoCard(repo, index) {
        const card = document.createElement('a');
        card.className = 'shortcut-card';
        card.href = repoUrl(repo);
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.style.textAlign = 'left';
        card.style.alignItems = 'flex-start';
        card.style.gap = '0';
        card.style.animationDelay = `${Math.min(index * 40, 380)}ms`;

        const img = document.createElement('img');
        const fallbackIcon = createIcon(repo);
        img.src = fallbackIcon;
        img.alt = repo.name;
        img.style.objectFit = 'cover';
        applyThumbnail(img, repo, fallbackIcon);

        const name = document.createElement('span');
        name.textContent = repo.name;
        name.style.fontSize = '1.02rem';
        name.style.marginBottom = '8px';

        const description = document.createElement('small');
        description.textContent = repo.description || 'Tidak ada deskripsi.';
        description.style.minHeight = '3em';

        const meta = document.createElement('small');
        meta.textContent = [repo.language || 'Unknown', `★ ${repo.stargazers_count || 0}`, `Fork ${repo.forks_count || 0}`, formatDate(repo.updated_at)].join(' · ');
        meta.style.display = 'block';
        meta.style.marginTop = '10px';
        meta.style.fontSize = '0.82rem';
        meta.style.opacity = '0.78';

        const topics = document.createElement('div');
        topics.style.display = 'flex';
        topics.style.flexWrap = 'wrap';
        topics.style.gap = '8px';
        topics.style.marginTop = '12px';

        const topicList = Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : [];
        topicList.forEach(topic => {
            const topicPill = document.createElement('span');
            topicPill.textContent = titleize(topic);
            topicPill.style.padding = '6px 10px';
            topicPill.style.borderRadius = '999px';
            topicPill.style.background = 'rgba(29, 78, 216, 0.08)';
            topicPill.style.color = 'var(--text-color)';
            topicPill.style.fontSize = '0.76rem';
            topics.appendChild(topicPill);
        });

        const badge = buildPageBadge(repo);

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(description);
        card.appendChild(meta);
        if (topics.childNodes.length) {
            card.appendChild(topics);
        }
        card.appendChild(badge);

        return card;
    }

    function renderRepos(list) {
        container.innerHTML = '';

        if (!list.length) {
            emptyState.classList.remove('hidden');
            emptyState.textContent = searchInput.value.trim()
                ? 'Tidak ada repository yang cocok dengan pencarian.'
                : 'Tidak ada repository yang dapat ditampilkan.';
            updateMetrics(allRepos.length, 0, allRepos.filter(repo => repo.has_pages).length);
            return;
        }

        emptyState.classList.add('hidden');

        const fragment = document.createDocumentFragment();
        list.forEach((repo, index) => {
            fragment.appendChild(buildRepoCard(repo, index));
        });

        container.appendChild(fragment);
        updateMetrics(allRepos.length, list.length, allRepos.filter(repo => repo.has_pages).length);
    }

    async function requestJson(url) {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            const error = new Error(`GitHub API error: ${response.status}`);
            error.status = response.status;
            error.rateRemaining = response.headers.get('x-ratelimit-remaining');
            error.rateReset = response.headers.get('x-ratelimit-reset');
            throw error;
        }

        return response.json();
    }

    function saveRepoCache(repos) {
        try {
            const payload = {
                savedAt: Date.now(),
                repos
            };
            localStorage.setItem(repoCacheKey, JSON.stringify(payload));
        } catch (_error) {
            // Ignore storage errors (private mode, quota exceeded, etc.)
        }
    }

    function loadRepoCache() {
        try {
            const raw = localStorage.getItem(repoCacheKey);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.repos) || typeof parsed.savedAt !== 'number') {
                return [];
            }

            if (Date.now() - parsed.savedAt > repoCacheTtlMs) {
                return [];
            }

            return parsed.repos;
        } catch (_error) {
            return [];
        }
    }

    async function fetchAllRepos() {
        const pageSize = 100;
        const repos = [];

        for (let page = 1; page <= 10; page += 1) {
            const chunk = await requestJson(`${apiBase}?per_page=${pageSize}&page=${page}&sort=updated&direction=desc&type=owner`);
            if (!Array.isArray(chunk) || !chunk.length) {
                break;
            }

            repos.push(...chunk);
            if (chunk.length < pageSize) {
                break;
            }
        }

        return repos;
    }

    async function fetchReposViaSearch() {
        const pageSize = 100;
        const repos = [];

        for (let page = 1; page <= 10; page += 1) {
            const url = `${searchApiBase}?q=user:${encodeURIComponent(repoOwner)}&per_page=${pageSize}&page=${page}&sort=updated&order=desc`;
            const payload = await requestJson(url);
            const chunk = Array.isArray(payload.items) ? payload.items : [];
            if (!chunk.length) {
                break;
            }

            repos.push(...chunk);
            if (chunk.length < pageSize) {
                break;
            }
        }

        return repos;
    }

    async function loadRepositories() {
        try {
            let repos = [];
            try {
                repos = await fetchAllRepos();
            } catch (primaryError) {
                if (primaryError.status === 403) {
                    repos = await fetchReposViaSearch();
                } else {
                    throw primaryError;
                }
            }

            allRepos = repos
                .filter(repo => !repo.archived)
                .sort((left, right) => new Date(right.updated_at) - new Date(left.updated_at));

            if (allRepos.length) {
                saveRepoCache(allRepos);
            }

            statusDot.style.background = '#22c55e';
            statusDot.style.boxShadow = '0 0 0 6px rgba(34, 197, 94, 0.16)';
            statusText.textContent = `Repository dimuat: ${allRepos.length} item`;
            renderRepos(filteredRepos());
        } catch (error) {
            console.error(error);
            const cachedRepos = loadRepoCache();
            allRepos = cachedRepos;

            statusDot.style.background = '#f59e0b';
            statusDot.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.16)';

            if (cachedRepos.length) {
                statusText.textContent = 'GitHub API limit, menampilkan cache terbaru';
                emptyState.textContent = 'Data live dari GitHub API gagal dimuat, menampilkan cache terakhir yang tersedia.';
            } else {
                statusText.textContent = 'Gagal memuat dari GitHub API';
                emptyState.textContent = 'Gagal memuat repository dari GitHub API. Coba refresh lagi.';
            }

            renderRepos(filteredRepos());
        }
    }

    searchInput.addEventListener('input', () => {
        renderRepos(filteredRepos());
    });

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        renderRepos(filteredRepos());
    });

    initDarkMode();

    loadRepositories();

    function initDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        const select = document.getElementById('darkThemeVariant');
        const container = document.querySelector('.dark-toggle');

        if (!toggle || !select || !container) return;

        const savedEnabled = localStorage.getItem('darkMode') === 'true';
        const savedVariant = localStorage.getItem('darkTheme') || 'soft';

        document.body.classList.toggle('dark', savedEnabled);
        if (savedEnabled) {
            document.body.setAttribute('data-theme', savedVariant);
        } else {
            document.body.removeAttribute('data-theme');
        }

        toggle.checked = savedEnabled;
        select.value = savedVariant;
        container.classList.toggle('on', toggle.checked);

        toggle.addEventListener('change', () => {
            const enabled = toggle.checked;
            document.body.classList.toggle('dark', enabled);
            if (enabled) {
                const variant = select.value || 'soft';
                document.body.setAttribute('data-theme', variant);
            } else {
                document.body.removeAttribute('data-theme');
            }

            container.classList.toggle('on', enabled);
            localStorage.setItem('darkMode', String(enabled));
        });

        select.addEventListener('change', () => {
            const variant = select.value || 'soft';
            localStorage.setItem('darkTheme', variant);
            if (toggle.checked) {
                document.body.setAttribute('data-theme', variant);
            }
        });
    }
})();