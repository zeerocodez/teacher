const fs = require('fs');

const marketPath = 'src/components/Marketplace.jsx';
let content = fs.readFileSync(marketPath, 'utf8');

// 1. Update signature
const sigRegex = /export default function Marketplace\(\{\s*teachers\s*=\s*\[\],\s*selectedCurrency,\s*onBookClick,\s*formatCurrency,\s*convertMinor,\s*onTeacherSelect,\s*onWatchVideo,\s*isNested\s*=\s*false\s*\}\) \{/;
if (content.match(sigRegex)) {
  content = content.replace(sigRegex, `export default function Marketplace({ 
  teachers = [], 
  hasMoreTeachers,
  loadFilteredTeachers,
  teachersPage,
  selectedCurrency, 
  onBookClick, 
  formatCurrency, 
  convertMinor,
  onTeacherSelect,
  onWatchVideo,
  isNested = false
}) {`);
  console.log('Updated Marketplace signature');
} else {
  console.log('Signature match failed.');
}

// 2. Remove local filtering
const filterBlockRegex = /\/\/ Filter teachers based on state[\s\S]*?return matchesSubject && matchesCurriculum && matchesSearch;\s*\}\);/;
if (content.match(filterBlockRegex)) {
  const useEffectBlock = `  // Fetch from backend when filters change
  React.useEffect(() => {
    if (loadFilteredTeachers) {
      // Use a small timeout for debounce on search
      const delay = setTimeout(() => {
        loadFilteredTeachers({
          subject: subjectFilter,
          curriculum: curriculumFilter,
          search: searchQuery
        }, 1, false);
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [subjectFilter, curriculumFilter, searchQuery]);`;
  content = content.replace(filterBlockRegex, useEffectBlock);
  console.log('Replaced local filtering with useEffect');
} else {
  console.log('Filter block match failed.');
}

// 3. Replace filteredTeachers with teachers
content = content.replace(/filteredTeachers/g, 'teachers');

// 4. Add Load More button
const endRegex = /<\/motion\.div>\s*\)\}\s*<\/section>/;
if (content.match(endRegex)) {
  const loadMoreBlock = `</motion.div>
      )}

      {hasMoreTeachers && (
        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => loadFilteredTeachers({
              subject: subjectFilter,
              curriculum: curriculumFilter,
              search: searchQuery
            }, teachersPage + 1, true)}
            className="btn-magnetic bg-brand-moss hover:bg-brand-moss/90 text-brand-cream font-bold py-3.5 px-8 rounded-full text-sm uppercase tracking-widest shadow-lg shadow-brand-moss/20"
          >
            Load More Educators
          </button>
        </div>
      )}
    </section>`;
  content = content.replace(endRegex, loadMoreBlock);
  console.log('Added Load More button');
} else {
  console.log('End block match failed.');
}

fs.writeFileSync(marketPath, content, 'utf8');
