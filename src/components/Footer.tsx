import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, ArrowRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-200 pt-12 md:pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Main Grid: Mobile par 1 column, Tablet par 2, Desktop par 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12">
          
          {/* Column 1: Brand & About - Mobile par center align */}
          <div className="space-y-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 font-bold text-xl text-white">
              <div className="bg- p-1.5 rounded-lg">
                <img
            src="/logo.webp"
            alt="Logo"
            className="h-8 w-8 md:h-10 md:w-10 object-contain rounded-full border-2 border-black flex-shrink-0"
          />
              </div>
              Your Academy
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              Empowering students to achieve their academic goals through quality education and expert mentorship since 1985.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
              <a href="#" className="hover:text-primary transition-colors bg-slate-800 p-2.5 rounded-full"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors bg-slate-800 p-2.5 rounded-full"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary transition-colors bg-slate-800 p-2.5 rounded-full"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#batches" className="text-slate-400 hover:text-white flex items-center justify-center sm:justify-start gap-2 transition-all hover:translate-x-1"><ArrowRight className="h-3 w-3 text-primary" /> All Batches</a></li>
              <li><a href="#faculty" className="text-slate-400 hover:text-white flex items-center justify-center sm:justify-start gap-2 transition-all hover:translate-x-1"><ArrowRight className="h-3 w-3 text-primary" /> Meet Faculty</a></li>
              <li><a href="#toppers" className="text-slate-400 hover:text-white flex items-center justify-center sm:justify-start gap-2 transition-all hover:translate-x-1"><ArrowRight className="h-3 w-3 text-primary" /> Results & Toppers</a></li>
              <li><a href="#gallery" className="text-slate-400 hover:text-white flex items-center justify-center sm:justify-start gap-2 transition-all hover:translate-x-1"><ArrowRight className="h-3 w-3 text-primary" /> Campus Gallery</a></li>
            </ul>
          </div>

          {/* Column 3: Courses - Mobile par hidden ya stack (aapki marzi) */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-sm">Our Courses</h4>
            <ul className="space-y-3 text-sm">
              <li className="text-slate-400 hover:text-slate-200 transition-colors">Foundation (Class 5-12)</li>
              <li className="text-slate-400 hover:text-slate-200 transition-colors">Navodaya Entrance Exam</li>
              <li className="text-slate-400 hover:text-slate-200 transition-colors">Sainik School Entrance Exam</li>
              <li className="text-slate-400 hover:text-slate-200 transition-colors">Shramodaya School Exam</li>
              <li className="text-slate-400 hover:text-slate-200 transition-colors">Rastriya Military School Exam</li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-sm">Get In Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span className="text-slate-400">Rajghat colony (MP),<br className="hidden sm:block" />Datia - 474001</span>
              </li>
              <li className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:+919876543210" className="text-slate-400 hover:text-white">+91 9630955951</a>
              </li>
              <li className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:samarpratapshri98@gmail.com" className="text-slate-400 hover:text-white">diwakarmohit0007@gmail.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Mobile par stack, Desktop par space-between */}
        <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] md:text-sm text-sm" >
          <p className="text-white text-center md:text-left">
            © {currentYear} Your Academy. All rights reserved by Your academy  <br /><span className="text-xs md:text-xs py-2 text-gray-400"> Developed by {" "}
  <a
    href="https://wa.me/919630955951"
    target="_blank"
    rel="noopener noreferrer"
    className="underline hover:text-primary"
  >
    Mohit
  </a></span> 
           
          </p>
          <div className="flex gap-6 text-slate-500 underline-offset-4">
            <a href="#" className="hover:text-white transition-colors hover:underline">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors hover:underline">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}