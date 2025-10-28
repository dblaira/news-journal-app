// State management
let entries = [];
let currentFilter = 'all';

// DOM elements
const newEntryBtn = document.getElementById('newEntryBtn');
const entryForm = document.getElementById('entryForm');
const journalForm = document.getElementById('journalForm');
const cancelBtn = document.getElementById('cancelBtn');
const entriesFeed = document.getElementById('entriesFeed');
const categoryBtns = document.querySelectorAll('.category-btn');

// Initialize app
function init() {
    loadEntries();
    displayEntries();
    attachEventListeners();
}

// Event listeners
function attachEventListeners() {
    newEntryBtn.addEventListener('click', showForm);
    cancelBtn.addEventListener('click', hideForm);
    journalForm.addEventListener('submit', handleSubmit);
    
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.category;
            displayEntries();
        });
    });
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
function handleSubmit(e) {
    e.preventDefault();
    
    const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        headline: document.getElementById('headline').value,
        category: document.getElementById('category').value,
        subheading: document.getElementById('subheading').value,
        content: document.getElementById('content').value,
        mood: document.getElementById('mood').value,
        versions: null,
        generatingVersions: false
    };
    
    entries.unshift(entry);
    saveEntries();
    displayEntries();
    hideForm();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Save entries to localStorage
function saveEntries() {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
}

// Load entries from localStorage
function loadEntries() {
    const stored = localStorage.getItem('journalEntries');
    if (stored) {
        entries = JSON.parse(stored);
    }
}

// Display entries
function displayEntries() {
    let filtered = entries;
    if (currentFilter !== 'all') {
        filtered = entries.filter(entry => entry.category === currentFilter);
    }
    
    entriesFeed.innerHTML = '';
    
    if (filtered.length === 0) {
        const emptyMessage = currentFilter === 'all' 
            ? 'No entries yet. Start your personal news feed by creating your first entry!'
            : `No entries in ${currentFilter} category yet.`;
        
        entriesFeed.innerHTML = `
            <div class="empty-state">
                <h2>${currentFilter === 'all' ? 'No entries yet' : 'No entries found'}</h2>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(entry => {
        const card = createEntryCard(entry);
        entriesFeed.appendChild(card);
    });
}

// Create entry card element
function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let versionBadge = '';
    if (entry.generatingVersions) {
        versionBadge = '<span style="background: #ffc107; color: #000; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">⏳ Generating...</span>';
    } else if (entry.versions) {
        versionBadge = '<span style="background: #4CAF50; color: #fff; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">✨ Enhanced</span>';
    }
    
    card.innerHTML = `
        <div class="entry-header">
            <div class="entry-category">${entry.category}${versionBadge}</div>
            <h3 class="entry-headline">${entry.headline}</h3>
            ${entry.subheading ? `<p class="entry-subheading">${entry.subheading}</p>` : ''}
        </div>
        <div class="entry-body">
            <p class="entry-content">${entry.content}</p>
        </div>
        <div class="entry-footer">
            <div>
                <div class="entry-date">${formattedDate}</div>
                ${entry.mood ? `<span class="entry-mood">${entry.mood}</span>` : ''}
            </div>
            <div class="entry-actions">
                ${!entry.versions && !entry.generatingVersions ? 
                    `<button onclick="generateVersions('${entry.id}')" style="background: #4CAF50; color: white;">✨ Generate Versions</button>` : 
                    ''}
                <button onclick="viewEntry('${entry.id}')">Read More</button>
                <button onclick="deleteEntry('${entry.id}')">Delete</button>
            </div>
        </div>
    `;
    
    return card;
}

// Generate AI versions
async function generateVersions(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    entry.generatingVersions = true;
    saveEntries();
    displayEntries();
    
    try {
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
        entry.versions = data.versions;
        entry.generatingVersions = false;
        
        saveEntries();
        displayEntries();
        
        // Auto-open the entry to show versions
        viewEntry(id);
        
    } catch (error) {
        console.error('Error generating versions:', error);
        entry.generatingVersions = false;
        entry.versionError = error.message;
        saveEntries();
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
    
    if (entry.generatingVersions) {
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
function deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    entries = entries.filter(e => e.id !== id);
    saveEntries();
    displayEntries();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);