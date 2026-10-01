import { motion } from "framer-motion";
import { ImageIcon, ChevronDown, ChevronUp, Images } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";

type GalleryType = {
  id: string;
  image_url: string;
  caption: string;
};

const EMPTY_GALLERY: GalleryType[] = [];

export default function GallerySection() {
  const { tenant } = useTenant();

  const [page, setPage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);


  useEffect(() => {
    const section = document.getElementById("gallery");
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
  } = useQuery<GalleryType[]>({
    queryKey: ["gallery", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase.rpc(
        "get_public_coaching_site",
        {
          p_domain: window.location.hostname,
        }
      );

      if (error) throw error;

      return data?.gallery ?? [];
    },
    enabled: isVisible && !!tenant?.id,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  });

  const galleryData = data ?? EMPTY_GALLERY;

  const displayedImages = galleryData.slice(0, (page + 1) * 6);
  const hasMore = displayedImages.length < galleryData.length;

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleShowLess = () => {
    setPage(0);

    document
      .getElementById("gallery")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section
      id="gallery"
      className="py-24 bg-white relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-4 relative z-10">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-[0.2em] uppercase mb-4 border border-primary/20">
            Inside Academy
          </div>

          <h2 className="text-3xl md:text-6xl font-black text-gray-900 tracking-tight mt-4">
            Life at {" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600">
              Our Institute
            </span>
          </h2>

          <p className="mt-6 text-gray-500 max-w-xl mx-auto text-base md:text-lg leading-relaxed font-medium">
            Explore our state-of-the-art classrooms, collaborative study zones, and the success stories we build every single day.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

          {displayedImages.length > 0 ? (
            displayedImages.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                whileInView={{
                  opacity: 1,
                  scale: 1,
                }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                }}
                whileHover={{ y: -10 }}
                className="group relative aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-[0_15px_35px_-15px_rgba(0,0,0,0.1)] transition-all duration-500"
              >

                {/* Image */}
                <img
                  src={
                    img.image_url +
                    "?width=400&quality=70"
                  }
                  alt={img.caption}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />

                {/* Premium Glass Overlay */}
                <div className="absolute inset-x-4 bottom-4">
                  <div className="bg-black/20 backdrop-blur-md border border-white/20 p-4 rounded-[1.8rem] translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl">

                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>

                      <span className="text-white text-xs md:text-sm font-bold tracking-wide line-clamp-1">
                        {img.caption}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 md:opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none" />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">

              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 animate-pulse" />

              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                No photos available yet
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        {galleryData.length > 6 && (
          <div className="mt-10 flex justify-center">

            {hasMore ? (
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                className="group h-16 rounded-[2rem] px-12 border-2 border-gray-200 bg-white text-gray-700 font-black hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 shadow-sm hover:shadow-primary/20  tracking-[0.15em] text-[14px] md:text-sm relative overflow-hidden"
              >

                <span className="absolute inset-0 w-0 bg-primary/5 transition-all duration-300 group-hover:w-full -z-10" />

                <div className="flex items-center gap-3">
                  Show More

                  <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-1" />
                </div>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={handleShowLess}
                className="group h-16 rounded-[2rem] px-12 border-2 border-gray-100 bg-white text-gray-700 font-black hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 shadow-sm hover:shadow-primary/20  tracking-[0.15em] text-[14px] md:text-sm relative overflow-hidden"
              >

                <span className="absolute inset-0 w-0 bg-primary/5 transition-all duration-300 group-hover:w-full -z-10" />

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