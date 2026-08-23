import { useMemo } from 'react';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function CastPage() {
  const { id } = useParams({ from: '/detail/$id/cast' });
  const { type } = useSearch({ from: '/detail/$id/cast' });
  const navigate = useNavigate();
  const apiKey = useKeyStore((state) => state.apiKey);

  const tmdb = useMemo(
    () => (apiKey ? createTMDBClient(apiKey) : null),
    [apiKey]
  );

  const { data: credits, isLoading } = useQuery({
    queryKey: ['credits', type, id],
    queryFn: ({ signal }) =>
      type === 'tv'
        ? tmdb!.getTVCredits(id, { signal })
        : tmdb!.getMovieCredits(id, { signal }),
    enabled: !!apiKey && !!tmdb && !!id && !!type,
    staleTime: 1000 * 60 * 10,
  });

  const cast: any[] = credits?.cast ?? [];
  const crew: any[] = credits?.crew ?? [];

  // Dedupe crew by name, keep highest-order role per person
  const crewByName = new Map<string, any>();
  crew.forEach((c) => {
    if (!crewByName.has(c.name)) crewByName.set(c.name, c);
  });
  const dedupedCrew = Array.from(crewByName.values());

  // Group crew by department
  const crewByDept = dedupedCrew.reduce<Record<string, any[]>>((acc, c) => {
    const dept = c.department || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(c);
    return acc;
  }, {});

  const deptOrder = [
    'Directing', 'Writing', 'Production', 'Camera',
    'Sound', 'Art', 'Editing', 'Visual Effects', 'Other',
  ];
  const sortedDepts = [
    ...deptOrder.filter((d) => crewByDept[d]),
    ...Object.keys(crewByDept).filter((d) => !deptOrder.includes(d)),
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg,#07070f)] text-[#eeeef5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 pt-16 sm:pt-20">

        {/* Back button */}
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: '/' })}
          className="flex items-center gap-2 text-[#5a5a72] hover:text-[#eeeef5] transition-colors mb-6 font-sans text-sm cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-[#5a5a72] text-sm">
            Loading credits…
          </div>
        )}

        {!isLoading && credits && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-10"
          >

            {/* CAST */}
            {cast.length > 0 && (
            <motion.section variants={itemVariants}>
              <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72] mb-4">
                Cast — {cast.length}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {cast.map((member) => (
                  <div
                    key={member.cast_id ?? member.credit_id ?? member.id}
                    className="flex items-center gap-3 bg-[#0e0e1a] rounded-xl px-3 py-2.5 cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                    onClick={() => navigate({ to: '/person/$id', params: { id: String(member.id) } })}
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-[#1a1a2e]">
                      {member.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#3a3a52]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="8" r="4"/>
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans font-medium text-xs text-[#c8c8d8] leading-snug truncate">{member.name}</span>
                      {member.character && (
                        <span className="font-sans text-[10px] text-[#5a5a72] truncate">{member.character}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
            )}

            {/* CREW — grouped by department */}
            {sortedDepts.map((dept) => (
              <motion.section key={dept} variants={itemVariants}>
                <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72] mb-4">
                  {dept} — {crewByDept[dept].length}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {crewByDept[dept].map((member, idx) => (
                    <div
                      key={member.credit_id ?? `${member.id}-${idx}`}
                      className="flex items-center gap-3 bg-[#0e0e1a] rounded-xl px-3 py-2.5 cursor-pointer hover:bg-[#1a1a2e] transition-colors"
                      onClick={() => navigate({ to: '/person/$id', params: { id: String(member.id) } })}
                    >
                      <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-[#1a1a2e]">
                        {member.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#3a3a52]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="8" r="4"/>
                              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-sans font-medium text-xs text-[#c8c8d8] leading-snug truncate">{member.name}</span>
                        {member.job && (
                          <span className="font-sans text-[10px] text-[#5a5a72] truncate">{member.job}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}

          </motion.div>
        )}
      </div>
    </div>
  );
}
