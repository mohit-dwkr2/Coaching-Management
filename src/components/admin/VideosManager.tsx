import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/supabaseClient";
import { Trash2, Plus, Youtube, Loader2, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"
import { useTenant } from "@/contexts/TenantContext";

const VideosManager = () => {
  const { tenant, loading: tenantLoading } = useTenant();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Filter States
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [courses, setCourses] = useState<any[]>([]);

  const [newVideo, setNewVideo] = useState({
    title: "",
    youtube_id: "",
    subject: "",
    course_id: ""
  });


  const fetchCourses = async () => {
    if (!tenant?.id) return;

    const { data, error } = await supabase
      .from("Coaching-3_Courses")
      .select("id, course_name")
      .eq("tenant_id", tenant.id)
      .order("course_name");

    if (!error && data) {
      setCourses(data);
    } else if (error) {
      toast.error("Error fetching courses: " + error.message);
    }
  };

  const fetchVideos = async () => {
    if (!tenant?.id) return;

    try {
      setFetching(true);

      const { data, error } = await supabase
        .from('Coaching-3_VideoLectures')
        .select('*')
        .eq("tenant_id", tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVideos(data || []);
    } catch (err: any) {
      toast.error("Error fetching videos: " + err.message);
    } finally {
      setFetching(false);
    }
  };

useEffect(() => {
  if (tenantLoading) return;

  if (!tenant?.id) {
    setVideos([]);
    setCourses([]);
    setFilterCourse("all");
    setFilterSubject("all");
    setFetching(false);
    return;
  }

  setVideos([]);
  setCourses([]);

  // Reset filters when tenant changes
  setFilterCourse("all");
  setFilterSubject("all");

  setFetching(true);

  fetchVideos();
  fetchCourses();
}, [tenant?.id, tenantLoading]);


  const getCourseName = (courseId: string) => {
    return (
      courses.find((c) => c.id === courseId)?.course_name ||
      "Unknown Course"
    );
  };

  // --- Filtering Logic ---
  const availableCourses = useMemo(() => {
    return [...new Set(videos.map(v => v.course_id))];
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchCourse =
        filterCourse === "all" ||
        v.course_id === filterCourse;

      const matchSubject =
        filterSubject === "all" ||
        v.subject === filterSubject;

      return matchCourse && matchSubject;
    });
  }, [videos, filterCourse, filterSubject]);


  const handleAddVideo = async (e) => {
    e.preventDefault();

    if (!tenant?.id) {
      toast.error("Coaching not loaded");
      return;
    }

    if (
      !newVideo.title ||
      !newVideo.youtube_id ||
      !newVideo.subject ||
      !newVideo.course_id
    ) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('Coaching-3_VideoLectures')
        .insert([
          {
            ...newVideo,
            tenant_id: tenant.id
          }
        ]);

      if (error) throw error;

      toast.success("Video Added Successfully!");

      setNewVideo({
        title: "",
        youtube_id: "",
        subject: "",
        course_id: ""
      });

      await fetchVideos();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!tenant?.id) {
      toast.error("Coaching not loaded");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('Coaching-3_VideoLectures')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      setVideos(prev => prev.filter(v => v.id !== id));
      toast.success("Video deleted successfully!");
    } catch (err: any) {
      toast.error("Error deleting: " + err.message);
    }
  };

  const handleUrlChange = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : url;
    setNewVideo({ ...newVideo, youtube_id: id });
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 mt-5 md:mt-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
          <Youtube size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">Video Manager</h2>
          <p className="text-xs text-slate-500">Manage your Youtube lectures</p>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleAddVideo} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 items-end">

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">
            Course
          </label>
          <select
            value={newVideo.course_id}
            onChange={(e) =>
              setNewVideo({
                ...newVideo,
                course_id: e.target.value,
              })
            }
            className="w-full h-9 rounded-md border border-slate-200 px-3 bg-white text-sm"
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.course_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Subject</label>
          <Input placeholder="e.g. Physics" value={newVideo.subject} onChange={(e) => setNewVideo({ ...newVideo, subject: e.target.value })} className="bg-white h-9 text-sm" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Title</label>
          <Input placeholder="Video Title" value={newVideo.title} onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })} className="bg-white h-9 text-sm" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">YouTube Link/ID</label>
          <Input placeholder="Paste URL here" value={newVideo.youtube_id} onChange={(e) => handleUrlChange(e.target.value)} className="bg-white h-9 text-sm" />
        </div>





        <Button disabled={loading} className="bg-blue-600 hover:bg-blue-700 h-9 font-bold text-sm w-full">
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus size={16} className="mr-1" />} Add Video
        </Button>
      </form>

      {/* --- Filter UI Section --- */}
      <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Quick Filters
          </span>
        </div>

        <div className="flex flex-wrap gap-3">

          {/* Course Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setFilterCourse("all");
                setFilterSubject("all");
              }}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filterCourse === "all"
                ? "bg-white shadow-sm text-blue-600"
                : "text-slate-500"
                }`}
            >
              All Courses
            </button>

            {availableCourses.map((courseId) => (
              <button
                key={courseId}
                onClick={() => {
                  setFilterCourse(courseId);
                  setFilterSubject("all");
                }}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filterCourse === courseId
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-500"
                  }`}
              >
                {getCourseName(courseId)}
              </button>
            ))}
          </div>


          {/* Subject Filter Tabs */}
          {filterCourse !== "all" && (
            <div className="flex bg-blue-50 p-1 rounded-xl border border-blue-100 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilterSubject("all")}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filterSubject === "all"
                  ? "bg-blue-600 text-white"
                  : "text-blue-600"
                  }`}
              >
                All Subjects
              </button>

              {[
                ...new Set(
                  videos
                    .filter((v) => v.course_id === filterCourse)
                    .map((v) => v.subject)
                ),
              ].map((subject) => (
                <button
                  key={subject}
                  onClick={() => setFilterSubject(subject)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filterSubject === subject
                    ? "bg-blue-600 text-white"
                    : "text-blue-600"
                    }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* --- List Section --- */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Results ({filteredVideos.length})</h3>

        {fetching ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></div>
        ) : filteredVideos.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-sm italic">No videos found matching these filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredVideos.map((vid) => (
              <div key={vid.id} className="group bg-white border border-slate-200 p-3 md:p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all">

                {/* Thumbnail */}
                <div className="relative shrink-0 overflow-hidden rounded-xl border border-slate-100 aspect-video w-full md:w-40 bg-slate-100">
                  <img src={`https://img.youtube.com/vi/${vid.youtube_id}/mqdefault.jpg`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="thumbnail" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="p-2 bg-white/90 rounded-full text-red-600 shadow-lg"><Youtube size={16} /></div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-orange-100 text-orange-600 border-orange-200">
                      COURSE {getCourseName(vid.course_id)}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold uppercase tracking-wider">
                      {vid.subject}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm md:text-base leading-snug truncate group-hover:text-blue-600 transition-colors">
                    {vid.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    ID: {vid.youtube_id}
                    <a href={`https://youtube.com/watch?v=${vid.youtube_id}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-0.5 font-bold">
                      Open <ExternalLink size={10} />
                    </a>
                  </p>
                </div>

                {/* Action */}
                <div className="flex md:flex-col gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <button onClick={() => handleDelete(vid.id)} className="flex-1 md:flex-none p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2 md:gap-0">
                    <Trash2 size={18} />
                    <span className="md:hidden text-xs font-bold uppercase">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideosManager;