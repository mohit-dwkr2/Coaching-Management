import { useState, useEffect } from "react";
import { Mail, Phone, Calendar, MessageSquare, Trash2, User, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";

export default function InquiryInbox() {
  const [inquiries, setInquiriesState] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Coaching-3_Contactform")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInquiriesState(data || []);
    } catch (error: any) {
      toast.error("Error fetching inquiries: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleDelete = async (id: string | number) => {
    try {
      const { error } = await supabase
        .from("Coaching-3_Contactform")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setInquiriesState(inquiries.filter((q) => q.id !== id));
      toast.error("Inquiry deleted");
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-slate-500 text-sm">Loading inquiries...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-4 md:px-0">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Inquiries
          </h2>

          <p className="text-slate-500 text-xs md:text-sm mt-1">
            Manage and respond to potential student leads
          </p>
        </div>

        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-xs md:text-sm self-start sm:self-auto border border-primary/10">
          Total: {inquiries.length}
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-16 md:py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 px-6">
          <div className="bg-white h-14 w-14 md:h-16 md:w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <Mail className="h-6 w-6 md:h-8 md:w-8 text-slate-300" />
          </div>

          <h3 className="text-slate-800 font-bold text-lg">
            Your inbox is empty
          </h3>

          <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1 leading-relaxed">
            When students fill out the Admission form, their messages will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {inquiries.map((q) => (
            <Card
              key={q.id}
              className="
              group
              overflow-hidden
              rounded-2xl
              border border-slate-200/70
              bg-white
              shadow-sm
              transition-all duration-300
              hover:-translate-y-[1px]
              hover:shadow-lg hover:shadow-slate-200/50
            "
            >
              <CardContent className="p-0">
                <div className="flex flex-row min-h-full">

                  {/* Left Accent Strip */}
                  <div
                    className="
                    w-1
                    bg-primary/20
                    group-hover:bg-primary
                    group-hover:w-1.5
                    transition-all duration-200
                    shrink-0
                  "
                  />

                  <div className="p-3 sm:p-5 md:p-6 flex-1 min-w-0">

                    {/* Top Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

                      {/* Student Info */}
                      <div className="space-y-3 min-w-0">

                        {/* Name + Date */}
                        <div className="flex items-center gap-3">
                          <div
                            className="
                            h-11 w-11
                            shrink-0
                            rounded-xl
                            bg-blue-50
                            border border-blue-100
                            flex items-center justify-center
                            text-blue-600
                          "
                          >
                            <User className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>

                          <div className="min-w-0">
                            <h4
                              className="
                              font-bold
                              text-slate-900
                              text-base md:text-lg
                              leading-tight
                              truncate
                            "
                            >
                              {q.name}
                            </h4>

                            <span
                              className="
                              text-[10px]
                              font-semibold
                              text-slate-400
                              uppercase
                              tracking-widest
                              flex items-center gap-1.5
                              mt-1.5
                            "
                            >
                              <Calendar className="h-3 w-3" />
                              {new Date(q.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Email + Phone */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-2 text-xs md:text-sm font-medium">

                          {/* Email */}
                          <a
                            href={`mailto:${q.email}`}
                            className="
                            inline-flex
                            items-center
                            gap-2
                            min-w-0
                            max-w-full
                            text-slate-600
                            hover:text-primary
                            transition-colors
                            bg-slate-50
                            border border-slate-100
                            px-3
                            py-2
                            rounded-xl
                          "
                          >
                            <Mail className="h-3.5 w-3.5 text-primary shrink-0" />

                            <span className="truncate">
                              {q.email || "No Email"}
                            </span>
                          </a>

                          {/* Phone */}
                          <a
                            href={`tel:${q.phone}`}
                            className="
                            inline-flex
                            items-center
                            gap-2
                            w-fit
                            max-w-full
                            text-slate-600
                            hover:text-blue-600
                            transition-colors
                            bg-slate-50
                            border border-slate-100
                            px-3
                            py-2
                            rounded-xl
                          "
                          >
                            <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />

                            <span className="truncate">
                              {q.phone}
                            </span>
                          </a>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div
                        className="
    flex
    items-center
    gap-2
    w-full lg:w-auto
    justify-end
    pt-2 sm:pt-3 lg:pt-0
    border-t lg:border-none
    border-slate-100
  "
                      >
                        {/* WhatsApp */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="
                          h-10
                          rounded-xl
                          border-slate-200
                          bg-white
                          px-4
                          text-xs
                          font-semibold
                          text-slate-700
                          hover:bg-blue-50
                          hover:text-blue-700
                          hover:border-blue-200
                          transition-all
                          flex-1 sm:flex-none
                        "
                          onClick={() =>
                            window.open(
                              `https://wa.me/${q.phone.replace(/\D/g, "")}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          WhatsApp
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(q.id)}
                          className="
                          rounded-xl
                          h-10
                          w-10
                          text-slate-400
                          hover:text-red-500
                          hover:bg-red-50
                          shrink-0
                          transition-all
                        "
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Message Box */}
                    {q.message && (
                      <div
                        className="
                       mt-4 sm:mt-5
                        rounded-2xl
                        border border-slate-200/70
                        bg-slate-50/70
                        p-3 sm:p-4 md:p-5
                      "
                      >
                        {/* Message Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="
                            h-7 w-7
                            rounded-lg
                            bg-white
                            border border-slate-200
                            flex items-center justify-center
                          "
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                          </div>

                          <span
                            className="
                            text-[10px]
                            md:text-[11px]
                            font-bold
                            uppercase
                            tracking-widest
                            text-slate-400
                          "
                          >
                            Student Message
                          </span>
                        </div>

                        {/* Actual Message */}
                        <p
                          className="
                          text-slate-700
                          text-xs md:text-sm
                          leading-6
                          break-words
                        "
                        >
                          "{q.message}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
