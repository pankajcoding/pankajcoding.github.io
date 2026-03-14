import { minify } from 'html-minifier-terser';
import { readFileSync, writeFileSync } from 'fs';

// Original class name → Harry Potter spell/character mapping
const CLASS_MAP = {
  'about-bg-shapes':        'expelliarmus',
  'about-container':        'accio',
  'about-content':          'lumos',
  'about-shape':            'nox',
  'about-shape-1':          'alohomora',
  'about-shape-2':          'wingardium',
  'about-shape-3':          'leviosa',
  'about-text':             'avada',
  'about-visual':           'kedavra',
  'achievement-icon':       'crucio',
  'achievement-item':       'impedimenta',
  'achievement-text':       'stupefy',
  'achievements-list':      'protego',
  'active':                 'riddikulus',
  'award-pill':             'patronus',
  'bottom-nav':             'expecto',
  'browser-content':        'incarcerous',
  'browser-dot':            'incendio',
  'browser-header':         'petrificus',
  'btn':                    'totalus',
  'btn-primary':            'aguamenti',
  'btn-secondary':          'obliviate',
  'card-1':                 'reparo',
  'card-2':                 'scourgify',
  'card-3':                 'silencio',
  'card-award':             'ferula',
  'card-top':               'locomotor',
  'company-header':         'diffindo',
  'company-info':           'sectumsempra',
  'company-logo':           'episkey',
  'contact-3d-canvas':      'evanesco',
  'contact-buttons':        'engorgio',
  'contact-card':           'reducio',
  'contact-container':      'sonorus',
  'contact-description':    'quietus',
  'contact-icon':           'morsmordre',
  'contact-links':          'levicorpus',
  'content-line':           'liberacorpus',
  'dot-green':              'colloportus',
  'dot-red':                'bombarda',
  'dot-yellow':             'depulso',
  'experience-card':        'duro',
  'experience-container':   'flipendo',
  'experience-header':      'glacius',
  'experience-item':        'immobulus',
  'experience-items':       'harry',
  'experience-timeline':    'hermione',
  'floating-card':          'ronald',
  'hero-3d-canvas':         'dumbledore',
  'hero-avatar':            'voldemort',
  'hero-buttons':           'snape',
  'hero-container':         'malfoy',
  'hero-content':           'hagrid',
  'hero-description':       'luna',
  'hero-greeting':          'neville',
  'hero-personal':          'sirius',
  'hero-subtitle':          'remus',
  'hero-title':             'bellatrix',
  'hero-visual':            'mcgonagall',
  'horizontal-container':   'dobby',
  'horizontal-wrapper':     'hedwig',
  'line-short':             'kreacher',
  'line-subtitle':          'umbridge',
  'line-text':              'lupin',
  'line-title':             'weasley',
  'loading':                'potter',
  'mockup-browser':         'granger',
  'nav-dot':                'longbottom',
  'panel':                  'lovegood',
  'panel-about':            'draco',
  'panel-contact':          'ginny',
  'panel-experience':       'molly',
  'panel-hero':             'arthur',
  'panel-projects':         'fred',
  'parallax-bg':            'george',
  'parallax-content':       'percy',
  'parallax-mid':           'charlie',
  'progress-bar':           'fleur',
  'project-card':           'tonks',
  'project-content':        'moody',
  'project-description':    'cedric',
  'project-link':           'cho',
  'project-mockup':         'flitwick',
  'project-preview':        'sprout',
  'project-tech':           'trelawney',
  'project-title':          'slughorn',
  'projects-container':     'lockhart',
  'projects-header':        'quirrell',
  'projects-scroll':        'hogwarts',
  'role':                   'hogsmeade',
  'scroll-hint':            'diagon',
  'scroll-mouse':           'azkaban',
  'section-subtitle':       'gryffindor',
  'section-title':          'slytherin',
  'skill-tag':              'hufflepuff',
  'skills-gained':          'ravenclaw',
  'skills-tags':            'knockturn',
  'tech-tag':               'godrics',
  'timeline-date':          'privet',
  'timeline-dot':           'grimmauld',
  'timeline-progress-fill': 'horcrux',
  'timeline-track':         'hallows',
  'typing-cursor':          'nimbus',
};

function obfuscateClasses(html) {
  // 1. Replace class="..." attribute values
  html = html.replace(/class="([^"]+)"/g, (_, classes) =>
    `class="${classes.split(/\s+/).map(c => CLASS_MAP[c] ?? c).join(' ')}"`
  );

  // 2. Replace .classname in CSS selectors and querySelector/querySelectorAll strings
  //    Sort longest first to avoid partial matches (e.g. panel-hero before panel)
  const sorted = Object.entries(CLASS_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [orig, hp] of sorted) {
    const esc = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`\\.${esc}(?![a-zA-Z0-9_-])`, 'g'), `.${hp}`);
  }

  // 3. Replace classList.add/remove/toggle/contains('classname') string literals
  // Handles both single-arg and multi-arg: classList.toggle('active', bool)
  html = html.replace(
    /classList\.(add|remove|toggle|contains)\(["']([^"']+)["']/g,
    (match, method, cls) => `classList.${method}('${CLASS_MAP[cls] ?? cls}'`
  );

  return html;
}

const src = readFileSync('portfolio.html', 'utf8');
const obfuscated = obfuscateClasses(src);
const result = await minify(obfuscated, {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: { mangle: true, compress: true },
  removeAttributeQuotes: true,
  removeEmptyAttributes: true,
});

const comment = `<!--
      ⚡
    _/ \\_
   | O O |     You're a wizard, Harry.
    \\___/
-->\n`;

writeFileSync('index.html', comment + result);
console.log(`Built: ${src.length} → ${result.length} chars`);
console.log(`Classes obfuscated: ${Object.keys(CLASS_MAP).length}`);
