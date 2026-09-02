import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  GraduationCap,
  ArrowRight,
  BookOpen,
  Award,
  Target,
  Brain,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Icon } from "@iconify/react";

type CourseType = {
  id: number;
  name: string;
  description: string;
  highlights: string[];
  icon: any;
  accentColor: string;
};

const courses: CourseType[] = [
  {
    id: 1,
    name: "JEE & NEET Foundation",
    description:
      "Build strong fundamentals with concept-focused learning, regular practice, and expert guidance.",
    highlights: ["CBSE", "ICSE", "MP Board"],
    icon: "fluent-emoji-flat:books",
    accentColor: "from-blue-600 via-indigo-500 to-blue-400",
  },
  {
    id: 2,
    name: "Class 6–8 Foundation",
    description:
      "Strengthen core concepts and develop the problem-solving skills required for competitive preparation.",
    highlights: ["CBSE", "ICSE", "MP Board"],
    icon: "fluent-emoji-flat:open-book",
    accentColor: "from-blue-500 to-cyan-400",
  },
  {
    id: 3,
    name: "Class 10-12 Board Prep",
    description:
      "A structured learning program designed to improve concepts, accuracy, speed, and confidence.",
    highlights: ["CBSE", "ICSE", "MP Board"],
  icon: "fluent-emoji-flat:bullseye",
    accentColor: "from-indigo-600 to-blue-500",
  },
  {
    id: 4,
    name: "UPSC,MPPSC",
    description:
      "Advanced foundation preparation with focused practice and systematic academic guidance.",
    highlights: ["CBSE", "ICSE", "MP Board"],
    icon: "fluent-emoji-flat:graduation-cap",
    accentColor: "from-blue-600 to-indigo-600",
  },
  {
    id: 5,
    name: "Navodaya Preparation",
    description:
      "Focused preparation with structured learning, regular assessments, and targeted practice.",
    highlights: ["Special Batch", "Mock Tests", "Personal Guidance"],
    icon: "fluent-emoji-flat:brain",
    accentColor: "from-sky-500 to-blue-600",
  },
  {
    id: 6,
    name: "Competitive Exams",
    description:
      "Develop strong academic fundamentals and problem-solving abilities for future competitive exams.",
    highlights: ["JEE/NEET Prep", "Olympiad", "NTSE"],
    icon: "fluent-emoji-flat:rocket",
    accentColor: "from-indigo-500 to-purple-600",
  },
];

export default function BatchCards() {
  const [showAll, setShowAll] = useState(false);

  const displayedCourses = showAll ? courses : courses.slice(0, 6);

  return (
    <section
      id="batches"
      className="relative py-24 md:py-28 bg-[#f8faff] overflow-hidden"
    >
      {/* ================= BACKGROUND ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-10 w-80 h-80 bg-blue-500/[0.05] rounded-full blur-3xl" />

        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-500/[0.045] rounded-full blur-3xl" />

        <div className="absolute bottom-0 left-1/3 w-96 h-80 bg-blue-400/[0.035] rounded-full blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      {/* ================= CONTENT ================= */}
      <div className="container mx-auto px-4 relative z-10">

        {/* ================= SECTION HEADER ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 md:mb-16"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-600 border border-blue-100 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-5 shadow-[0_8px_25px_rgba(37,99,235,0.07)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admissions Open</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight">
            Our <span className="text-blue-600">Courses</span>
          </h2>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            From foundational concepts to competitive exam preparation — the
            right course for every board and every class.
          </p>
        </motion.div>

        {/* ================= COURSE GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          <AnimatePresence mode="popLayout">

            {displayedCourses.map((course, index) => {
              const IconComponent = course.icon;

              return (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -6 }}
                  className="group h-full"
                >

                  {/* ================= PREMIUM CARD ================= */}
                  <div
                    className="
                      relative h-full flex flex-col justify-between
                      rounded-[22px]
                      bg-white
                      border border-slate-200/70
                      shadow-[0_7px_26px_rgba(15,23,42,0.04)]
                      hover:shadow-[0_18px_40px_rgba(37,99,235,0.10)]
                      hover:border-blue-200/80
                      transition-all duration-300
                      overflow-hidden
                      p-5 sm:p-6
                    "
                  >

                    {/* ================= HOVER ACCENT LINE ================= */}
                    <div
                      className={`
                        absolute top-0 left-0
                        h-1
                        w-0
                        group-hover:w-full
                        bg-gradient-to-r ${course.accentColor}
                        transition-all duration-500 ease-out
                      `}
                    />

                    {/* Soft Hover Glow */}
                    <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-blue-500/[0.035] blur-3xl group-hover:bg-blue-500/[0.07] transition-all duration-500 pointer-events-none" />

                    <div className="relative">

                      {/* ================= CARD TOP ================= */}
                      <div className="flex items-start justify-between mb-5">

                        {/* Colourful Icon */}
                        <div
                          className={`
                            relative w-12 h-12 rounded-[15px]
                            bg-gradient-to-br ${course.accentColor}
                            flex items-center justify-center
                            text-white
                            shadow-[0_8px_20px_rgba(37,99,235,0.16)]
                            transition-all duration-300
                            group-hover:scale-105
                            group-hover:shadow-[0_10px_24px_rgba(37,99,235,0.20)]
                          `}
                        >
                          <div className="absolute inset-[1px] rounded-[14px] bg-white/10" />

                          <Icon icon={course.icon} className="w-8 h-8" />
                        </div>

                        {/* Course Number */}
                        <div
                          className="
                            flex items-center justify-center
                            w-8 h-8 rounded-lg
                            bg-slate-50
                            border border-slate-100
                            text-[9px] font-black
                            text-slate-400
                            group-hover:bg-slate-100
                            transition-all duration-300
                          "
                        >
                          {String(course.id).padStart(2, "0")}
                        </div>

                      </div>

                      {/* ================= COURSE TITLE ================= */}
                      <h3
                        className="
                          text-lg sm:text-[20px]
                          font-black
                          text-slate-950
                          tracking-tight
                          leading-snug
                          group-hover:text-blue-600
                          transition-colors duration-300
                        "
                      >
                        {course.name}
                      </h3>

                      {/* ================= DESCRIPTION ================= */}
                      <p className="mt-2.5 text-[13px] text-slate-500 leading-[1.65]">
                        {course.description}
                      </p>

                      {/* ================= HIGHLIGHTS ================= */}
                      <div className="mt-5">

                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 mb-2">
                          Program Highlights
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {course.highlights.map((tag) => (
                            <span
                              key={tag}
                              className="
                                inline-flex items-center
                                px-2.5 py-1
                                rounded-lg
                                text-[10px]
                                font-extrabold
                                bg-slate-50
                                text-slate-600
                                border border-slate-200/70
                                group-hover:bg-blue-50
                                group-hover:text-blue-600
                                group-hover:border-blue-100
                                transition-all duration-200
                              "
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                      </div>
                    </div>

                    {/* ================= CTA ================= */}
                    <div className="relative mt-6 pt-4 border-t border-slate-100">

                      <a
                        href="#contact"
                        className="
                          flex items-center justify-between
                          w-full
                          group/link
                        "
                      >

                        <span className="text-[13px] font-extrabold text-blue-700 group-hover/link:text-blue-600 transition-colors duration-200">
                          Enquire Now
                        </span>

                        <span
                          className="
                            flex items-center justify-center
                            w-8 h-8 rounded-lg
                            bg-blue-50
                            text-blue-600
                            border border-blue-100
                            group-hover/link:bg-blue-600
                            group-hover/link:text-white
                            group-hover/link:border-blue-600
                            transition-all duration-300
                          "
                        >
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
                        </span>

                      </a>

                    </div>

                  </div>
                </motion.div>
              );
            })}

          </AnimatePresence>
        </div>

        {/* ================= SHOW MORE BUTTON ================= */}
        {courses.length > 6 && (
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="
                h-11 rounded-xl px-6
                border-slate-200
                bg-white
                text-slate-700
                font-bold text-sm
                hover:border-blue-300
                hover:text-blue-600
                hover:bg-blue-50/50
                transition-all duration-200
                shadow-sm
              "
            >
              {showAll ? (
                <>
                  Show Less
                  <ChevronUp className="ml-2 w-4 h-4" />
                </>
              ) : (
                <>
                  Show More
                  <ChevronDown className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}

      </div>
    </section>
  );
}