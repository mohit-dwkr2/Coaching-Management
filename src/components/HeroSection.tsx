import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Award, ShieldCheck, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";
import { useQuery } from "@tanstack/react-query";

const stats = [
  {
    icon: Users,
    value: "4000+",
    label: "STUDENTS TAUGHT",
  },
  {
    icon: Award,
    value: "400+",
    label: "DISTRICT SELECTIONS",
  },
  {
    icon: ShieldCheck,
    value: "40+",
    label: "YEARS OF EXCELLENCE",
  },
];

export default function HeroSection() {
  // ✅ Fetch + Cache (1 hour)
  const { data } = useQuery({
    queryKey: ["hero"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("Coaching-3_Hero")
        .select("heading, subheading, highlight_word, image_url")
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2,
  });

  const heroData = data;

  // ✅ Dynamic heading from Supabase
  const renderHeading = () => {
    const rawHeading =
      heroData?.heading || "Where Excellence Meets Ambition";

    const highlightWord = heroData?.highlight_word || "";

    const words = rawHeading.split(/\s+/).filter(Boolean);

    return words.map((word, index) => {
      const isHighlighted =
        word.toLowerCase().replace(/[^\w]/g, "") ===
        highlightWord.toLowerCase().replace(/[^\w]/g, "");

      return (
        <span key={index}>
          <span className={isHighlighted ? "text-blue-600" : ""}>
            {word}
          </span>

          {index !== words.length - 1 && " "}

          {index === 1 && (
            <br className="hidden sm:block" />
          )}
        </span>
      );
    });
  };


  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();

    const element = document.getElementById(id);

    if (!element) return;

    const navbarOffset = 80;

    const elementPosition =
      element.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: elementPosition - navbarOffset,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="home"
      className="relative min-h-[90vh] pt-28 pb-20 bg-[#f7f9fc] overflow-hidden flex flex-col justify-center"
    >
      {/* ===================================================== */}
      {/* PREMIUM BACKGROUND */}
      {/* ===================================================== */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft blue glow */}
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-blue-500/[0.08] blur-[100px]" />

        {/* Indigo glow */}
        <div className="absolute top-20 right-[-180px] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.08] blur-[100px]" />

        {/* Bottom glow */}
        <div className="absolute bottom-[-250px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-400/[0.05] blur-[120px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>


      {/* ===================================================== */}
      {/* MAIN CONTAINER */}
      {/* ===================================================== */}

      <div className="container mx-auto px-4 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">


          {/* ================================================= */}
          {/* LEFT CONTENT */}
          {/* ================================================= */}

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 text-center lg:text-left"
          >

            {/* Admission Badge */}

            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-blue-100 text-blue-600 text-[11px] font-black uppercase tracking-[0.12em] mb-7 shadow-[0_8px_25px_rgba(37,99,235,0.08)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>

              <Sparkles className="w-3.5 h-3.5" />

              <span>
                Admissions Open 2026-27
              </span>
            </div>


            {/* Main Heading */}

            <h1 className="text-4xl sm:text-5xl lg:text-[4.35rem] font-black text-slate-950 tracking-[-0.035em] leading-[1.06]">
              {renderHeading()}
            </h1>


            {/* Dynamic Subheading */}

            <p className="mt-7 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-medium leading-[1.75]">
              {heroData?.subheading ||
                "Empowering K-12 students with expert coaching, proven results, and a clear path to academic greatness — for over 15 years."}
            </p>


            {/* ================================================= */}
            {/* CTA BUTTONS */}
            {/* ================================================= */}

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">

              {/* Apply Button */}

              <Button
                asChild
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[15px] shadow-[0_12px_30px_rgba(37,99,235,0.22)] hover:shadow-[0_16px_35px_rgba(37,99,235,0.30)] hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <a
                  href="#contact"
                  onClick={(e) => handleSmoothScroll(e, "contact")}
                  className="flex items-center justify-center"
                >
                  <span>
                    Apply for Admission
                  </span>

                  <ArrowRight className="ml-2.5 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </Button>


              {/* Explore Batches Button */}

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 rounded-2xl border-slate-200 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/60 font-bold text-[15px] transition-all duration-300 shadow-[0_8px_25px_rgba(15,23,42,0.05)] hover:-translate-y-0.5"
              >
                <a
                  href="#batches"
                  onClick={(e) => handleSmoothScroll(e, "batches")}
                  className="flex items-center justify-center"
                >
                  <PlayCircle className="mr-2.5 w-5 h-5 text-blue-600" />

                  <span>
                    Explore Batches
                  </span>
                </a>
              </Button>

            </div>


            {/* Small trust line */}

            <div className="mt-7 flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-slate-400">
              <div className="h-px w-8 bg-slate-200" />
              <span>
                Trusted by students &amp; parents
              </span>
              <div className="h-px w-8 bg-slate-200" />
            </div>

          </motion.div>


          {/* ================================================= */}
          {/* RIGHT IMAGE */}
          {/* ================================================= */}

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
            }}
            className="lg:col-span-5 relative"
          >

            {/* Decorative elements */}

            <div className="absolute -top-5 -right-5 w-24 h-24 rounded-3xl border border-blue-200/60 bg-blue-50/50 -z-10" />

            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-indigo-100/60 blur-sm -z-10" />


            {/* Image Card */}

            <div className="relative mx-auto max-w-md lg:max-w-[500px]">

              <div className="relative rounded-[34px] p-1.5 bg-white shadow-[0_25px_65px_rgba(15,23,42,0.12)]">

                <div className="relative overflow-hidden rounded-[28px]">

                  <img
                    src={
                      (heroData?.image_url || "/hero.webp") +
                      "?width=1200&quality=70"
                    }
                    alt="Coaching Classroom"
                    loading="eager"
                    className="w-full h-[370px] sm:h-[400px] lg:h-[420px] object-cover transition-transform duration-700 hover:scale-[1.025]"
                  />

                  {/* Image Overlay */}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-white/5" />


                  {/* Image bottom glass badge */}

                  <div className="absolute bottom-5 left-5 right-5">

                    <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.15)]">

                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>

                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Excellence in Education
                        </p>

                        <p className="text-sm font-extrabold text-slate-900">
                          Learn. Grow. Achieve.
                        </p>
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </motion.div>

        </div>


        {/* ===================================================== */}
        {/* STATS SECTION */}
        {/* ===================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            delay: 0.3,
          }}
          className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4"
        >

          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="group relative flex items-center gap-4 p-5 rounded-[22px] bg-white/95 backdrop-blur-sm border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >

                {/* Hover glow */}

                <div className="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-blue-500/[0.04] blur-2xl group-hover:bg-blue-500/[0.08] transition-all duration-300" />


                {/* Icon */}

                <div className="relative w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">

                  <Icon
                    className="w-6 h-6"
                    strokeWidth={2}
                  />

                </div>


                {/* Stat Content */}

                <div className="relative">

                  <h3 className="text-2xl sm:text-[1.7rem] font-black text-slate-950 tracking-tight leading-none">
                    {stat.value}
                  </h3>

                  <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400 mt-1.5">
                    {stat.label}
                  </p>

                </div>

              </div>
            );
          })}

        </motion.div>

      </div>

    </section>
  );
}