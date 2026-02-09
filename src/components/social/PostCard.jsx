import React, { useState, useEffect, useMemo } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Flame, Trophy, Star, ShieldAlert, CheckCircle2, Trash2, Send, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../lib/firebase';
import { ref, update, remove, push, set, onValue, off, query as rtdbQuery, orderByChild, limitToLast } from 'firebase/database';
import { useAuth } from '../../context/AuthContext';
import { formatTimeAgo } from '../../utils/timeHelpers';

const PostCard = ({ post, theme, themeColors }) => {
    const { user } = useAuth();
    const isDark = theme === 'dark';

    // React logic
    const getSafeCount = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'object' && val !== null) return Object.keys(val).length;
        if (typeof val === 'string') return parseInt(val, 10) || 0;
        return 0;
    };

    const commentCount = typeof post.commentCount === 'number' ? post.commentCount : getSafeCount(post.comments);
    const likeCount = getSafeCount(post.likes);
    const celebrateCount = getSafeCount(post.celebrations);
    const supportCount = getSafeCount(post.supports);
    const interactionCount = likeCount + celebrateCount + supportCount;

    const [reacted, setReacted] = useState(null);
    const [counts, setCounts] = useState({
        like: likeCount,
        celebrate: celebrateCount,
        support: supportCount
    });

    useEffect(() => {
        if (!user) return;
        if (post.likedBy?.includes(user.uid)) setReacted('like');
        else if (post.celebratedBy?.includes(user.uid)) setReacted('celebrate');
        else if (post.supportedBy?.includes(user.uid)) setReacted('support');
    }, [post, user]);

    useEffect(() => {
        setCounts({
            like: getSafeCount(post.likes),
            celebrate: getSafeCount(post.celebrations),
            support: getSafeCount(post.supports)
        });
    }, [post.likes, post.celebrations, post.supports]);

    // Comment logic
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [sendingComment, setSendingComment] = useState(false);

    // Fetch top comments for inline display
    useEffect(() => {
        const commentsRef = ref(db, `posts/${post.id}/comments`);
        // If showing all comments, don't limit. If collapsed, we still fetch more to know the count but maybe limit to last 10 for performance if list is huge
        const q = rtdbQuery(commentsRef, orderByChild('createdAt'), limitToLast(20));

        const unsubscribe = onValue(q, (snapshot) => {
            if (snapshot.exists()) {
                const commentsData = snapshot.val();
                const fetchedComments = Object.keys(commentsData)
                    .map(key => {
                        try {
                            const data = commentsData[key];
                            const timeField = data.createdAt;
                            let timeAgo = 'Just now';

                            if (timeField) {
                                try {
                                    const date = typeof timeField === 'number'
                                        ? new Date(timeField)
                                        : new Date(timeField);
                                    timeAgo = formatTimeAgo(date);
                                } catch (e) {
                                    console.warn("Comment timeAgo format fail:", e);
                                }
                            }

                            return {
                                id: key,
                                ...data,
                                userName: data.userName || data.user?.name || 'Anonymous',
                                userAvatar: data.userAvatar || data.user?.avatar || null,
                                timeAgo: timeAgo
                            };
                        } catch (err) {
                            console.error("Error mapping comment:", key, err);
                            return { id: key, text: "Error loading comment", userName: "System", timeAgo: "Error" };
                        }
                    })
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setComments(fetchedComments);
            } else {
                setComments([]);
            }
        });

        return () => off(q);
    }, [post.id]);

    const handleReact = async (type) => {
        if (!user) return;
        const postRef = ref(db, `posts/${post.id}`);
        const oldReacted = reacted;

        // Optimistic UI update
        const newCounts = { ...counts };
        if (oldReacted === type) {
            newCounts[type] = Math.max(0, newCounts[type] - 1);
            setReacted(null);
            setCounts(newCounts);
            try {
                const rawLikedBy = post[`${type}dBy`];
                const currentLikedBy = Array.isArray(rawLikedBy) ? rawLikedBy : Object.values(rawLikedBy || {});
                const updatedLikedBy = currentLikedBy.filter(uid => uid !== user.uid);
                await update(postRef, {
                    [`${type}s`]: Math.max(0, getSafeCount(post[`${type}s`]) - 1),
                    [`${type}dBy`]: updatedLikedBy
                });
            } catch (error) {
                console.error("Error removing reaction:", error);
                alert(`Error: ${error.message}`);
                setReacted(oldReacted);
                setCounts(counts);
            }
        } else {
            if (oldReacted) {
                newCounts[oldReacted] = Math.max(0, newCounts[oldReacted] - 1);
            }
            newCounts[type] = newCounts[type] + 1;
            setReacted(type);
            setCounts(newCounts);
            try {
                const rawLikedBy = post[`${type}dBy`];
                const currentLikedBy = Array.isArray(rawLikedBy) ? rawLikedBy : Object.values(rawLikedBy || {});
                const updatedLikedBy = [...currentLikedBy, user.uid];
                const updates = {
                    [`${type}s`]: getSafeCount(post[`${type}s`]) + 1,
                    [`${type}dBy`]: updatedLikedBy
                };
                if (oldReacted) {
                    const rawOldLikedBy = post[`${oldReacted}dBy`];
                    const oldLikedBy = Array.isArray(rawOldLikedBy) ? rawOldLikedBy : Object.values(rawOldLikedBy || {});
                    updates[`${oldReacted}s`] = Math.max(0, getSafeCount(post[`${oldReacted}s`]) - 1);
                    updates[`${oldReacted}dBy`] = oldLikedBy.filter(uid => uid !== user.uid);
                }
                await update(postRef, updates);
            } catch (error) {
                console.error("Error adding reaction:", error);
                alert(`Error: ${error.message}`);
                setReacted(oldReacted);
                setCounts(counts);
            }
        }

        if (window.Capacitor?.Plugins?.Haptics) {
            window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' });
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !user || sendingComment) return;
        setSendingComment(true);
        try {
            const commentData = {
                text: commentText.trim(),
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userAvatar: user.photoURL || null,
                createdAt: Date.now() // Use Date.now() for Realtime Database
            };
            const commentsRef = ref(db, `posts/${post.id}/comments`);
            const newCommentRef = push(commentsRef);
            await set(newCommentRef, commentData);

            // Update comment count atomically
            const postRef = ref(db, `posts/${post.id}`);
            await update(postRef, {
                commentCount: (typeof post.commentCount === 'number' ? post.commentCount : getSafeCount(post.comments)) + 1
            });
            setCommentText('');
        } catch (error) {
            console.error("Error adding comment:", error);
            alert(`Error adding comment: ${error.message}`);
        } finally {
            setSendingComment(false);
        }
    };

    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const subTextColor = isDark ? 'text-gray-400' : 'text-gray-500';
    const cardBg = isDark ? 'bg-gray-800/40 border-white/5 shadow-xl' : 'bg-white border-gray-100 shadow-xl';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${cardBg} backdrop-blur-3xl rounded-[2.5rem] border p-5 mb-4 overflow-hidden relative flex flex-col min-h-[300px]`}
        >
            {/* NEW TOP ACTION BAR: Avatar left, Streak center */}
            <div className="flex items-center justify-between mb-6">
                {/* User Avatar - Left Aligned */}
                <div className="flex items-center gap-3 w-1/3">
                    <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-[1.2rem] bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
                            <div className={`w-full h-full rounded-[1.1rem] ${isDark ? 'bg-gray-900' : 'bg-white'} overflow-hidden flex items-center justify-center relative`}>
                                {(post.userAvatar || post.user?.avatar) ? (
                                    <img src={post.userAvatar || post.user.avatar} className="w-full h-full object-cover" alt={post.username || post.user?.name || 'Explorer'} />
                                ) : (
                                    <img
                                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${post.userId || post.user?.uid || 'default'}&backgroundColor=transparent`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover p-0.5"
                                    />
                                )}
                            </div>
                        </div>
                        {post.user.isPremium && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                <Star className="w-2.5 h-2.5 text-white fill-current" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className={`font-black text-sm truncate ${textColor}`}>{post.username || post.user?.name || 'Explorer'}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${subTextColor}`}>{typeof post.timeAgo === 'string' ? post.timeAgo : formatTimeAgo(new Date(post.timestamp))}</span>
                    </div>
                </div>

                {/* STREAK FLAME - Centered */}
                <div className="flex-1 flex justify-center">
                    {post.streak > 0 ? (
                        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border ${isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-100'} shadow-sm`}>
                            <Flame className="w-3.5 h-3.5 text-orange-500 fill-current" />
                            <span className="text-[11px] font-black text-orange-600 tracking-tighter">{post.streak} DAY STREAK</span>
                        </div>
                    ) : (
                        <div
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border"
                            style={{
                                backgroundColor: `${themeColors?.primary || '#3b82f6'}15`,
                                borderColor: `${themeColors?.primary || '#3b82f6'}40`,
                                opacity: 0.4,
                            }}
                        >
                            <Trophy
                                className="w-3.5 h-3.5"
                                style={{ color: themeColors?.primary || '#3b82f6' }}
                            />
                            <span
                                className="text-[10px] font-black tracking-tighter uppercase"
                                style={{ color: themeColors?.primary || '#3b82f6' }}
                            >
                                Building
                            </span>
                        </div>
                    )}
                </div>

                {/* MENU / DELETE - Right aligned */}
                <div className="w-1/3 flex justify-end">
                    {user?.uid === post.userId && (
                        <button
                            onClick={async () => {
                                if (window.confirm("Delete this post?")) {
                                    try {
                                        const postRef = ref(db, `posts/${post.id}`);
                                        await remove(postRef);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                            }}
                            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-red-500/10 text-red-500/50' : 'hover:bg-red-50 text-red-500/50'}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENT AREA - Standardized spacing */}
            <div className="flex-1 space-y-4 mb-6">
                {post.type === 'milestone' ? (
                    <div className={`p-4 rounded-3xl border ${isDark ? 'bg-purple-900/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className={`font-black text-base leading-tight ${textColor}`}>{post.text}</h3>
                                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Milestone reached</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-1">
                        <p className={`text-base font-bold leading-relaxed tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {post.content || post.text || "Shared a habit update!"}
                        </p>
                    </div>
                )}

                {post.imageUrl && (
                    <div className="rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative">
                        <img
                            src={post.imageUrl}
                            alt="Post content"
                            className="w-full aspect-[4/3] object-cover"
                        />
                    </div>
                )}
            </div>

            {/* INLINE ENGAGEMENT: Show top comments or simplified reactions */}
            <div className={`mb-6 space-y-2`}>
                {comments.length > 0 && (
                    <div className={`space-y-1.5`}>
                        {comments.slice(0, showComments ? comments.length : 2).map(c => {
                            if (!c || !c.userName) return null;
                            const displayName = typeof c.userName === 'string' ? c.userName.split(' ')[0] : 'User';

                            return (
                                <div key={c.id} className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="shrink-0 w-6 h-6 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        {c.userAvatar ? (
                                            <img src={c.userAvatar} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <img
                                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.userId || 'default'}&backgroundColor=transparent`}
                                                alt="Avatar"
                                                className="w-full h-full object-cover p-0.5"
                                            />
                                        )}
                                    </div>
                                    <div className={`flex-1 rounded-2xl py-2 px-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                        <p className="text-[11px] leading-tight">
                                            <span className={`font-black mr-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayName}</span>
                                            <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} font-medium`}>{c.text}</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {comments.length > 2 && !showComments && (
                            <button
                                onClick={() => setShowComments(true)}
                                className="text-[10px] font-bold uppercase tracking-widest ml-8"
                                style={{ color: themeColors?.primary || '#3b82f6' }}
                            >
                                View all {comments.length} comments
                            </button>
                        )}
                    </div>
                )}

                {/* Activity Summary Line */}
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                        {[1, 2, 3].slice(0, Math.min(3, likeCount || 1)).map(i => (
                            <div key={i} className={`w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${i === 1 ? 'bg-pink-500' : (i === 2 ? 'bg-blue-500' : 'bg-amber-500')} flex items-center justify-center text-[6px] text-white font-bold`}>
                                {i === 1 ? '❤️' : (i === 2 ? '🔥' : '✨')}
                            </div>
                        ))}
                    </div>
                    <span className={`text-[10px] font-bold ${subTextColor}`}>
                        {interactionCount} interactions • {commentCount} comments
                    </span>
                </div>
            </div>

            {/* FOOTER ACTIONS - Fixed bottom */}
            <div className={`pt-4 border-t flex items-center justify-between ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                <div className="flex items-center gap-1.5">
                    <ReactionItem
                        icon={<Heart className={`w-4 h-4 ${reacted === 'like' ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`} />}
                        count={counts.like}
                        active={reacted === 'like'}
                        onClick={() => handleReact('like')}
                        isDark={isDark}
                    />
                    <ReactionItem
                        icon={<MessageCircle className="w-4 h-4" style={{ color: showComments ? (themeColors?.primary || '#3b82f6') : '#9ca3af' }} />}
                        count={commentCount}
                        active={showComments}
                        onClick={() => setShowComments(!showComments)}
                        isDark={isDark}
                    />
                    <ReactionItem
                        icon={<Share2 className="w-4 h-4 text-gray-400" />}
                        onClick={() => { }} // Share logic
                        isDark={isDark}
                    />
                </div>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                >
                    Reply <ChevronRight className="w-3 h-3" />
                </button>
            </div>

            {/* Collapsible Comment Input Area */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a comment..."
                                    className={`flex-1 py-3 px-4 rounded-[1.25rem] text-xs font-bold border-none ${isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'}`}
                                    style={{
                                        focusRingColor: `${themeColors?.primary || '#3b82f6'}40`,
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.outline = 'none';
                                        e.target.style.boxShadow = `0 0 0 2px ${(themeColors?.primary || '#3b82f6')}40`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!commentText.trim() || sendingComment}
                                    className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all text-white"
                                    style={{
                                        backgroundColor: commentText.trim() ? (themeColors?.primary || '#3b82f6') : '#80808040',
                                        color: commentText.trim() ? 'white' : '#9ca3af',
                                        boxShadow: commentText.trim() ? `0 10px 15px -3px ${(themeColors?.primary || '#3b82f6')}40` : 'none',
                                    }}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
};

const ReactionItem = ({ icon, count, active, onClick, isDark, themeColors }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-90"
        style={{
            backgroundColor: active ? (isDark ? 'rgba(255,255,255,0.1)' : `${themeColors?.primary || '#3b82f6'}15`) : 'transparent',
        }}
    >
        <motion.div animate={active ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
            {icon}
        </motion.div>
        {count > 0 && (
            <span
                className="text-[11px] font-black"
                style={{
                    color: active ? (isDark ? 'white' : (themeColors?.primary || '#3b82f6')) : '#9ca3af',
                }}
            >
                {count}
            </span>
        )}
    </button>
);

export default PostCard;
