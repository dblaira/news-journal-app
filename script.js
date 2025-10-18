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
            // Update active category
            categoryBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Filter entries
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
async function handleSubmit(e) {
    e.preventDefault();
    
    const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        headline: document.getElementById('headline').value,
        category: document.getElementById('category').value,
        subheading: document.getElementById('subheading').value,
        content: document.getElementById('content').value,
        mood: document.getElementById('mood').value,
        original: document.getElementById('content').value, // Store original
        enhanced: null, // Will be filled by AI
        enhancementStatus: 'pending' // pending, complete, or error
    };
    
    entries.unshift(entry); // Add to beginning of array
    saveEntries();
    displayEntries();
    hideForm();
    
    // Scroll to top to see new entry
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Trigger AI enhancement in the background
    enhanceEntryWithAI(entry.id);
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
    // Filter entries
    let filtered = entries;
    if (currentFilter !== 'all') {
        filtered = entries.filter(entry => entry.category === currentFilter);
    }
    
    // Clear feed
    entriesFeed.innerHTML = '';
    
    // Show empty state if no entries
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
    
    // Display entries
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
    
    // Add enhancement badge
    let enhancementBadge = '';
    if (entry.enhancementStatus === 'pending') {
        enhancementBadge = '<span style="background: #ffc107; color: #000; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">✨ Enhancing...</span>';
    } else if (entry.enhancementStatus === 'complete') {
        enhancementBadge = '<span style="background: #4CAF50; color: #fff; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">✨ Enhanced</span>';
    }
    
    card.innerHTML = `
        <div class="entry-header">
            <div class="entry-category">${entry.category}${enhancementBadge}</div>
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
                <button onclick="viewEntry('${entry.id}')">Read More</button>
                <button onclick="deleteEntry('${entry.id}')">Delete</button>
            </div>
        </div>
    `;
    
    return card;
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
    `;
    
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    });
    
    // Determine enhancement status message
    let enhancementSection = '';
    if (entry.enhancementStatus === 'pending') {
        enhancementSection = `
            <div style="
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 1rem;
                border-radius: 4px;
                text-align: center;
                color: #856404;
            ">
                ✨ AI is enhancing your entry...
            </div>
        `;
    } else if (entry.enhancementStatus === 'error') {
        enhancementSection = `
            <div style="
                background: #f8d7da;
                border: 1px solid #dc3545;
                padding: 1rem;
                border-radius: 4px;
                text-align: center;
                color: #721c24;
            ">
                ❌ Enhancement failed. <button onclick="retryEnhancement('${entry.id}'); this.closest('.modal').remove();" style="margin-left: 1rem; padding: 0.5rem 1rem; cursor: pointer;">Retry</button>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div style="
            background: white;
            max-width: 1400px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            padding: 3rem;
            position: relative;
        ">
            <button onclick="this.closest('.modal').remove()" style="
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: #000;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                cursor: pointer;
                font-size: 1rem;
                z-index: 10;
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
            
            ${enhancementSection}
            
            ${entry.enhanced ? `
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-top: 2rem;
                ">
                    <div>
                        <h3 style="
                            font-size: 1rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            margin-bottom: 1rem;
                            color: #666;
                            border-bottom: 2px solid #000;
                            padding-bottom: 0.5rem;
                        ">Your Original Entry</h3>
                        <div style="
                            font-size: 1rem;
                            line-height: 1.8;
                            color: #333;
                            white-space: pre-wrap;
                        ">${entry.original || entry.content}</div>
                    </div>
                    
                    <div>
                        <h3 style="
                            font-size: 1rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            margin-bottom: 1rem;
                            color: #666;
                            border-bottom: 2px solid #4CAF50;
                            padding-bottom: 0.5rem;
                        ">✨ AI Enhanced Version</h3>
                        <div style="
                            font-size: 1rem;
                            line-height: 1.8;
                            color: #333;
                            white-space: pre-wrap;
                            background: #f8fff9;
                            padding: 1.5rem;
                            border-left: 3px solid #4CAF50;
                        ">${entry.enhanced}</div>
                    </div>
                </div>
            ` : `
                <div style="
                    font-size: 1.1rem;
                    line-height: 1.8;
                    color: #333;
                    white-space: pre-wrap;
                    margin-top: 2rem;
                ">${entry.content}</div>
            `}
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

// AI Enhancement Feature
async function enhanceEntryWithAI(entryId) {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    
    try {
        // Show loading state in the card
        displayEntries();
        
        const prompt = `You are helping someone express their thoughts more clearly and eloquently. They've written a journal entry, and your job is to rewrite it in a way that:

1. Captures the same meaning and emotion
2. Makes the writing more articulate and expressive
3. Maintains their authentic voice (don't make it too formal or academic)
4. Helps them better understand and express their own feelings
5. Keeps it to a similar length (don't make it much longer)

Here is their journal entry:

Category: ${entry.category}
Headline: ${entry.headline}
${entry.subheading ? `Subheading: ${entry.subheading}` : ''}
Mood: ${entry.mood || 'not specified'}

Content:
${entry.content}

Please rewrite the content portion in a more expressive and clear way. ONLY return the rewritten content - do not include any preamble, explanation, or meta-commentary. Just the enhanced journal entry text itself.`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2000,
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const enhancedContent = data.content[0].text;
        
        // Update entry with enhanced version
        entry.enhanced = enhancedContent;
        entry.enhancementStatus = 'complete';
        
        saveEntries();
        displayEntries();
        
    } catch (error) {
        console.error('AI enhancement failed:', error);
        entry.enhancementStatus = 'error';
        saveEntries();
        displayEntries();
    }
}

// Manually trigger enhancement for an existing entry
function retryEnhancement(entryId) {
    enhanceEntryWithAI(entryId);
}