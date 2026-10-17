import React from 'react';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import FacultySection from '@/components/FacultySection';

const About = () => {
  // Static content in English
  const content = {
    heroTag: "About Toppers Academy",

    heroTitle: "Empowering Students For,",
    heroSpan: "Competetive Exams",

    heroDesc: "Harikamlansh Academy is more than a coaching institute. It's a platform where concepts meet clarity and dreams transform into reality through disciplined guidance.",

    journeyTitle: "Our Journey",
    journeyP1: "Founded in 1985, Harikamlansh Academy (formerly known as Navodaya Entrance Exam Coaching) has built a 40-year legacy of excellence in competitive school admissions. Our mission goes beyond just clearing exams; we focus on concept-based learning and self-study mastery to make students bold and proficient in Math, Reasoning, and Language.",
    journeyP2: "Achieving an incredible milestone where 20 out of 80 district selections came from our institute alone, out of 5,000 total applicants. Today, we bring this unmatched expertise and proven success ratio to students across India through our specialized Online Mode, providing expert guidance for Navodaya, Sainik School, Shramodaya, and Rashtriya Military School entrance exams to help every aspirant secure their dream seat.",

    stats: [
      { label: "Students Trained", value: "4,000+" },
      { label: "Success Rate", value: "100%" },
      { label: "Expert Faculty", value: "3+" },
      { label: "Years Excellence", value: "40+" },
    ],

    directorName: "Mohit",
    directorTitle: "Founder & Managing Director",
    directorMsg: "Message From Director",
    directorQuote: '"At Toppers Academy, we don\'t just prepare you for exams; we prepare you for life. We focus on building a foundation so strong that no competition feels too difficult."',

    coursesTitle: "Our Offered Courses",
    courseList: [
      "Navodaya Entrance Exam",
      "Sainik School Entrance Exam",
      "Shramodaya School Entrance Exam",
      "Rashtriya Military School Entrance"
    ]
  };

  return (
    <>
      <div className="min-h-screen bg-white mt-32 pb-0 overflow-x-hidden">
        {/* 1. Hero Section */}
        <section className="container mx-auto px-4 mb-24 relative text-center max-w-4xl">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-white uppercase bg-blue-600 rounded-full">
            {content.heroTag}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-[1.2]">
            {content.heroTitle} <br />
            <span className="text-blue-600 md:text-5xl">
              {content.heroSpan}
            </span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">{content.heroDesc}</p>
        </section>

        {/* 2. Journey Section */}
        <section className="py-24 bg-blue-50 overflow-hidden mb-14 text-center">
          <div className="container mx-auto px-6 max-w-7xl">
            <h2 className="text-4xl md:text-4xl font-black text-gray-900">{content.journeyTitle}</h2>
            <div className="h-2 w-32 bg-blue-600 mx-auto mt-6 rounded-full mb-16"></div>
            <div className="flex flex-col items-center justify-center gap-12">
              <div className="w-full md:w-4/5 space-y-8 text-center mx-auto">
                <div className="space-y-6 text-gray-700 text-lg md:text-xl font-medium">
                  <p>{content.journeyP1}</p>
                  <p>{content.journeyP2}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Stats */}
        <section className="container mx-auto px-4 mb-24">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {content.stats.map((stat, i) => (
              <div key={i} className="p-6 md:p-8 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm text-center md:text-left">
                <h3 className="text-2xl md:text-4xl font-black text-slate-900">{stat.value}</h3>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Director Section */}
        <section className="container mx-auto px-4 mb-0 h-auto">
          <div className="bg-blue-950 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden max-w-7xl mx-auto text-white">
            <div className="grid md:grid-cols-5 gap-8 items-center relative z-10">
              <div className="md:col-span-2 mx-auto">
                <img src="/Director.webp" alt="Director" className="w-full max-w-[300px] rounded-2xl shadow-xl aspect-[4/5] object-cover border-white" />
              </div>
              <div className="md:col-span-3 text-center md:text-left">
                <div className="border-l-4 border-white pl-6 mb-8 hidden md:block">
                  <h4 className="text-4xl font-extrabold">{content.directorName}</h4>
                  <p className="text-white font-bold tracking-widest uppercase text-xs mt-2">{content.directorTitle}</p>
                </div>
                <div className="md:hidden mb-6">
                  <h4 className="text-2xl font-extrabold">{content.directorName}</h4>
                  <p className="text-white font-bold uppercase text-[10px]">{content.directorTitle}</p>
                </div>
                <h2 className="text-xl md:text-2xl font-black mb-2 text-white">{content.directorMsg}</h2>
                <p className="text-base md:text-xl text-slate-300 italic leading-relaxed">{content.directorQuote}</p>
              </div>
            </div>
          </div>
        </section>


        <FacultySection />


        {/* 5. Courses Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900">
                {content.coursesTitle.split(' ')[0]} <span className='text-blue-600'>{content.coursesTitle.split(' ').slice(1).join(' ')}</span>
              </h2>
              <hr className="mt-4 border-t-2 border-blue-400 opacity-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.courseList.map((course, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-lg font-bold text-slate-700">{course}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />
        <Footer />
      </div>
    </>
  );
};

export default About;