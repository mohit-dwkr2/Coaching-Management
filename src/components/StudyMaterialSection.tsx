import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  Download,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

// 1. Interface definition
interface StudyMaterialProps {
  courseId: string;
  notesAccess?: boolean;
  onTotalCount?: (count: number) => void;
  onSubjectCount?: (count: number) => void;
}

export default function StudyMaterialSection({
  courseId,
  notesAccess,
  onTotalCount,
  onSubjectCount,
}: StudyMaterialProps) {
  const { tenant } = useTenant();

  // UI selection states
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedVideoSubject, setSelectedVideoSubject] = useState("");

  // Pagination states
  const [pdfPage, setPdfPage] = useState(1);
  const [videoPage, setVideoPage] = useState(1);

  const itemsPerPagePdf = 5;
  const itemsPerPageVideo = 8;

  // React Query: fetch and cache materials/videos
  const { data: allContent, isLoading } = useQuery({
    queryKey: ["study-materials", tenant?.id, courseId],

    queryFn: async () => {
      if (!tenant?.id || !courseId) {
        return { materials: [], videos: [] };
      }

      // 1. PDF Materials
      const {
        data: matData,
        error: materialError,
      } = await supabase
        .from("Coaching-3_StudyMaterial")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (materialError) {
        throw materialError;
      }

      // 2. Video Lectures
      const {
        data: vidData,
        error: videoError,
      } = await supabase
        .from("Coaching-3_VideoLectures")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("course_id", courseId);

      if (videoError) {
        throw videoError;
      }

      return {
        materials: matData ?? [],
        videos: vidData ?? [],
      };
    },

    enabled: !!tenant?.id && !!courseId && notesAccess !== false,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const materials = allContent?.materials ?? [];
  const videos = allContent?.videos ?? [];

  // Reset selections and pagination when tenant/course changes
  useEffect(() => {
    setSelectedSubject("");
    setSelectedVideoSubject("");
    setPdfPage(1);
    setVideoPage(1);
  }, [tenant?.id, courseId]);

  // Notify parent about total materials and selected-subject count.
  // Keep these updates outside the React Query queryFn.
  useEffect(() => {
    onTotalCount?.(materials.length);
  }, [materials, onTotalCount]);

  useEffect(() => {
    if (materials.length > 0 && !selectedSubject) {
      setSelectedSubject(materials[0].subject ?? "");
    }
  }, [materials, selectedSubject]);

  useEffect(() => {
    const count = materials.filter(
      (material) => material.subject === selectedSubject
    ).length;

    onSubjectCount?.(count);
  }, [materials, selectedSubject, onSubjectCount]);

  // Video subject filtering
  const videoSubjects = [
    ...new Set(
      videos
        .map((video) => video.subject)
        .filter(
          (subject): subject is string => Boolean(subject)
        )
    ),
  ];

  const filteredVideos =
    selectedVideoSubject === ""
      ? videos
      : videos.filter(
          (video) => video.subject === selectedVideoSubject
        );

  const totalVideoPages = Math.ceil(
    filteredVideos.length / itemsPerPageVideo
  );

  const currentVideos = filteredVideos.slice(
    (videoPage - 1) * itemsPerPageVideo,
    videoPage * itemsPerPageVideo
  );

  // Locked access UI
  if (notesAccess === false) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="max-w-lg w-full bg-white border border-red-100 rounded-3xl p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
            <FileText className="text-red-500" size={30} />
          </div>

          <h2 className="text-2xl font-black text-slate-900">
            Study Material Locked
          </h2>

          <p className="text-slate-500 mt-3 leading-relaxed">
            Your study material access has been disabled by your coaching
            institute. Please contact the administration for more
            information.
          </p>
        </div>
      </div>
    );
  }

  const handleSubjectChange = (sub: string) => {
    setSelectedSubject(sub);
    setPdfPage(1);
  };

  const handleDownload = async (filePath: string) => {
    if (!tenant?.id || !filePath.startsWith(`${tenant.id}/`)) {
      toast.error("Invalid file path for this coaching");
      return;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      toast.error("Please login first");
      return;
    }

    const {
      data: urlData,
      error,
    } = await supabase.storage
      .from("coaching-3_private")
      .createSignedUrl(filePath, 300);

    if (error || !urlData?.signedUrl) {
      toast.error("Something went wrong, please try again.");
      return;
    }

    window.open(
      urlData.signedUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // PDF subject filtering
  const subjectsForCourse = [
    ...new Set(
      materials
        .map((material) => material.subject)
        .filter(
          (subject): subject is string => Boolean(subject)
        )
    ),
  ];

  const filteredMaterials = materials.filter(
    (material) => material.subject === selectedSubject
  );

  // PDF pagination
  const totalPdfPages = Math.ceil(
    filteredMaterials.length / itemsPerPagePdf
  );

  const currentPdfs = filteredMaterials.slice(
    (pdfPage - 1) * itemsPerPagePdf,
    pdfPage * itemsPerPagePdf
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  // Keep the rest of your existing component JSX below this point.

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

        <section id="material" className="relative  h-auto overflow-y-visible">
          <div className="container mx-auto px-4 md:pt-0">
            <div className="text-center mb-10 px-4">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                Study <span className="text-primary">Material</span>
              </h2>
            </div>

            <div className="max-w-4xl mx-auto px-4 pb-20">

              {/* Subject Selection - Sirf tab dikhega jab subjects honge */}
              {subjectsForCourse.length > 0 && (
                <div className="mb-12 text-center">
                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-4 tracking-widest">
                    Choose Subject
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {subjectsForCourse.map((s: string) => (
                      <button
                        key={s}
                        onClick={() => handleSubjectChange(s)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedSubject === s ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PDFs List */}
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {currentPdfs.length > 0 ? (
                    currentPdfs.map((m: any) => (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4 w-full">
                          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <FileText size={24} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-extrabold text-slate-800">{m.title}</p>
                            <p className="text-sm text-gray-600">
                              {m.subject}
                            </p>
                          </div>
                        </div>
                        <Button className="w-full md:w-auto" onClick={() => handleDownload(m.file_url)}>
                          <Download className="h-4 w-4 mr-2" /> Download
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500 font-medium">No study material available for your course yet.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>


              {/* PDF Pagination Controls */}
              {totalPdfPages > 1 && (
                <div className="mt-10 flex flex-wrap justify-center items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPdfPage(p => Math.max(1, p - 1))} disabled={pdfPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPdfPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPdfPage(i + 1)}
                      className={`h-9 w-9 rounded-lg text-sm font-bold transition-all ${pdfPage === i + 1 ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setPdfPage(p => Math.min(totalPdfPages, p + 1))} disabled={pdfPage === totalPdfPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* Video UI */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-6 max-w-7xl">
            <h2 className="text-3xl md:text-5xl font-black text-center mb-12">Video <span className="text-blue-700">Lectures</span> </h2>


            {/* Video Subject Tabs */}
            {videoSubjects.length > 0 && (
              <div className="mb-10 text-center">
                <p className="text-[10px] font-bold text-slate-600 uppercase mb-4 tracking-widest">
                  Choose Subject
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedVideoSubject("");
                      setVideoPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedVideoSubject === ""
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    All Subjects
                  </button>

                  {videoSubjects.map((subject: string) => (
                    <button
                      key={subject}
                      onClick={() => {
                        setSelectedVideoSubject(subject);
                        setVideoPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedVideoSubject === subject
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
            )}


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {currentVideos.length > 0 ? (
                currentVideos.map((vid) => (
                  <a key={vid.id}
                    href={`https://www.youtube.com/watch?v=${vid.youtube_id}`}
                    target="_blank"
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <img src={`https://img.youtube.com/vi/${vid.youtube_id}/0.jpg`} alt={vid.title} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <p className="font-bold text-slate-800 line-clamp-2">{vid.title}</p>
                    </div>
                  </a>
                ))
              ) : (
                /* Empty state: Isko col-span-full diya hai taaki ye poori width le sake bina layout bigade */
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-bold">No video lectures available for your course yet.</p>
                </div>
              )}
            </div>

            {/* Video Pagination Controls */}
            {totalVideoPages > 1 && (
              <div className="mt-12 flex flex-wrap justify-center items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setVideoPage(p => Math.max(1, p - 1))} disabled={videoPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalVideoPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setVideoPage(i + 1)}
                    className={`h-9 w-9 rounded-lg text-sm font-bold transition-all ${videoPage === i + 1 ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setVideoPage(p => Math.min(totalVideoPages, p + 1))} disabled={videoPage === totalVideoPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </section>

      </motion.div>
    </div>
  );
}