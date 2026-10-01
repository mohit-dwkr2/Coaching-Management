import { motion } from "framer-motion";
import { User, BookOpen, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";

type FacultyType = {
  id: string;
  name: string;
  subject: string;
  experience_years: number;
  image_url: string;
};


export default function FacultySection() {
  const { tenant } = useTenant();

  const [page, setPage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // ✅ Scroll detect (load only when visible)
  useEffect(() => {
    const section = document.getElementById("faculty");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // 🔥 stop observing after first load
        }
      },
      { rootMargin: "100px" }
    );

    if (section) observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);




  // ✅ Fetch + cache (1 hour)
  const EMPTY_FACULTY: FacultyType[] = [];

  const { data, isError } = useQuery<FacultyType[]>({
    queryKey: ["faculty", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase.rpc(
        "get_public_coaching_site",
        {
          p_domain: window.location.hostname,
        }
      );

      if (error) throw error;

      return data?.faculty ?? [];
    },
    enabled: isVisible && !!tenant?.id,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  });

  const allFaculty = data ?? EMPTY_FACULTY;

  const facultyData = allFaculty.slice(
    0,
    (page + 1) * 4
  );

  const hasMore = allFaculty.length > facultyData.length;


  // ✅ load next page
  const handleShowMore = () => {
    setPage(prev => prev + 1);
  };


  // ✅ reset to first page
  const handleShowLess = () => {
    setPage(0);

    document
      .getElementById("faculty")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="faculty" className="py-24 bg-gradient-to-b from-white to-[#f0f7ff] relative overflow-hidden">

      {/* Background same */}
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute top-10 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-[10%] w-96 h-96 bg-blue-400/10 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">

        {/* Heading same */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="px-4 py-1.5 rounded-full bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase mb-4 inline-block shadow-lg shadow-primary/20"
          >
            World-Class Mentors
          </motion.span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mt-4">
            Our <span className="text-blue-600">Expert Mentors</span>
          </h2>
          <p className="mt-6 text-gray-500 max-w-2xl mx-auto md:text-lg text-sm leading-relaxed font-medium">
            "Learn from Highly Experienced Educators Dedicated to Your Navodaya Success"
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {facultyData.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -15 }}
              className="group relative"
            >
              <div className="relative bg-white rounded-[3rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 group-hover:border-blue-400 transition-all duration-500 z-10 overflow-hidden">

                <div className="relative aspect-[1/1.1] rounded-[2.5rem] overflow-hidden bg-gray-100">
                  {f.image_url ? (
                    <img
                      src={f.image_url + "?width=400&quality=70"}
                      alt={f.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <User className="h-20 w-20 text-gray-400" />
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <div className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold shadow-xl">
                      {f.experience_years}Y+ EXPERIENCE
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-blue-400 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-8">
                    <div className="flex gap-3 translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="p-3 rounded-full bg-white text-blue-600 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer shadow-lg">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 pb-4 px-4 text-center">
                  <h3 className="text-xl font-black text-gray-800 tracking-tight mb-1 group-hover:text-blue-600 transition-colors">
                    {f.name}
                  </h3>
                  <p className="text-blue-600 text-xs font-black uppercase tracking-[0.15em] opacity-80">
                    {f.subject}
                  </p>

                  <div className="w-10 h-1 bg-gray-100 mx-auto mt-4 rounded-full group-hover:w-20 group-hover:bg-blue-600 transition-all duration-500" />
                </div>
              </div>

              <div className="absolute -inset-2 bg-gradient-to-r from-primary to-blue-500 rounded-[3.5rem] opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10" />
            </motion.div>
          ))}
        </div>

        {/* Buttons */}
        <div className="text-center mt-10">
          {hasMore ? (
            <button onClick={handleShowMore} className="h-14 rounded-full px-10 border-2 border-gray-200 text-gray-700 font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 shadow-sm">
              Show More
            </button>
          ) : facultyData.length > 4 ? (
            <button onClick={handleShowLess} className="h-14 rounded-full px-10 border-2 border-gray-200 text-gray-700 font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 shadow-sm">
              Show Less
            </button>
          ) : null}
        </div>

        {facultyData.length === 0 && isVisible && (
          <p className="text-center text-muted-foreground mt-10 font-medium tracking-wide text-gray-400">
            No faculty members added yet.
          </p>
        )}

      </div>
    </section>
  );
}