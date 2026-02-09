import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from './PostCard';
import { Users, Search, Flame, Trophy, LogIn, Filter, Sparkles, MessageSquare, Target, Image as ImageIcon, X, Camera, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../lib/firebase';
import { ref, push, set, onValue, off, query as rtdbQuery, orderByChild, equalTo, limitToLast, limitToFirst, get } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatTimeAgo } from '../../utils/timeHelpers';

const FeedView = ({ theme, themeColors, showCreatePostModal, setShowCreatePostModal }) => {
    const { user, loginWithGoogle, loginAnonymously } = useAuth();
    const [posts, setPosts] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all'); // all, milestones, friends, me (visual only)
    const [newPostText, setNewPostText] = useState('');
    const [postType, setPostType] = useState('text'); // text, reflection, goal
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);
    const imageInputRef = useRef(null);
    const observer = useRef();

    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-white' : 'text-gray-900';

    const [activeUsers, setActiveUsers] = useState([]);

    // Fetch Recently Active Users
    useEffect(() => {
        const usersRef = ref(db, 'users');
        const q = rtdbQuery(usersRef, orderByChild('lastSeen'), limitToLast(10));

        const unsubscribe = onValue(q, (snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const users = Object.keys(usersData)
                    .map(key => ({ id: key, ...usersData[key] }))
                    .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
                setActiveUsers(users);
            } else {
                setActiveUsers([]);
            }
        });

        return () => off(q);
    }, []);

    // Real-time Fetch with onValue
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const postsRef = ref(db, 'posts');
        let q;

        if (activeFilter === 'me') {
            q = rtdbQuery(
                postsRef,
                orderByChild('userId'),
                equalTo(user?.uid || ''),
                limitToLast(20)
            );
        } else if (activeFilter === 'milestones') {
            q = rtdbQuery(
                postsRef,
                orderByChild('type'),
                equalTo('milestone'),
                limitToLast(20)
            );
        } else {
            // GLOBAL FEED: Order by timestamp
            q = rtdbQuery(
                postsRef,
                orderByChild('timestamp'),
                limitToLast(20)
            );
        }

        const unsubscribe = onValue(q, (snapshot) => {
            setError(null);

            if (!snapshot.exists()) {
                if (activeFilter === 'all') {
                    console.warn("Global feed is empty.");
                }
                setPosts([]);
                setHasMore(false);
                setLoading(false);
                return;
            }

            const postsData = snapshot.val();
            const fetchedPosts = Object.keys(postsData)
                .map(key => {
                    try {
                        const data = postsData[key];
                        const timeField = data.timestamp || data.createdAt;
                        let timeAgo = 'Recently';

                        // Realtime DB stores timestamps as numbers (milliseconds)
                        if (timeField) {
                            try {
                                const date = typeof timeField === 'number'
                                    ? new Date(timeField)
                                    : new Date(timeField);
                                timeAgo = formatTimeAgo(date);
                            } catch (e) {
                                console.warn("Time format err", e);
                            }
                        }

                        return {
                            id: key,
                            ...data,
                            content: data.content || data.text || "Shared a update!",
                            username: data.username || data.user?.name || "Explorer",
                            timeAgo: timeAgo,
                            user: data.user || { name: data.username || 'Explorer', avatar: data.avatar || null }
                        };
                    } catch (err) {
                        console.error("Critical error mapping post:", key, err);
                        return { id: key, content: "Post error", username: "System", timeAgo: "!" };
                    }
                })
                .sort((a, b) => {
                    const timeA = a.timestamp || a.createdAt || 0;
                    const timeB = b.timestamp || b.createdAt || 0;
                    return timeB - timeA; // Descending order
                });

            setPosts(fetchedPosts);
            setHasMore(fetchedPosts.length >= 20);
            setLoading(false);
        }, (err) => {
            console.error("Realtime Database feed error:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => off(q);
    }, [activeFilter, user]);

    // Infinite Scroll Logic
    const loadMorePosts = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);

        const postsRef = ref(db, 'posts');
        let q;
        const currentCount = posts.length;
        const loadCount = currentCount + 15;

        if (activeFilter === 'milestones') {
            q = rtdbQuery(
                postsRef,
                orderByChild('type'),
                equalTo('milestone'),
                limitToLast(loadCount)
            );
        } else if (activeFilter === 'me') {
            q = rtdbQuery(
                postsRef,
                orderByChild('userId'),
                equalTo(user?.uid || ''),
                limitToLast(loadCount)
            );
        } else {
            q = rtdbQuery(
                postsRef,
                orderByChild('timestamp'),
                limitToLast(loadCount)
            );
        }

        try {
            const snapshot = await get(q);
            if (snapshot.exists()) {
                const postsData = snapshot.val();
                const newPosts = Object.keys(postsData)
                    .map(key => {
                        const data = postsData[key];
                        const timeField = data.timestamp || data.createdAt;
                        return {
                            id: key,
                            ...data,
                            timeAgo: timeField
                                ? formatTimeAgo(new Date(timeField))
                                : 'Recently'
                        };
                    })
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                setPosts(newPosts);
                setHasMore(newPosts.length >= loadCount);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more posts:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [posts.length, loadingMore, hasMore, activeFilter, user]);

    // Intersection Observer for Infinite Scroll
    const lastPostRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMorePosts();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, loadMorePosts]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePost = async () => {
        if (!user) {
            console.error("Cannot post: user not authenticated");
            setError("Please log in to create posts.");
            alert("Please log in to create posts.");
            return;
        }

        if (!newPostText.trim() && !imageFile) {
            console.warn("Cannot post: missing text and image");
            setError("Please add some text or an image to your post.");
            alert("Please add some text or an image to your post.");
            return;
        }

        setPosting(true);
        setError(null);
        setSuccessMessage(null);
        setDebugInfo(null);

        const debugLog = [];
        debugLog.push(`[${new Date().toISOString()}] Starting post creation`);
        debugLog.push(`User ID: ${user.uid}`);
        debugLog.push(`Has text: ${!!newPostText.trim()}`);
        debugLog.push(`Has image: ${!!imageFile}`);

        try {
            console.log("Starting post creation...", { userId: user.uid, hasText: !!newPostText.trim(), hasImage: !!imageFile });

            let imageUrl = null;

            if (imageFile) {
                debugLog.push("Uploading image to Firebase Storage...");
                console.log("Uploading image...");
                try {
                    const storageRef = sRef(storage, `posts/${user.uid}_${Date.now()}`);
                    await uploadBytes(storageRef, imageFile);
                    imageUrl = await getDownloadURL(storageRef);
                    debugLog.push(`Image uploaded successfully: ${imageUrl.substring(0, 50)}...`);
                    console.log("Image uploaded successfully:", imageUrl);
                } catch (storageError) {
                    debugLog.push(`Image upload failed: ${storageError.message}`);
                    throw new Error(`Image upload failed: ${storageError.message}`);
                }
            }

            const now = Date.now();
            const postData = {
                content: newPostText,
                text: newPostText, // fallback
                type: postType,
                userId: user.uid,
                username: user.displayName || 'Harshita Eka',
                user: {
                    name: user.displayName || 'Harshita Eka',
                    avatar: user.photoURL || null,
                    isPremium: user.isPremium || false
                },
                timestamp: now, // Use Date.now() for Realtime Database
                createdAt: now,
                imageUrl: imageUrl,
                streak: user.stats?.streak || 0,
                likes: 0,
                comments: 0
            };

            debugLog.push("Post data prepared");
            debugLog.push(`Content length: ${newPostText.length} chars`);
            console.log("Post data prepared:", { ...postData, content: postData.content.substring(0, 50) + '...' });
            console.log("Attempting to write to Realtime Database...");
            debugLog.push("Attempting to write to Realtime Database path 'posts'...");

            const postsRef = ref(db, 'posts');
            const newPostRef = push(postsRef);
            await set(newPostRef, postData);

            debugLog.push(`✅ Post created successfully! Post ID: ${newPostRef.key}`);
            console.log("Post created successfully! Post ID:", newPostRef.key);
            console.log("Post should appear in feed shortly via onValue listener");

            // Clear form
            setNewPostText('');
            setImageFile(null);
            setImagePreview(null);
            setPostType('text');

            // Show success message
            setSuccessMessage(`Post created successfully! (ID: ${newPostRef.key.substring(0, 8)}...)`);
            setDebugInfo(debugLog.join('\n'));

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
                setDebugInfo(null);
                if (setShowCreatePostModal) setShowCreatePostModal(false);
            }, 3000);

        } catch (error) {
            debugLog.push(`❌ ERROR: ${error.code || 'UNKNOWN'} - ${error.message}`);
            console.error("Error creating post:", error);
            console.error("Error details:", {
                code: error.code,
                message: error.message,
                stack: error.stack
            });

            let errorMessage = '';
            let detailedError = '';

            if (error.code === 'PERMISSION_DENIED' || error.code === 'permission-denied') {
                errorMessage = "Permission denied. Your Realtime Database security rules are blocking this write.";
                detailedError = `Realtime Database denied the write operation. Please check your Realtime Database security rules for the 'posts' path.\n\nError code: ${error.code}\nMessage: ${error.message}`;
            } else if (error.code === 'UNAVAILABLE' || error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                errorMessage = "Network error. Please check your internet connection.";
                detailedError = `Network connectivity issue.\n\nError code: ${error.code}\nMessage: ${error.message}`;
            } else {
                errorMessage = `Failed to create post: ${error.message || 'Unknown error'}`;
                detailedError = `Unexpected error occurred.\n\nError code: ${error.code || 'N/A'}\nMessage: ${error.message || 'Unknown'}\n\nStack trace:\n${error.stack || 'N/A'}`;
            }

            setError(errorMessage);
            setDebugInfo(debugLog.join('\n'));

            // Show detailed error in alert
            alert(`${errorMessage}\n\n${detailedError}`);
        } finally {
            setPosting(false);
        }
    };

    if (!user) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center p-8 text-center bg-transparent">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`w-24 h-24 rounded-[2rem] mb-8 flex items-center justify-center shadow-2xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}
                >
                    <Users className="w-12 h-12" />
                </motion.div>
                <h2 className={`text-4xl font-black mb-4 tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>Join the Ritual</h2>
                <p className={`mb-10 max-w-xs text-lg font-medium leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Build habits alongside thousands of others and transform your life together.
                </p>
                <button
                    onClick={loginWithGoogle}
                    className="w-full max-w-xs py-5 px-8 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-2xl shadow-blue-500/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <LogIn className="w-6 h-6" />
                    Connect with Google
                </button>
            </div>
        );
    }

    return (
        <div className="w-full pb-32">
            {/* Feed Sub-Header: Filters */}
            <div className={`px-6 py-4 flex items-center justify-between overflow-x-auto scrollbar-hide gap-4`}>
                <div className="flex items-center gap-2">
                    <FilterIconTab
                        active={activeFilter === 'all'}
                        icon={<Sparkles className="w-3.5 h-3.5" />}
                        label="Discovery"
                        onClick={() => setActiveFilter('all')}
                        isDark={isDark}
                    />
                    <FilterIconTab
                        active={activeFilter === 'milestones'}
                        icon={<Trophy className="w-3.5 h-3.5" />}
                        label="Milestones"
                        onClick={() => setActiveFilter('milestones')}
                        isDark={isDark}
                    />
                    <FilterIconTab
                        active={activeFilter === 'me'}
                        icon={<Users className="w-3.5 h-3.5" />}
                        label="My Rituals"
                        onClick={() => setActiveFilter('me')}
                        isDark={isDark}
                    />
                </div>
            </div>

            {/* Community Pulse (Active Users) */}
            <section className="px-6 mt-8 overflow-hidden">
                {activeUsers.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${textColor}`}>Active Explorers</p>
                            <span className="text-[9px] font-bold text-blue-500 flex items-center gap-1">Live <ChevronRight className="w-3 h-3" /></span>
                        </div>
                        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-1 -mx-2 px-2">
                            {activeUsers.map(u => (
                                <motion.div
                                    key={u.id}
                                    whileTap={{ scale: 0.9 }}
                                    className="flex flex-col items-center shrink-0 gap-2"
                                >
                                    <div className={`w-12 h-12 rounded-2xl p-0.5 ${u.id === user.uid ? 'bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20' : (isDark ? 'bg-white/10' : 'bg-gray-100')}`}>
                                        <div className={`w-full h-full rounded-[0.8rem] overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
                                            {u.avatar ? (
                                                <img src={u.avatar} className="w-full h-full object-cover" alt={u.name} />
                                            ) : (
                                                <span className="font-black text-xs text-blue-500">{u.name.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-bold truncate w-12 text-center ${textColor}`}>{u.id === user.uid ? 'You' : u.name.split(' ')[0]}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Create Post Modal */}
            <AnimatePresence>
                {showCreatePostModal && (
                    <div className="fixed inset-0 z-[100] flex items-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreatePostModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`w-full max-h-[90vh] overflow-y-auto rounded-t-[3rem] p-8 pb-12 shadow-2xl relative z-10 ${isDark ? 'bg-gray-900 border-t border-white/5' : 'bg-white'}`}
                        >
                            <div className="w-12 h-1.5 bg-gray-500/20 rounded-full mx-auto mb-8" />

                            <div className="flex items-center justify-between mb-8">
                                <h3 className={`text-2xl font-black tracking-tight ${textColor}`}>Create Post</h3>
                                <button
                                    onClick={() => setShowCreatePostModal(false)}
                                    className={`p-2 rounded-full ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-gray-800 shadow-inner' : 'bg-gray-50'} flex items-center justify-center shrink-0`}>
                                    {user.photoURL ? <img src={user.photoURL} alt="Me" className="w-full h-full object-cover rounded-2xl" /> : <span className="font-black">U</span>}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        autoFocus
                                        value={newPostText}
                                        onChange={(e) => setNewPostText(e.target.value)}
                                        placeholder={postType === 'reflection' ? "What went well today?" : (imagePreview ? "Say something..." : "What's on your mind?")}
                                        className={`w-full bg-transparent border-none focus:ring-0 text-xl font-medium resize-none min-h-[120px] ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
                                    />

                                    {imagePreview && (
                                        <div className="mt-4 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                            <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-[300px]" />
                                            <button
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-lg"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className={`mb-6 p-4 rounded-2xl border-2 ${isDark ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="text-xl">⚠️</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm mb-1">Error</p>
                                            <p className="text-xs opacity-90">{error}</p>
                                        </div>
                                        <button
                                            onClick={() => setError(null)}
                                            className={`p-1 rounded-lg ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}`}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {debugInfo && (
                                        <details className="mt-3">
                                            <summary className="text-xs font-bold cursor-pointer opacity-70 hover:opacity-100">
                                                Show Debug Info
                                            </summary>
                                            <pre className={`mt-2 p-3 rounded-xl text-[10px] overflow-auto max-h-40 ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
                                                {debugInfo}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}

                            {/* Success Display */}
                            {successMessage && (
                                <div className={`mb-6 p-4 rounded-2xl border-2 ${isDark ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="text-xl">✅</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm mb-1">Success!</p>
                                            <p className="text-xs opacity-90">{successMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-6 border-t border-gray-500/10">
                                <div className="flex gap-2">
                                    <PostTypeToggle
                                        active={postType === 'text'}
                                        icon={<Sparkles className="w-5 h-5" />}
                                        color="blue"
                                        onClick={() => setPostType('text')}
                                        isDark={isDark}
                                    />
                                    <PostTypeToggle
                                        active={postType === 'reflection'}
                                        icon={<MessageSquare className="w-5 h-5" />}
                                        color="orange"
                                        onClick={() => setPostType('reflection')}
                                        isDark={isDark}
                                    />
                                    <PostTypeToggle
                                        active={postType === 'goal'}
                                        icon={<Target className="w-5 h-5" />}
                                        color="emerald"
                                        onClick={() => setPostType('goal')}
                                        isDark={isDark}
                                    />
                                    <div className="w-[1px] h-8 bg-gray-500/20 mx-2 self-center" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={imageInputRef}
                                        onChange={handleImageSelect}
                                    />
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className={`p-3 rounded-2xl transition-all shadow-sm ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={handlePost}
                                    disabled={posting || (!newPostText.trim() && !imageFile)}
                                    className={`px-8 py-4 rounded-[1.5rem] font-black tracking-tight transition-all shadow-xl active:scale-95 ${posting || (!newPostText.trim() && !imageFile) ? 'bg-gray-500 text-white opacity-20' : 'bg-blue-600 text-white shadow-blue-500/25'}`}
                                >
                                    {posting ? 'Posting...' : 'Share Nexus'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Posts Feed */}
            <main className="px-6 space-y-4">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <PostSkeleton key={i} isDark={isDark} />)}
                        </div>
                    ) : posts.length > 0 ? (
                        <>
                            {posts.map((post, index) => (
                                <div key={post.id} ref={index === posts.length - 1 ? lastPostRef : null}>
                                    <PostCard post={post} theme={theme} />
                                </div>
                            ))}
                            {loadingMore && <PostSkeleton isDark={isDark} />}
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-20 text-center space-y-4"
                        >
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto flex items-center justify-center text-3xl opacity-30">
                                {error ? '❌' : '📭'}
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {error ? 'Connection or Permission Error' : 'Silence is golden, but sharing is power'}
                            </p>
                            {error && (
                                <p className="text-[9px] text-red-500 font-bold max-w-xs mx-auto opacity-70">
                                    {error}
                                </p>
                            )}
                            <button onClick={() => setActiveFilter('all')} className="text-blue-500 font-bold text-[10px] underline uppercase tracking-widest">Back to Discovery</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!loading && !hasMore && posts.length > 0 && (
                    <div className="py-12 text-center">
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>You've reached the horizon</p>
                    </div>
                )}
            </main>
        </div>
    );
};

// UI Components for the Feed
const FilterIconTab = ({ active, icon, label, onClick, isDark }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all whitespace-nowrap font-black text-[10px] uppercase tracking-wider ${active
            ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-gray-900 shadow-md')
            : (isDark ? 'bg-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-400 hover:text-gray-600')
            }`}
    >
        {icon}
        {label}
    </button>
);

const PostTypeToggle = ({ active, icon, color, onClick, isDark }) => {
    const colorClasses = {
        orange: active ? 'bg-orange-500 text-white' : (isDark ? 'hover:bg-orange-500/10 text-orange-500/50' : 'hover:bg-orange-50 text-orange-500/50'),
        blue: active ? 'bg-blue-500 text-white' : (isDark ? 'hover:bg-blue-500/10 text-blue-500/50' : 'hover:bg-blue-50 text-blue-500/50'),
        emerald: active ? 'bg-emerald-500 text-white' : (isDark ? 'hover:bg-emerald-500/10 text-emerald-500/50' : 'hover:bg-emerald-50 text-emerald-500/50')
    };
    return (
        <button
            onClick={onClick}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${colorClasses[color]}`}
        >
            {icon}
        </button>
    );
};

const PostSkeleton = ({ isDark }) => (
    <div className={`w-full h-40 rounded-[2.5rem] animate-pulse ${isDark ? 'bg-gray-800/40' : 'bg-gray-100'}`} />
);

export default FeedView;
