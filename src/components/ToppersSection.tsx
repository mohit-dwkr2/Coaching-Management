import { motion } from "framer-motion";
import { Award, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";

type TopperType = {
  id: string;
  name: string;
  image_url: string;
  percentage: number;
  student_class: string;
  batch_year: string;
};

export default function ToppersSection() {
  const { tenant } = useTenant();
  const [page, setPage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Load data only when the section approaches the viewport.
  useEffect(() => {
    const section = document.getElementById("results");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  const {
    data,
    isError,
    isFetching,
  } = useQuery<TopperType[]>({
    queryKey: ["toppers", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase.rpc(
        "get_public_coaching_site",
        {
          p_domain: window.location.hostname,
        }
      );

      if (error) throw error;

      return data?.toppers ?? [];
    },
    enabled: isVisible && !!tenant?.id,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  });

  const toppersData = data ?? [];

  const displayedToppers = toppersData.slice(0, (page + 1) * 8);

  const hasMore = displayedToppers.length < toppersData.length;

  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleShowLess = () => {
    setPage(0);

    document
      .getElementById("results")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  if (isError) {
    return (
      <p className="text-center py-10 text-red-500">
        Error loading toppers
      </p>
    );
  }


  return (
    <section
      id="results"
      className="py-24 bg-white relative overflow-hidden"
    >
      {/* Decorative Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-5 pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-primary rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm border border-yellow-200">
            <Trophy className="w-3 h-3" />
            Wall of Fame
          </div>

          <h2 className="text-[32px] leading-tight md:text-6xl font-black text-gray-900 tracking-tight mt-4">
            Meet Our{" "}
            <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 whitespace-nowrap">
              Legendary Toppers
            </span>
          </h2>

          <p className="mt-6 text-gray-500 max-w-xl mx-auto text-lg leading-relaxed font-medium">
            Celebrating the brilliant minds who transformed hard work into outstanding academic success.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {displayedToppers.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
              }}
              whileHover={{ y: -12 }}
              className="group relative"
            >

              {/* Main Card */}
              <div className="relative z-10 bg-white rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-3 shadow-[0_15px_35px_-15px_rgba(0,0,0,0.08)] group-hover:shadow-[0_25px_50px_-12px_rgba(234,179,8,0.2)] border border-gray-100 transition-all duration-500 overflow-hidden">

                {/* Image */}
                <div className="relative aspect-square w-full rounded-[1.6rem] md:rounded-[2rem] overflow-hidden bg-gray-50 shadow-inner">
                  {t.image_url ? (
                    <img
                      src={
                        t.image_url +
                        "?width=400&quality=70"
                      }
                      alt={t.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <Award className="h-12 w-12 md:h-16 md:w-16 text-yellow-500/30 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}

                  {/* Percentage Badge */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:bottom-auto md:top-3 md:right-3 md:left-auto md:translate-x-0 z-20">
                    <div className="px-3 py-1 md:px-4 md:py-2 rounded-full md:rounded-2xl bg-black/70 md:bg-black/40 backdrop-blur-md text-white border border-white/20 shadow-xl flex items-center justify-center whitespace-nowrap">
                      <span className="text-[10px] md:text-lg font-black tracking-tighter">
                        {t.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Info */}
                <div className="p-3 md:p-5 text-center">
                  <h3 className="font-black text-gray-800 text-sm md:text-xl tracking-tight group-hover:text-yellow-600 transition-colors line-clamp-1 ">
                    {t.name}
                  </h3>

                  <div className="flex flex-col gap-1 mt-1 md:mt-2">
                    <div className="inline-flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-bold text-gray-600  tracking-widest">
                      <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-primary" />
                      Class {t.student_class}
                    </div>

                    <div className="text-[8px] md:text-[10px] font-black text-yellow-600 uppercase bg-yellow-50/50 self-center px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-yellow-100/50">
                      Batch {t.batch_year}
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow Border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 rounded-[2.2rem] md:rounded-[2.7rem] opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-500 -z-0" />
            </motion.div>
          ))}
        </div>

        {/* Buttons */}
        {toppersData.length > 8 && (
          <div className="mt-14 text-center relative z-10">
            {hasMore ? (
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore} disabled={isFetching || !hasMore}
                className="group h-16 rounded-[2rem] px-12 border-2 border-gray-200 bg-white text-gray-700 font-black hover:border-yellow-500 hover:text-yellow-600 hover:bg-yellow-50/50 transition-all duration-300 shadow-sm hover:shadow-[0_15px_30px_-10px_rgba(234,179,8,0.2)]  tracking-widest text-sm relative overflow-hidden"
              >
                <span className="absolute inset-0 w-0 bg-yellow-50 transition-all duration-300 group-hover:w-full -z-10" />

                <div className="flex items-center gap-3">
                  {isFetching ? "Loading..." : "Show More"}
                  <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-1" />
                </div>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={handleShowLess}
                className="group h-16 rounded-[2rem] px-12 border-2 border-gray-200 bg-white text-gray-700 font-black hover:border-yellow-500 hover:text-yellow-600 hover:bg-yellow-50/50 transition-all duration-300 shadow-sm hover:shadow-[0_15px_30px_-10px_rgba(234,179,8,0.2)] tracking-widest text-sm relative overflow-hidden"
              >
                <span className="absolute inset-0 w-0 bg-yellow-50 transition-all duration-300 group-hover:w-full -z-10" />

                <div className="flex items-center gap-3">
                  Show Less
                  <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
                </div>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}