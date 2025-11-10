import { supabase } from './supabase.js'

// State management
let entries = []
let currentFilter = 'all'
let searchQuery = ''

// DOM elements
const newEntryBtn = document.getElementById('newEntryBtn')
const entryForm = document.getElementById('entryForm')
const journalForm = document.getElementById('journalForm')
const cancelBtn = document.getElementById('cancelBtn')
const entriesFeed = document.getElementById('entriesFeed')
const categoryBtns = document.querySelectorAll('.category-btn')
const heroContainer = document.getElementById('heroStory')
const featureGrid = document.getElementById('featureGrid')
const trendingList = document.getElementById('trendingList')
const quickNotesContainer = document.getElementById('quickNotes')
const connectionGrid = document.getElementById('connectionGrid')
const mindsetHeadline = document.getElementById('mindsetHeadline')
const mindsetSubtitle = document.getElementById('mindsetSubtitle')
const issueTagline = document.getElementById('issueTagline')
const searchForm = document.getElementById('searchForm')
const searchInput = document.getElementById('searchInput')

// Image palette by category
const categoryImages = {
    Business: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    Finance: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=1200&q=80',
    Health: 'https://images.unsplash.com/photo-1484980972926-edee96e0960d?auto=format&fit=crop&w=1200&q=80',
    Spiritual: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    Fun: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    Social: 'https://images.unsplash.com/photo-1529158062015-cad636e69505?auto=format&fit=crop&w=1200&q=80',
    Romance: 'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1200&q=80',
    default: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80'
}

const sampleStories = [
    {
        id: 'sample-1',
        isSample: true,
        category: 'Spiritual',
        mood: 'reflective',
        headline: 'Riding the Macro Wave: Finding Stability in an Era of Immense Change',
        subheading: 'Mindset briefing: The currents are shifting in your favor.',
        content: 'Macro energy is on the rise. You spotted optimism earlier than most, held your line, and now the horizon is widening. Today’s focus: stay ready for the next swell—double down on the rituals that keep you balanced when the tide surges.',
        created_at: new Date().toISOString()
    },
    {
        id: 'sample-2',
        isSample: true,
        category: 'Business',
        mood: 'energized',
        headline: 'Unexpected Breakthrough in “Find My Keys” Cold Case',
        subheading: 'Daily events · Momentum noted',
        content: 'A quiet investigation yielded results: keys recovered from the seldom-used backpack pocket. The takeaway? Small systems deliver big relief when you trust them. Celebrate with a reset of your organization rituals.',
        created_at: new Date(Date.now() - 3600 * 1000).toISOString()
    },
    {
        id: 'sample-3',
        isSample: true,
        category: 'Relationships',
        mood: 'grateful',
        headline: 'Diplomatic Ties Strengthened Over Shared Pizza Order',
        subheading: 'Relationships · Collaboration win',
        content: 'A late-night compromise turned joint pizza order into a diplomatic masterclass. Shared toppings, shared laughter, no leftovers. Lesson logged: align incentives early and joy follows.',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
        id: 'sample-4',
        isSample: true,
        category: 'Health',
        mood: 'steady',
        headline: 'Mindfulness Initiative Launched During Morning Commute',
        subheading: 'Health · Routine upgrade',
        content: 'Breathwork joined the commute soundtrack today, shifting the pace of the entire morning. Your nervous system sent a memo: “Thanks for the calm.”',
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
        id: 'sample-5',
        isSample: true,
        category: 'Fun',
        mood: 'playful',
        headline: 'The Great Sock Conspiracy: Lone Survivor Emerges from Laundry',
        subheading: 'Fun · Mystery solved',
        content: 'After weeks of speculation, the missing sock returned from exile, quietly lodged behind the dryer. Investigators credit persistence, humor, and a flashlight.',
        created_at: new Date(Date.now() - 86400 * 1000).toISOString()
    }
]

// Initialize app
async function init() {
    attachEventListeners()
    displayEntries()
}
// Check authentication
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // Not logged in, redirect to login page
        window.location.href = 'login.html';
        return null;
    }
    
    return session.user;
}

// Add logout functionality
function setupLogout() {
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Logout';
    logoutBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        z-index: 1000;
    `;
    
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });
    
    document.body.appendChild(logoutBtn);
}

// Initialize auth check
let currentUser = null;

(async function initAuth() {
    currentUser = await checkAuth()
    if (currentUser) {
        setupLogout()
        await loadEntries()
    }
})()


// Event listeners
function attachEventListeners() {
    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', showForm)
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideForm)
    }

    if (journalForm) {
        journalForm.addEventListener('submit', handleSubmit)
    }

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault()
            searchQuery = searchInput.value.trim().toLowerCase()
            displayEntries()
        })

        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase()
            displayEntries()
        })
    }

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryBtns.forEach(b => b.classList.remove('active'))
            e.target.classList.add('active')
            currentFilter = e.target.dataset.category
            displayEntries()
        })
    })
}

// Show/hide form
function showForm() {
    entryForm.classList.remove('hidden');
    entryForm.scrollIntoView({ behavior: 'smooth' });
}

function hideForm() {
    entryForm.classList.add('hidden');
    journalForm.reset();
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const entry = {
        headline: document.getElementById('headline').value,
        category: document.getElementById('category').value,
        subheading: document.getElementById('subheading').value,
        content: document.getElementById('content').value,
        mood: document.getElementById('mood').value,
        versions: null,
        user_id: currentUser.id,
        generating_versions: false
    };
    
    try {
        const { data, error } = await supabase
            .from('entries')
            .insert([entry])
            .select()
            .single();
        
        if (error) throw error;
        
        // Add to local array
        entries.unshift(data);
        
        displayEntries();
        hideForm();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error creating entry:', error);
        alert('Failed to create entry. Please try again.');
    }
}
//

// Load entries from Supabase
async function loadEntries() {
    if (!currentUser) return

    try {
        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        entries = Array.isArray(data) ? data : []
    } catch (error) {
        console.error('Error loading entries:', error)
        entries = []
    } finally {
        displayEntries()
    }
}

// Display entries across layout sections
function displayEntries() {
    const useSamples = entries.length === 0 && !searchQuery && currentFilter === 'all'

    if (useSamples) {
        updateIssueMetadata(sampleStories)
        updateMindset(sampleStories)
        renderSampleFrontPage()
        return
    }

    updateIssueMetadata(entries)
    updateMindset(entries)

    let filtered = [...entries]

    if (currentFilter !== 'all') {
        filtered = filtered.filter(entry => (entry.category || '').toLowerCase() === currentFilter.toLowerCase())
    }

    if (searchQuery) {
        filtered = filtered.filter(entry => {
            const haystack = [
                entry.headline,
                entry.subheading,
                entry.content,
                entry.mood,
                entry.category
            ].filter(Boolean).join(' ').toLowerCase()

            return haystack.includes(searchQuery)
        })
    }

    renderHeroStory(filtered)
    renderFeatureStories(filtered.slice(1))
    renderTrendingStories(filtered)
    renderQuickNotes(filtered)
    renderConnectionGrid(entries)
    renderLatestFeed(filtered)
}

// Create entry card element
function createEntryCard(entry) {
    const card = document.createElement('article')
    card.className = 'entry-card'

    const imageUrl = getEntryImage(entry)
    const formattedDate = formatEntryDateLong(entry)
    const shortDate = formatEntryDateShort(entry)
    const versionBadge = entry.generating_versions
        ? '<span class="entry-mood">Generating…</span>'
        : entry.versions
            ? '<span class="entry-mood">Enhanced</span>'
            : ''

    card.innerHTML = `
        <div class="entry-card__media">
            <img src="${imageUrl}" alt="${entry.category || 'Story'} illustration">
        </div>
        <div class="entry-card__body">
            <div class="entry-card__meta">
                <span>${entry.category || 'Story'}</span>
                <span>${shortDate}</span>
            </div>
            <h3 class="entry-headline">${entry.headline}</h3>
            ${entry.subheading ? `<p class="entry-subheading">${entry.subheading}</p>` : ''}
            <p class="entry-content">${truncate(entry.content, 200)}</p>
        </div>
        <div class="entry-footer">
            <div>
                <span class="entry-date">${formattedDate}</span>
                ${entry.mood ? `<span class="entry-mood">${entry.mood}</span>` : ''}
                ${versionBadge}
            </div>
            <div class="entry-actions">
                ${!entry.versions && !entry.generating_versions ? `<button type="button" onclick="generateVersions('${entry.id}')">✨ Versions</button>` : ''}
                <button type="button" onclick="viewEntry('${entry.id}')">Read</button>
                <button type="button" onclick="deleteEntry('${entry.id}')">Delete</button>
            </div>
        </div>
    `

    return card
}

function renderSampleFrontPage() {
    renderHeroStory(sampleStories)
    renderFeatureStories(sampleStories.slice(1))
    renderTrendingStories(sampleStories)
    renderQuickNotes(sampleStories)
    renderConnectionGrid(sampleStories)
    renderLatestFeed([])
}

function renderHeroStory(list) {
    if (!heroContainer) return

    if (!list.length) {
        heroContainer.classList.add('hero-card--placeholder')
        heroContainer.innerHTML = `
            <div class="hero-card__content">
                <span class="badge">Start here</span>
                <h1>Write your first headline</h1>
                <p>Capture a moment from today and let your newsroom spring to life.</p>
                <div class="hero-actions">
                    <button type="button" class="btn-primary" onclick="document.getElementById('newEntryBtn').click()">Create Entry</button>
                </div>
            </div>
        `
        return
    }

    const hero = list[0]
    const imageUrl = getEntryImage(hero)
    heroContainer.classList.remove('hero-card--placeholder')
    const isSample = Boolean(hero.isSample)
    const heroActions = isSample
        ? `<div class="hero-actions"><button type="button" class="btn-secondary" disabled>Preview Story</button></div>`
        : `<div class="hero-actions">
                <button type="button" class="btn-primary" onclick="viewEntry('${hero.id}')">Read Story</button>
                ${!hero.versions && !hero.generating_versions ? `<button type="button" class="btn-secondary" onclick="generateVersions('${hero.id}')">✨ Generate Versions</button>` : ''}
           </div>`

    heroContainer.innerHTML = `
        <div class="hero-card__media">
            <img src="${imageUrl}" alt="${hero.category || 'Story'} feature image">
        </div>
        <div class="hero-card__content">
            <div class="hero-card__meta">
                <span>${hero.category || 'Story'}</span>
                <span>${formatEntryDateLong(hero)}</span>
            </div>
            <span class="badge">Top Story</span>
            <h1>${hero.headline}</h1>
            ${hero.subheading ? `<p>${hero.subheading}</p>` : ''}
            <p>${truncate(hero.content, 260)}</p>
            ${heroActions}
        </div>
    `
}

function renderFeatureStories(stories) {
    if (!featureGrid) return
    featureGrid.innerHTML = ''

    const storySlice = stories.slice(0, 3)

    if (!storySlice.length) {
        featureGrid.innerHTML = `<div class="feature-placeholder">Add more entries to populate your featured stories.</div>`
        return
    }

    storySlice.forEach(entry => {
        featureGrid.appendChild(createFeatureCard(entry))
    })
}

function createFeatureCard(entry) {
    const card = document.createElement('article')
    card.className = 'feature-card'
    const isSample = Boolean(entry.isSample)
    const actionButton = isSample
        ? '<button type="button" class="btn-secondary" disabled>Preview Story</button>'
        : `<button type="button" class="btn-secondary" onclick="viewEntry('${entry.id}')">Open Story</button>`
    card.innerHTML = `
        <div class="feature-card__image">
            <img src="${getEntryImage(entry)}" alt="${entry.category || 'Story'} feature image">
        </div>
        <div class="story-meta">
            <span>${entry.category || 'Story'}</span>
            <span>${formatEntryDateShort(entry)}</span>
        </div>
        <h3>${entry.headline}</h3>
        <p>${truncate(entry.content, 140)}</p>
        ${actionButton}
    `
    return card
}

function renderTrendingStories(list) {
    if (!trendingList) return
    trendingList.innerHTML = ''

    if (!list.length) {
        trendingList.innerHTML = `<li class="trending-empty">${searchQuery ? 'No trending stories match your search yet.' : 'Your trending stories will appear once you add entries.'}</li>`
        return
    }

    list.slice(0, 6).forEach((entry, index) => {
        const item = document.createElement('li')
        item.className = 'trending-item'
        const isSample = Boolean(entry.isSample)
        const buttonAttrs = isSample ? 'type="button" class="trending-headline" disabled' : `type="button" class="trending-headline" onclick="viewEntry('${entry.id}')"`
        item.innerHTML = `
            <span class="trending-rank">${String(index + 1).padStart(2, '0')}</span>
            <div>
                <button ${buttonAttrs}>${entry.headline}</button>
                <span class="trending-meta">${formatEntryDateShort(entry)} · ${entry.category || 'Story'}</span>
            </div>
        `
        trendingList.appendChild(item)
    })
}

function renderQuickNotes(list) {
    if (!quickNotesContainer) return
    quickNotesContainer.innerHTML = ''

    const notes = list.slice(0, 3)

    if (!notes.length) {
        quickNotesContainer.innerHTML = '<p class="empty-note">No notes yet. Create an entry to light up this space.</p>'
        return
    }

    notes.forEach(entry => {
        const note = document.createElement('article')
        note.className = 'quick-note'
        const subheading = entry.subheading ? ` — ${entry.subheading}` : ''
        const label = entry.category ? `${entry.category}${entry.isSample ? ' · Preview' : ''}` : 'Story'
        note.innerHTML = `<strong>${label}</strong>${subheading}<br>${truncate(entry.content, 120)}`
        quickNotesContainer.appendChild(note)
    })
}

function renderConnectionGrid(allEntries) {
    if (!connectionGrid) return
    connectionGrid.innerHTML = ''

    const categoriesInOrder = ['Business', 'Finance', 'Health', 'Spiritual', 'Fun', 'Social', 'Romance']
    const featured = categoriesInOrder
        .map(category => allEntries.find(entry => (entry.category || '').toLowerCase() === category.toLowerCase()))
        .filter(Boolean)
        .slice(0, 4)

    if (!featured.length) {
        connectionGrid.innerHTML = `
            <div class="connection-placeholder">
                <p>Entries from different categories will gather here to reveal the bigger picture.</p>
            </div>
        `
        return
    }

    featured.forEach(entry => {
        const card = document.createElement('article')
        card.className = 'connection-card'
        const action = entry.isSample
            ? '<button type="button" class="btn-secondary" disabled>Preview</button>'
            : `<button type="button" class="btn-secondary" onclick="viewEntry('${entry.id}')">Open Dispatch</button>`
        card.innerHTML = `
            <span class="badge">${entry.category || 'Story'}</span>
            <h3>${entry.headline}</h3>
            <p>${truncate(entry.content, 160)}</p>
            ${action}
        `
        connectionGrid.appendChild(card)
    })
}

function renderLatestFeed(list) {
    if (!entriesFeed) return
    entriesFeed.innerHTML = ''

    if (!list.length) {
        entriesFeed.innerHTML = `
            <div class="empty-state">
                <h2>${searchQuery ? 'No results found' : 'No entries yet'}</h2>
                <p>${searchQuery ? 'Try a different search term or category to surface another story.' : 'Start your personal news feed by creating your first entry!'}</p>
            </div>
        `
        return
    }

    const startIndex = list.length > 4 ? 4 : 1
    const remainder = list.slice(startIndex)

    if (!remainder.length) {
        entriesFeed.innerHTML = `
            <div class="empty-state">
                <h2>Front page is set</h2>
                <p>Add more entries to expand your latest dispatches.</p>
            </div>
        `
        return
    }

    remainder.forEach(entry => {
        entriesFeed.appendChild(createEntryCard(entry))
    })
}

function getEntryImage(entry) {
    if (!entry) return categoryImages.default
    const category = (entry.category || '').trim()
    return categoryImages[category] || categoryImages.default
}

function getEntryDateValue(entry) {
    return entry?.date || entry?.created_at || entry?.updated_at || entry?.inserted_at || entry?.createdAt
}

function formatEntryDateLong(entry) {
    const raw = getEntryDateValue(entry)
    if (!raw) return 'Date pending'
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return 'Date pending'
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

function formatEntryDateShort(entry) {
    const raw = getEntryDateValue(entry)
    if (!raw) return 'Today'
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return 'Today'
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    })
}

function truncate(text = '', limit = 140) {
    if (!text) return ''
    const clean = text.replace(/\s+/g, ' ').trim()
    if (clean.length <= limit) return clean
    return `${clean.slice(0, limit - 1)}…`
}

function updateIssueMetadata(allEntries) {
    if (!issueTagline) return
    const editionNumber = Math.max(allEntries.length, 1).toString().padStart(2, '0')
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    issueTagline.textContent = `Edition ${editionNumber} · ${today}`
}

function updateMindset(allEntries) {
    if (!mindsetHeadline || !mindsetSubtitle) return

    if (!allEntries.length) {
        mindsetHeadline.textContent = 'Calling all Big Wave Riders'
        mindsetSubtitle.textContent = 'Step into the day like it is a headline worth remembering.'
        return
    }

    const primaryEntry = allEntries[0]
    const mood = (primaryEntry.mood || '').toLowerCase()
    const category = (primaryEntry.category || '').toLowerCase()
    const preset = deriveMindsetPreset(mood, category)

    mindsetHeadline.textContent = preset.headline
    mindsetSubtitle.textContent = preset.subtitle
}

function deriveMindsetPreset(mood, category) {
    const presets = [
        {
            match: ['excited', 'energized', 'motivated', 'hype'],
            headline: 'Calling all Big Wave Riders',
            subtitle: 'Momentum is here. Capture it before it fades.'
        },
        {
            match: ['calm', 'steady', 'reflective', 'grateful'],
            headline: 'Steady Hands on the Helm',
            subtitle: 'Honor the quiet details that make today matter.'
        },
        {
            match: ['overwhelmed', 'tired', 'stretched'],
            headline: 'Slow Motion, Sharp Focus',
            subtitle: 'Narrow the lens and let one meaningful story lead.'
        },
        {
            match: ['curious', 'learning', 'exploring'],
            headline: 'Curiosity on the Front Page',
            subtitle: 'Follow the thread that keeps pulling you forward.'
        }
    ]

    const matched = presets.find(preset => preset.match.some(keyword => mood.includes(keyword)))
    if (matched) return matched

    if (category.includes('finance') || category.includes('business')) {
        return {
            headline: 'Market Moving Meaning',
            subtitle: 'You are the bellwether. Set the tone for this issue.'
        }
    }

    if (category.includes('health') || category.includes('spiritual')) {
        return {
            headline: 'Tune Inward, Broadcast Out',
            subtitle: 'Let grounded energy steer today’s headline.'
        }
    }

    return {
        headline: 'Calling all Big Wave Riders',
        subtitle: 'Step into the day like it is a headline worth remembering.'
    }
}

// Generate AI versions
async function generateVersions(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    entry.generating_versions = true;
    displayEntries();
    
    try {
        // Update database to show generating state
        await supabase
            .from('entries')
            .update({ generating_versions: true })
            .eq('id', id);
        
        const response = await fetch('/api/generate-versions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ entry })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update entry in Supabase with versions
        const { error } = await supabase
            .from('entries')
            .update({
                versions: data.versions,
                generating_versions: false
            })
            .eq('id', id);
        
        if (error) throw error;
        
        // Update local entry
        entry.versions = data.versions;
        entry.generating_versions = false;
        
        displayEntries();
        
        // Auto-open the entry to show versions
        viewEntry(id);
        
    } catch (error) {
        console.error('Error generating versions:', error);
        
        // Reset generating state in database
        await supabase
            .from('entries')
            .update({ generating_versions: false })
            .eq('id', id);
        
        entry.generating_versions = false;
        displayEntries();
        alert('Failed to generate versions. Please try again.');
    }
}

// View full entry
function viewEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    const modal = createModal(entry);
    document.body.appendChild(modal);
}

// Create modal for full entry view
function createModal(entry) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 2rem;
        overflow-y: auto;
    `;
    
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    });
    
    let versionsSection = '';
    
    if (entry.generating_versions) {
        versionsSection = `
            <div style="
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 2rem;
                border-radius: 8px;
                text-align: center;
                color: #856404;
                margin: 2rem 0;
            ">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
                <h3 style="margin: 0 0 0.5rem 0;">Generating AI Versions...</h3>
                <p style="margin: 0;">This takes about 10-15 seconds. The page will update when ready.</p>
            </div>
        `;
    } else if (entry.versions && entry.versions.length > 0) {
        versionsSection = `
            <div style="margin-top: 2rem;">
                <h3 style="
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 2rem;
                    text-align: center;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                ">✨ AI Generated Versions ✨</h3>
                
                <!-- Original -->
                <div style="
                    background: #f9f9f9;
                    padding: 2rem;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                    border-left: 4px solid #000;
                ">
                    <h4 style="
                        font-size: 1rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 1rem;
                        color: #000;
                    ">📝 Your Original</h4>
                    <div style="
                        font-size: 1rem;
                        line-height: 1.8;
                        color: #333;
                        white-space: pre-wrap;
                    ">${entry.content}</div>
                </div>
                
                ${entry.versions.map(version => `
                    <div style="
                        background: #f0f9f1;
                        padding: 2rem;
                        border-radius: 8px;
                        margin-bottom: 2rem;
                        border-left: 4px solid #4CAF50;
                    ">
                        <h4 style="
                            font-size: 1rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            margin-bottom: 1rem;
                            color: #2e7d32;
                        ">${version.title}</h4>
                        <div style="
                            font-size: 1rem;
                            line-height: 1.8;
                            color: #1b5e20;
                            white-space: pre-wrap;
                        ">${version.content}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (!entry.versions) {
        versionsSection = `
            <div style="
                background: #e3f2fd;
                border: 1px solid #2196F3;
                padding: 2rem;
                border-radius: 8px;
                text-align: center;
                color: #0d47a1;
                margin: 2rem 0;
            ">
                <div style="font-size: 2rem; margin-bottom: 1rem;">✨</div>
                <h3 style="margin: 0 0 1rem 0;">Generate AI Versions</h3>
                <p style="margin: 0 0 1.5rem 0;">See your journal entry rewritten in 4 different styles by AI.</p>
                <button onclick="this.closest('.modal').remove(); generateVersions('${entry.id}');" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    font-size: 1rem;
                    font-weight: 600;
                    border-radius: 4px;
                    cursor: pointer;
                ">✨ Generate Versions Now</button>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div style="
            background: white;
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            padding: 3rem;
            position: relative;
            border-radius: 8px;
        ">
            <button onclick="this.closest('.modal').remove()" style="
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: #000;
                color: white;
                border: none;
                padding: 0.6rem 1.2rem;
                cursor: pointer;
                font-size: 1rem;
                z-index: 10;
                border-radius: 4px;
                font-weight: 600;
            ">Close</button>
            
            <div style="margin-bottom: 1rem;">
                <span style="
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">${entry.category}</span>
            </div>
            
            <h2 style="
                font-size: 2.5rem;
                font-weight: 700;
                line-height: 1.2;
                margin-bottom: 0.5rem;
            ">${entry.headline}</h2>
            
            ${entry.subheading ? `
                <p style="
                    font-size: 1.2rem;
                    color: #666;
                    font-style: italic;
                    margin-bottom: 1.5rem;
                ">${entry.subheading}</p>
            ` : ''}
            
            <div style="
                font-size: 0.9rem;
                color: #666;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #ddd;
            ">
                <div>${formattedDate}</div>
                ${entry.mood ? `<div style="margin-top: 0.5rem;">Mood: ${entry.mood}</div>` : ''}
            </div>
            
            ${versionsSection}
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    return modal;
}

// Delete entry
async function deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
        const { error } = await supabase
            .from('entries')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        // Remove from local array
        entries = entries.filter(e => e.id !== id);
        displayEntries();
    } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
    }
}

// Expose non-module functions for inline handlers
window.generateVersions = generateVersions
window.viewEntry = viewEntry
window.deleteEntry = deleteEntry

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);