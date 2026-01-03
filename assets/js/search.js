(function() {
  let searchData = [];
  let selectedIndex = -1;

  // Fetch search data
  async function loadSearchData() {
    try {
      const response = await fetch('/search.json');
      searchData = await response.json();
    } catch (error) {
      console.error('Failed to load search data:', error);
    }
  }

  // Initialize search
  function initSearch() {
    const overlay = document.getElementById('search-overlay');
    const toggle = document.getElementById('search-toggle');
    const close = document.getElementById('search-close');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');

    if (!overlay || !toggle || !input) return;

    // Load search data on page load
    loadSearchData();

    // Open search
    toggle.addEventListener('click', function() {
      overlay.classList.add('active');
      input.focus();
      document.body.style.overflow = 'hidden';
    });

    // Close search
    function closeSearch() {
      overlay.classList.remove('active');
      input.value = '';
      results.innerHTML = '<div class="search-empty"><p>검색 결과가 여기에 표시됩니다</p></div>';
      selectedIndex = -1;
      document.body.style.overflow = '';
    }

    close.addEventListener('click', closeSearch);
    
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeSearch();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      // Open with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        overlay.classList.add('active');
        input.focus();
        document.body.style.overflow = 'hidden';
      }

      // Close with Escape
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeSearch();
      }

      // Navigate results with arrow keys
      if (overlay.classList.contains('active')) {
        const items = results.querySelectorAll('.search-result-item');
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
          updateSelection(items);
        }
        
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, 0);
          updateSelection(items);
        }
        
        if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
          e.preventDefault();
          items[selectedIndex].click();
        }
      }
    });

    // Update selection highlight
    function updateSelection(items) {
      items.forEach((item, index) => {
        if (index === selectedIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }

    // Search input handler
    let debounceTimer;
    input.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = input.value.trim().toLowerCase();
        selectedIndex = -1;
        
        if (query.length < 2) {
          results.innerHTML = '<div class="search-empty"><p>2글자 이상 입력해주세요</p></div>';
          return;
        }

        const filtered = searchData.filter(item => {
          const titleMatch = item.title && item.title.toLowerCase().includes(query);
          const contentMatch = item.content && item.content.toLowerCase().includes(query);
          const categoryMatch = item.categories && item.categories.some(cat => 
            cat.toLowerCase().includes(query)
          );
          return titleMatch || contentMatch || categoryMatch;
        });

        if (filtered.length === 0) {
          results.innerHTML = '<div class="search-empty"><p>검색 결과가 없습니다</p></div>';
          return;
        }

        results.innerHTML = filtered.map((item, index) => {
          const categories = item.categories ? item.categories.join(', ') : '';
          const snippet = highlightMatch(item.content || '', query);
          
          return `
            <a href="${item.url}" class="search-result-item" data-index="${index}">
              <div class="search-result-title">${highlightMatch(item.title, query)}</div>
              ${categories ? `<div class="search-result-category">${categories}</div>` : ''}
              <div class="search-result-snippet">${snippet}</div>
              <div class="search-result-date">${item.date}</div>
            </a>
          `;
        }).join('');

        // Add hover handlers
        results.querySelectorAll('.search-result-item').forEach((item, index) => {
          item.addEventListener('mouseenter', () => {
            selectedIndex = index;
            updateSelection(results.querySelectorAll('.search-result-item'));
          });
        });
      }, 200);
    });

    // Highlight matching text
    function highlightMatch(text, query) {
      if (!text) return '';
      const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }

    // Escape special regex characters
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
})();

