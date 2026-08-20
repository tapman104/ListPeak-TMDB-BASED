const fs = require('fs');
const path = require('path');

const file = path.resolve('src/pages/DetailPage.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add derived values
const studiosMatch = "  // Production companies (first 3)\n  const studios: { id: number; name: string; logo_path: string | null }[] =\n    ((data as any).production_companies ?? []).slice(0, 3);";
const derivedValues = `
  // Aired date range
  const airedRange = (() => {
    if (type === 'movie') return null;
    const start = (data as any).first_air_date;
    const end = (data as any).last_air_date;
    if (!start) return null;
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (data.status === 'Ended' && end && end !== start) return \`\${fmt(start)} – \${fmt(end)}\`;
    return fmt(start);
  })();

  // Aired on (weekdays)
  const airedOn = (() => {
    if (type !== 'tv') return null;
    return (data as any).networks?.[0]?.origin_country === 'KR'
      ? null // TMDB doesn't reliably return this; skip for KR shows
      : null;
    // Note: TMDB doesn't expose broadcast day reliably — omit this field
  })();

  // Episode runtime
  const episodeRuntime = (() => {
    const rt = (data as any).episode_run_time;
    if (!rt || rt.length === 0) return null;
    const mins = rt[0];
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? \`\${h} hr. \${m} min.\` : \`\${m} min.\`;
  })();

  // Movie runtime
  const movieRuntime = (() => {
    if (type !== 'movie') return null;
    const mins = (data as any).runtime;
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? \`\${h} hr. \${m} min.\` : \`\${m} min.\`;
  })();

  // Country of origin
  const originCountry = (() => {
    const countries = (data as any).origin_country as string[] | undefined;
    if (countries && countries.length > 0) {
      const names: Record<string, string> = {
        KR: 'South Korea', JP: 'Japan', US: 'United States',
        CN: 'China', TW: 'Taiwan', TH: 'Thailand', GB: 'United Kingdom',
      };
      return names[countries[0]] ?? countries[0];
    }
    return (data as any).production_countries?.[0]?.name ?? null;
  })();

  // Format / type label
  const formatLabel = (() => {
    if (type === 'movie') return 'Movie';
    const epCount = (data as any).number_of_episodes;
    const seasonCount = (data as any).number_of_seasons;
    if (seasonCount === 1 && epCount <= 20) return 'Mini Series';
    return 'Standard Series';
  })();

  // Genre label (first genre)
  const genreLabel = (data as any).genres?.[0]?.name ?? null;`;

content = content.replace(studiosMatch, studiosMatch + '\n' + derivedValues);


// 2. Replace DETAILS GRID SECTION
const detailsGridRegex = /<h2 className="font-sans font-medium text-\[11px\] uppercase tracking-\[0\.14em\] text-\[#5a5a72\] mb-4\">\s*DETAILS\s*<\/h2>[\s\S]*?<\/div>\s*<div className="border-t border-\[rgba\(255,255,255,0\.06\)\] mt-8 sm:mt-10 w-full" \/>\s*<\/motion\.section>/;
const newDetailsGrid = `<h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72] mb-4">
            DETAILS
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 max-w-[720px]">
          
            {/* Title */}
            <div className="flex flex-col">
              <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">TITLE</span>
              <span className="font-sans font-medium text-xs text-[#c8c8d8]">{data.title || data.name}</span>
            </div>
          
            {/* Type/Genre */}
            {genreLabel && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">TYPE</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{genreLabel}</span>
              </div>
            )}
          
            {/* Format */}
            <div className="flex flex-col">
              <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">FORMAT</span>
              <span className="font-sans font-medium text-xs text-[#c8c8d8]">{formatLabel}</span>
            </div>
          
            {/* Country */}
            {originCountry && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">COUNTRY</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{originCountry}</span>
              </div>
            )}
          
            {/* Status */}
            {data.status && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">STATUS</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{data.status}</span>
              </div>
            )}
          
            {/* Language */}
            {spokenLang && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">LANGUAGE</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{spokenLang}</span>
              </div>
            )}
          
            {/* Network */}
            {networks.length > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">NETWORK</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{networks.map((n: any) => n.name).join(', ')}</span>
              </div>
            )}
          
            {/* Episodes */}
            {numEpisodes !== undefined && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">EPISODES</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{numEpisodes}</span>
              </div>
            )}
          
            {/* Seasons */}
            {numSeasons !== undefined && numSeasons > 1 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">SEASONS</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{numSeasons}</span>
              </div>
            )}
          
            {/* Aired */}
            {airedRange && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">AIRED</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{airedRange}</span>
              </div>
            )}
          
            {/* Duration */}
            {(episodeRuntime || movieRuntime) && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">DURATION</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{episodeRuntime || movieRuntime}</span>
              </div>
            )}
          
            {/* Content Rating */}
            {(contentRating || mpaaRating) && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">RATING</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{contentRating || mpaaRating}</span>
              </div>
            )}
          
            {/* Director — movies */}
            {director && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">DIRECTOR</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{director.name}</span>
              </div>
            )}
          
            {/* Creator — TV */}
            {createdBy && createdBy.length > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">CREATOR</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{createdBy.map((c: any) => c.name).join(', ')}</span>
              </div>
            )}
          
            {/* Studio */}
            {studios.length > 0 && (
              <div className="flex flex-col col-span-2">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">STUDIO</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{studios.map((s: any) => s.name).join(' · ')}</span>
              </div>
            )}
          
            {/* Budget / Revenue — movies */}
            {(data as any).budget > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">BUDGET</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">\${(data as any).budget.toLocaleString()}</span>
              </div>
            )}
            {(data as any).revenue > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">REVENUE</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">\${(data as any).revenue.toLocaleString()}</span>
              </div>
            )}
          
            {/* Votes */}
            {data.vote_count > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">VOTES</span>
                <span className="font-sans font-medium text-xs text-[#c8c8d8]">{data.vote_count.toLocaleString()} votes</span>
              </div>
            )}
          
          </div>
        </motion.section>`;
content = content.replace(detailsGridRegex, newDetailsGrid);

// 3. Spacing changes
content = content.replace(/gap-8 sm:gap-10 md:gap-12/g, 'gap-8 sm:gap-10');
content = content.replace(/<div className="border-t border-\[rgba\(255,255,255,0\.06\)\] mt-8 sm:mt-10 w-full" \/>\n\s*/g, '');

// 4. Contrast changes
content = content.replace(/#9898b0/g, '#a0a0b8');

// OVERVIEW body text
content = content.replace(
  /<p className="font-sans font-normal text-sm sm:text-base md:text-lg text-\[#e2e2e2\] leading-\[1\.6\] max-w-\[840px\]">/,
  '<p className="font-sans text-sm sm:text-base text-[#d0d0e0] leading-relaxed max-w-[840px]">'
);

// TOP CAST actor name labels
content = content.replace(
  /<span className="font-sans font-semibold text-xs text-\[#eeeef5\] truncate" title=\{actor\.name\}>/g,
  '<span className="font-sans font-medium text-xs text-[#c8c8d8] truncate" title={actor.name}>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Replacements complete');
