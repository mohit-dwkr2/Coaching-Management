import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

const links = [
  { label: "Home", href: "/" },
  { label: "Batches", href: "/#batches" },
  { label: "Faculty", href: "/#faculty" },
  { label: "Results", href: "/#results" },
  { label: "Gallery", href: "/#gallery" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);

  const isSolid = isScrolled || location.pathname !== "/";

  useEffect(() => {
    const handleScrollBg = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScrollBg);

    return () =>
      window.removeEventListener("scroll", handleScrollBg);
  }, []);

  useEffect(() => {
    if (location.pathname === "/") {
      setActive("#home");
    } else {
      setActive("");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/") return;

    const handleScroll = () => {
      const sections = [
        "home",
        "batches",
        "faculty",
        "results",
        "gallery",
        "contact",
      ];

      for (let id of sections) {
        const el = document.getElementById(id);

        if (el) {
          const rect = el.getBoundingClientRect();

          if (rect.top <= 120 && rect.bottom >= 120) {
            setActive(`#${id}`);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  return (
    <nav
      className="
        fixed top-0 left-0 right-0 z-50
        bg-white/95
        backdrop-blur-lg
        border-b border-slate-200
        shadow-sm
        py-3
        transition-all duration-300
      "
    >
      <div className="w-full pl-4 md:pl-8 pr-0 flex items-center justify-between h-12">

        {/* Logo */}
        <Link
          to="/"
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });

            setActive("#home");
          }}
          className="flex items-center gap-2 font-bold text-blue-600 transition-colors"
        >
          <img
            src="/logo.webp"
            alt="Logo"
            className="h-8 w-8 md:h-10 md:w-10 object-contain rounded-full border-2 border-black flex-shrink-0"
          />

          <span className="text-lg md:text-2xl leading-tight">
            Toppers Academy
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-2 mr-6">

          {links.map((l) => {
            const isActive =
              l.href === "/"
                ? active === "#home" && location.pathname === "/"
                : l.href.startsWith("/#")
                  ? active === l.href.replace("/", "")
                  : location.pathname === l.href;

            return (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => {
                  if (l.href === "/") {
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }
                }}
                className={`
                  px-4 py-2 text-sm font-bold
                  transition-all rounded-full
                  ${isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-600 hover:text-blue-700 hover:bg-slate-50"
                  }
                `}
              >
                {l.label}
              </Link>
            );
          })}


          <Link
            to="/about"
            className="
              px-4 py-2 text-sm font-bold
              text-slate-600
              hover:text-blue-700
              transition-all
            "
          >
            About Us
          </Link>


          <Link
            to="/userlogin"
            className="
    inline-flex items-center justify-center
    h-11
    rounded-full
    border border-blue-200
    bg-white
    px-5
    text-sm font-bold
    text-blue-700
    shadow-sm
    transition-all duration-200
    hover:border-blue-300
    hover:bg-blue-50
    hover:shadow-md
    active:scale-[0.98]
  "
          >
            Student Login
          </Link>

          <Button
            size="lg"
            className="
    ml-2
    h-11
    rounded-full
    bg-blue-600
    px-6
    text-sm font-bold
    text-white
    shadow-md shadow-blue-600/20
    transition-all duration-200
    hover:bg-blue-700
    hover:shadow-lg
    hover:shadow-blue-600/25
    hover:scale-[1.02]
    active:scale-[0.98]
  "
            asChild
          >
            <a href="/#contact">
              Join Now
            </a>
          </Button>

        </div>


        {/* Mobile Toggle */}
        <button
          className="
            lg:hidden
            p-2
            rounded-md
            text-slate-700
            hover:text-blue-600
            transition-colors
          "
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X className="h-7 w-7" />
          ) : (
            <Menu className="h-7 w-7" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div
          className="
            lg:hidden
            bg-white
            border-b border-slate-200
            px-4
            pb-6
            pt-2
            animate-in
            slide-in-from-top
            duration-300
            overflow-y-auto
            max-h-[80vh]
          "
        >
          {links.map((l) => {
            const isActive =
              l.href === "/"
                ? active === "#home" && location.pathname === "/"
                : l.href.startsWith("/#")
                  ? active === l.href.replace("/", "")
                  : location.pathname === l.href;

            return (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => {
                  setOpen(false);

                  if (l.href === "/") {
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }
                }}
                className={`
                  block
                  py-3
                  text-base
                  font-semibold
                  border-b
                  border-slate-200/70
                  last:border-none
                  ${isActive
                    ? "text-blue-600"
                    : "text-slate-700"
                  }
                `}
              >
                {l.label}
              </Link>
            );
          })}


          <Link
            to="/about"
            onClick={() => setOpen(false)}
            className="
              block
              py-3
              text-base
              font-semibold
              border-b
              border-slate-200/70
              text-slate-700
            "
          >
            About Us
          </Link>

          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="
    flex items-center justify-center
    w-full
    h-11
    rounded-full
    border border-blue-200
    bg-white
    px-5
    text-sm font-bold
    text-blue-700
    shadow-sm
    transition-all duration-200
    hover:border-blue-300
    hover:bg-blue-50
    hover:shadow-md
    active:scale-[0.98]
  "
          >
            Student Login
          </Link>

          <Button
            size="lg"
            className="
              mt-6
              w-full
              rounded-xl
              bg-blue-600
              hover:bg-blue-700
            "
            asChild
          >
            <a
              href="/#contact"
              onClick={() => setOpen(false)}
            >
              Join Now
            </a>
          </Button>
        </div>
      )}
    </nav>
  );
}