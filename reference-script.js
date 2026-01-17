// Authority Content Reference - Interactive Features
// Parses the guide and enables search, bookmarks, progress tracking

class ContentReference {
  constructor() {
    this.chapters = [];
    this.currentChapter = null;
    this.bookmarks = this.loadFromStorage('bookmarks') || [];
    this.progress = this.loadFromStorage('progress') || {};
    this.userNotes = this.loadFromStorage('notes') || {};
    this.init();
  }

  async init() {
    await this.loadAndParseContent();
    this.setupEventListeners();
    this.restoreState();
    this.updateProgressDisplay();

    // Load first chapter by default
    if (this.chapters.length > 0) {
      this.loadChapter(this.chapters[0].id);
    }
  }

  async loadAndParseContent() {
    try {
      // Load main guide
      const response1 = await fetch('Authority_Content_Complete_Guide.txt');
      const mainText = await response1.text();
      this.parseDocument(mainText);

      // Load story/narrative guide
      const response2 = await fetch('Story_Narrative_Guide.txt');
      const storyText = await response2.text();
      this.parseDocument(storyText, 'Story');
    } catch (error) {
      console.error('Error loading content:', error);
      document.getElementById('content-area').innerHTML = `
        <div class="callout callout-danger">
          <h3>Error Loading Content</h3>
          <p>Could not load the content guides. Please ensure the files are in the correct location.</p>
        </div>
      `;
    }
  }

  parseDocument(text, prefix = '') {
    const lines = text.split('\n');
    let currentChapter = null;
    let currentContent = [];
    let chapterNumber = 0;
    let partNumber = 0;
    let currentPart = '';
    const idPrefix = prefix ? prefix.toLowerCase() + '-' : '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect parts
      if (line.includes('PART ONE:') || line.includes('PART TWO:') || line.includes('PART THREE:')) {
        partNumber++;
        currentPart = line.trim();
        continue;
      }

      // Detect chapter headers (lines with === above and below)
      if (line.includes('===') && i + 1 < lines.length) {
        // Save previous chapter if exists
        if (currentChapter) {
          currentChapter.content = this.formatContent(currentContent.join('\n'));
          this.chapters.push(currentChapter);
          currentContent = [];
        }

        // Start new chapter
        chapterNumber++;
        const titleLine = lines[i + 1];
        currentChapter = {
          id: idPrefix ? `${idPrefix}${chapterNumber}` : `chapter-${chapterNumber}`,
          number: chapterNumber,
          title: titleLine.trim(),
          part: currentPart || (prefix ? `${prefix} Guide` : ''),
          content: ''
        };
        i += 2; // Skip the === and title line
        continue;
      }

      // Accumulate content
      if (currentChapter) {
        currentContent.push(line);
      }
    }

    // Save last chapter
    if (currentChapter) {
      currentChapter.content = this.formatContent(currentContent.join('\n'));
      this.chapters.push(currentChapter);
    }

    console.log(`Parsed ${this.chapters.length} chapters`);
  }

  formatContent(text) {
    let html = text;

    // Convert section headers (ALL CAPS lines)
    html = html.replace(/^([A-Z][A-Z\s&\-:]+)$/gm, '<h3>$1</h3>');

    // Convert subsection headers (Title Case with colons)
    html = html.replace(/^([A-Z][a-zA-Z\s]+:)$/gm, '<h4>$1</h4>');

    // Convert bullet points
    html = html.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // Convert numbered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Bold text (**text**)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic text (*text*)
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert callout boxes
    html = html.replace(/⚠️\s*(.+?)(?=\n\n|\n[A-Z]|$)/gs, '<div class="callout callout-warning">$1</div>');
    html = html.replace(/✓\s*(.+?)(?=\n\n|\n[A-Z]|$)/gs, '<div class="callout callout-success">$1</div>');
    html = html.replace(/ℹ️\s*(.+?)(?=\n\n|\n[A-Z]|$)/gs, '<div class="callout callout-info">$1</div>');
    html = html.replace(/🚫\s*(.+?)(?=\n\n|\n[A-Z]|$)/gs, '<div class="callout callout-danger">$1</div>');

    // Convert paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*(<h[234]>)/g, '$1');
    html = html.replace(/(<\/h[234]>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<div)/g, '$1');
    html = html.replace(/(<\/div>)\s*<\/p>/g, '$1');
    html = html.replace(/<p>\s*(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');

    return html;
  }

  loadChapter(chapterId) {
    const chapter = this.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    this.currentChapter = chapter;
    const contentArea = document.getElementById('content-area');

    const isCompleted = this.progress[chapterId] || false;
    const chapterNotes = this.userNotes[chapterId] || '';

    contentArea.innerHTML = `
      <article class="chapter-content">
        <div class="chapter-header">
          <span class="chapter-label">${chapter.part}</span>
          <h1>${chapter.title}</h1>
          <div class="chapter-actions">
            <label class="checkbox-wrapper">
              <input type="checkbox" id="complete-checkbox" ${isCompleted ? 'checked' : ''}>
              <span>Mark as complete</span>
            </label>
            <button class="btn-icon" id="bookmark-chapter" title="Bookmark this chapter">
              ${this.isBookmarked(chapterId) ? '★' : '☆'}
            </button>
          </div>
        </div>

        ${chapter.content}

        <div class="chapter-notes">
          <h3>Your Notes</h3>
          <textarea id="chapter-notes" placeholder="Add your notes for this chapter...">${chapterNotes}</textarea>
          <button class="btn-secondary" id="save-notes">Save Notes</button>
        </div>

        <div class="chapter-navigation">
          ${chapter.number > 1 ? `<button class="btn-secondary" id="prev-chapter">← Previous Chapter</button>` : ''}
          ${chapter.number < this.chapters.length ? `<button class="btn-primary" id="next-chapter">Next Chapter →</button>` : ''}
        </div>
      </article>
    `;

    // Update navigation active state
    document.querySelectorAll('.side-nav a').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${chapterId}`) {
        link.classList.add('active');
      }
    });

    // Setup chapter-specific event listeners
    this.setupChapterListeners();

    // Scroll to top
    contentArea.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  setupChapterListeners() {
    const completeCheckbox = document.getElementById('complete-checkbox');
    if (completeCheckbox) {
      completeCheckbox.addEventListener('change', (e) => {
        this.toggleComplete(this.currentChapter.id, e.target.checked);
      });
    }

    const bookmarkBtn = document.getElementById('bookmark-chapter');
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', () => {
        this.toggleBookmark(this.currentChapter.id);
        bookmarkBtn.textContent = this.isBookmarked(this.currentChapter.id) ? '★' : '☆';
      });
    }

    const saveNotesBtn = document.getElementById('save-notes');
    if (saveNotesBtn) {
      saveNotesBtn.addEventListener('click', () => {
        const notes = document.getElementById('chapter-notes').value;
        this.saveNotes(this.currentChapter.id, notes);
      });
    }

    const prevBtn = document.getElementById('prev-chapter');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.loadChapter(`chapter-${this.currentChapter.number - 1}`);
      });
    }

    const nextBtn = document.getElementById('next-chapter');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.loadChapter(`chapter-${this.currentChapter.number + 1}`);
      });
    }
  }

  setupEventListeners() {
    // Navigation links
    document.addEventListener('click', (e) => {
      if (e.target.matches('.side-nav a')) {
        e.preventDefault();
        const chapterId = e.target.getAttribute('href').substring(1);
        this.loadChapter(chapterId);
      }
    });

    // Search toggle
    document.getElementById('search-toggle').addEventListener('click', () => {
      this.toggleOverlay('search-overlay');
      document.getElementById('search-input').focus();
    });

    // Search input
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.performSearch(e.target.value);
    });

    // Close search on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('search-overlay').classList.add('hidden');
        document.getElementById('bookmark-sidebar').classList.remove('active');
        document.getElementById('progress-sidebar').classList.remove('active');
      }
    });

    // Close search overlay when clicking background
    document.getElementById('search-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'search-overlay') {
        e.target.classList.add('hidden');
      }
    });

    // Bookmarks toggle
    document.getElementById('bookmark-toggle').addEventListener('click', () => {
      this.toggleSidebar('bookmark-sidebar');
      this.updateBookmarksList();
    });

    // Progress toggle
    document.getElementById('progress-toggle').addEventListener('click', () => {
      this.toggleSidebar('progress-sidebar');
      this.updateProgressList();
    });

    // Print button
    document.getElementById('print-btn').addEventListener('click', () => {
      window.print();
    });

    // Notes button
    document.getElementById('notes-btn').addEventListener('click', () => {
      const notesArea = document.getElementById('chapter-notes');
      if (notesArea) {
        notesArea.focus();
        notesArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // Scroll to top button
    document.getElementById('scroll-top-btn').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Show/hide scroll button based on scroll position
    window.addEventListener('scroll', () => {
      const scrollBtn = document.getElementById('scroll-top-btn');
      if (window.scrollY > 500) {
        scrollBtn.style.display = 'flex';
      } else {
        scrollBtn.style.display = 'none';
      }
    });
  }

  performSearch(query) {
    const resultsContainer = document.getElementById('search-results');

    if (query.length < 3) {
      resultsContainer.innerHTML = '<p class="search-empty">Type at least 3 characters to search...</p>';
      return;
    }

    const results = [];
    const lowerQuery = query.toLowerCase();

    this.chapters.forEach(chapter => {
      const content = chapter.content.replace(/<[^>]*>/g, ''); // Strip HTML
      const titleMatch = chapter.title.toLowerCase().includes(lowerQuery);
      const contentMatch = content.toLowerCase().includes(lowerQuery);

      if (titleMatch || contentMatch) {
        // Find context around match
        const index = content.toLowerCase().indexOf(lowerQuery);
        const start = Math.max(0, index - 100);
        const end = Math.min(content.length, index + 100);
        let excerpt = content.substring(start, end);

        // Highlight the match
        const regex = new RegExp(`(${query})`, 'gi');
        excerpt = excerpt.replace(regex, '<mark>$1</mark>');

        results.push({
          chapter,
          excerpt: '...' + excerpt + '...',
          titleMatch
        });
      }
    });

    if (results.length === 0) {
      resultsContainer.innerHTML = '<p class="search-empty">No results found</p>';
      return;
    }

    resultsContainer.innerHTML = results.map(result => `
      <div class="search-result" data-chapter="${result.chapter.id}">
        <h4>${result.chapter.number}. ${result.chapter.title}</h4>
        <p>${result.excerpt}</p>
      </div>
    `).join('');

    // Add click handlers to results
    resultsContainer.querySelectorAll('.search-result').forEach(result => {
      result.addEventListener('click', () => {
        const chapterId = result.dataset.chapter;
        this.loadChapter(chapterId);
        document.getElementById('search-overlay').classList.add('hidden');
        document.getElementById('search-input').value = '';
      });
    });
  }

  toggleOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    overlay.classList.toggle('hidden');
  }

  toggleSidebar(sidebarId) {
    // Close all sidebars first
    document.querySelectorAll('.sidebar').forEach(sb => sb.classList.remove('active'));

    // Open the requested one
    const sidebar = document.getElementById(sidebarId);
    sidebar.classList.add('active');
  }

  toggleBookmark(chapterId) {
    const index = this.bookmarks.indexOf(chapterId);
    if (index > -1) {
      this.bookmarks.splice(index, 1);
    } else {
      this.bookmarks.push(chapterId);
    }
    this.saveToStorage('bookmarks', this.bookmarks);
    this.updateBookmarksList();
  }

  isBookmarked(chapterId) {
    return this.bookmarks.includes(chapterId);
  }

  updateBookmarksList() {
    const container = document.querySelector('#bookmark-sidebar .bookmark-list');
    if (!container) return;

    if (this.bookmarks.length === 0) {
      container.innerHTML = '<p class="empty-state">No bookmarks yet. Click the ☆ icon to bookmark chapters.</p>';
      return;
    }

    container.innerHTML = this.bookmarks.map(chapterId => {
      const chapter = this.chapters.find(ch => ch.id === chapterId);
      if (!chapter) return '';

      return `
        <div class="bookmark-item">
          <a href="#${chapter.id}">${chapter.number}. ${chapter.title}</a>
          <button class="btn-icon remove-bookmark" data-chapter="${chapter.id}">×</button>
        </div>
      `;
    }).join('');

    // Add remove handlers
    container.querySelectorAll('.remove-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chapterId = btn.dataset.chapter;
        this.toggleBookmark(chapterId);
      });
    });
  }

  toggleComplete(chapterId, isComplete) {
    this.progress[chapterId] = isComplete;
    this.saveToStorage('progress', this.progress);
    this.updateProgressDisplay();

    // Update navigation item
    const navLink = document.querySelector(`.side-nav a[href="#${chapterId}"]`);
    if (navLink) {
      if (isComplete) {
        navLink.classList.add('completed');
      } else {
        navLink.classList.remove('completed');
      }
    }
  }

  updateProgressDisplay() {
    const completedCount = Object.values(this.progress).filter(Boolean).length;
    const totalCount = this.chapters.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Update progress bar in header
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }

    // Update progress text
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = `${completedCount} / ${totalCount} chapters completed`;
    }
  }

  updateProgressList() {
    const container = document.querySelector('#progress-sidebar .progress-list');
    if (!container) return;

    container.innerHTML = this.chapters.map(chapter => {
      const isComplete = this.progress[chapter.id] || false;
      return `
        <div class="progress-item ${isComplete ? 'completed' : ''}">
          <input type="checkbox"
                 id="progress-${chapter.id}"
                 ${isComplete ? 'checked' : ''}
                 data-chapter="${chapter.id}">
          <label for="progress-${chapter.id}">
            ${chapter.number}. ${chapter.title}
          </label>
        </div>
      `;
    }).join('');

    // Add change handlers
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const chapterId = e.target.dataset.chapter;
        this.toggleComplete(chapterId, e.target.checked);
      });
    });
  }

  saveNotes(chapterId, notes) {
    this.userNotes[chapterId] = notes;
    this.saveToStorage('notes', this.userNotes);

    // Show feedback
    const btn = document.getElementById('save-notes');
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('btn-success');
    }, 2000);
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(`authority-guide-${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(`authority-guide-${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  restoreState() {
    // Restore completed states in navigation
    Object.entries(this.progress).forEach(([chapterId, isComplete]) => {
      if (isComplete) {
        const navLink = document.querySelector(`.side-nav a[href="#${chapterId}"]`);
        if (navLink) {
          navLink.classList.add('completed');
        }
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ContentReference();
});
