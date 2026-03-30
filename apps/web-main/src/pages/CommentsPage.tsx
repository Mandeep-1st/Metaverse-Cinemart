import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ThumbsUp, Clock, Star } from "lucide-react";

// 1. MOCK DATA: Replace this with your actual API fetch later
const initialComments = [
  {
    id: 1,
    user: "Nova_Watcher",
    avatar: "NW",
    content: "Absolutely mind-blowing visually. The practical effects during the docking scene were pinnacle cinema. Zimmer's score carries the emotional weight of the entire third act.",
    likes: 342,
    time: "2 hours ago",
    rating: 5,
  },
  {
    id: 2,
    user: "DirectorCut",
    avatar: "DC",
    content: "Pacing was a bit slow in the second act, but the payoff is undeniably brilliant. Needs multiple viewings to fully grasp the temporal mechanics.",
    likes: 89,
    time: "5 hours ago",
    rating: 4,
  }
];

const CommentsPage = () => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");

  // 2. DYNAMIC FUNCTION: Handles adding a new comment to the top of the feed
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentObj = {
      id: Date.now(),
      user: "Guest_User", // Replace with real logged-in user
      avatar: "GU",
      content: newComment,
      likes: 0,
      time: "Just now",
      rating: 5, // You could add a dynamic rating selector later!
    };

    setComments([commentObj, ...comments]);
    setNewComment("");
  };

  return (
    <section className="dark relative block w-full min-h-screen bg-background pt-24 pb-32 px-6 sm:px-12 overflow-hidden font-sans antialiased">
      
      {/* Background Cinematic Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none opacity-30" />

      <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col gap-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 sm:gap-4"
          >
            <div className="h-[2px] w-8 sm:w-12 bg-primary shadow-sm" />
            <span className="text-primary font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-[9px] sm:text-[10px]">
              Engine Core // Global Logs
            </span>
          </motion.div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-foreground tracking-tighter uppercase italic leading-[0.9]">
            Community <br />
            <span className="text-muted-foreground not-italic opacity-40">Discussion.</span>
          </h2>
        </div>

        {/* INPUT SECTION */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handlePostComment}
          className="relative flex flex-col gap-4 p-1 rounded-[var(--radius)] bg-gradient-to-br from-border/20 to-transparent"
        >
          <div className="bg-card/50 backdrop-blur-xl rounded-[calc(var(--radius)-2px)] p-4 sm:p-6 border border-border/10 focus-within:border-primary/50 transition-colors shadow-xl">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Transmit your analysis..."
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[100px] text-sm sm:text-base leading-relaxed font-light"
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/10">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Public Log</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "var(--shadow-lg)" }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="bg-primary text-primary-foreground px-6 sm:px-8 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newComment.trim()}
              >
                Execute <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.button>
            </div>
          </div>
        </motion.form>

        {/* COMMENTS FEED */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-border/10 pb-4">
            <span className="text-foreground font-black text-lg sm:text-xl tracking-tight">ANALYSIS LOGS</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{comments.length}</span>
          </div>

          <AnimatePresence mode="popLayout">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                layout // Smoothly pushes old comments down when a new one is added
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="group relative flex gap-4 sm:gap-6 p-6 rounded-[var(--radius)] bg-card/5 border border-border/10 hover:border-border/30 transition-colors"
              >
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-xs sm:text-sm shadow-inner">
                    {comment.avatar}
                  </div>
                </div>

                {/* Comment Content */}
                <div className="flex flex-col flex-1 gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-bold text-sm sm:text-base tracking-tight">{comment.user}</span>
                      <div className="hidden sm:flex items-center gap-1 text-primary">
                        {/* Render stars based on rating */}
                        {[...Array(comment.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-primary" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                      <Clock className="w-3 h-3" /> {comment.time}
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-light mt-1 mb-3">
                    {comment.content}
                  </p>

                  {/* Interaction Bar */}
                  <div className="flex items-center gap-6 mt-auto">
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/btn">
                      <ThumbsUp className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                      <span className="text-[10px] sm:text-xs font-bold">{comment.likes}</span>
                    </button>
                    <button className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default CommentsPage;
