"use client";

import { useEffect, useState } from "react";
import { getPublicProfile } from "@/utils/fetchingProfilePublic";
import { getPostsByAuthor, Post, followUser, unfollowUser, getFollowCounts, isFollowing } from "@/utils/postFetching";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Briefcase, Calendar, UserPlus, UserMinus, MessageCircle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import toast, { Toaster } from 'react-hot-toast';
import { auth0Client } from "@/lib/auth0-client";
import { sendMessage } from "@/utils/messagesApi";
import { useRouter } from "next/navigation";
import { CreditTransferButton } from "@/components/ui/credit-transfer-button";

interface AccountPublicProfile {
  _id: string;
  name?: string;
  email?: string;
  avatar?: string;
  fullName?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  joinedDate?: Date | string;
  isVerified?: boolean;
  credit?: number;
}

interface User {
  sub: string;
  email?: string;
  name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface ProfilePageClientProps {
  params: { id: string };
}

const ProfilePageClient = ({ params }: ProfilePageClientProps) => {
  const [profile, setProfile] = useState<AccountPublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followCounts, setFollowCounts] = useState({ followersCount: 0, followingCount: 0 });
  const [isUserFollowing, setIsUserFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);  
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const router = useRouter();

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session: any = await auth0Client.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Error fetching user session:", error);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        const { id } = await params;
        if (!id) {
          toast.error("Invalid profile ID");
          setLoading(false);
          return;
        }

        // Fetch profile information
        const profileData = await getPublicProfile(id);
        console.log(profileData)
        setProfile(profileData);

        // Fetch posts by this author
        const authorPosts = await getPostsByAuthor(id);
        setPosts(Array.isArray(authorPosts) ? authorPosts : []);

        // Fetch follow counts
        const counts = await getFollowCounts(id);
        setFollowCounts(counts);

        // Check if current user is following this profile (if user is logged in)
        if (user && !userLoading) {
          const followStatus = await isFollowing(id);
          setIsUserFollowing(followStatus);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPosts();
  }, [params, user, userLoading]);
  const handleFollowToggle = async () => {
    if (!user || !profile) {
      toast.error("Please log in to follow users");
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isUserFollowing) {
        await unfollowUser(profile._id);
        setIsUserFollowing(false);
        setFollowCounts(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
        toast.success("Unfollowed successfully");
      } else {
        await followUser(profile._id);
        setIsUserFollowing(true);
        setFollowCounts(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
        toast.success("Followed successfully");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    } finally {
      setIsFollowLoading(false);
    }
  };
  // Function to start a new conversation with the profile owner
  const handleStartConversation = async () => {
    if (!user || !profile) {
      toast.error("Please log in to send messages");
      return;
    }

    setIsMessageLoading(true);
    try {
      // Check if the profile ID is valid
      if (!profile._id) {
        throw new Error("Invalid profile ID");
      }
      
      console.log("Starting conversation with user:", profile._id);
      
      // Send an initial message to create the conversation
      await sendMessage(profile._id, "Hi there!");
      toast.success("Conversation started successfully");
      
      // Navigate to the messages view with the userId parameter to open this specific conversation
      router.push(`/messages?userId=${profile._id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      // Provide a more specific error message if available
      const errorMessage = error instanceof Error ? error.message : "Failed to start conversation. Please try again later.";
      toast.error(errorMessage);
    } finally {
      setIsMessageLoading(false);
    }
  };

  // Function to truncate post content for preview
  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Function to create category color based on category name
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'technology':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'lifestyle':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'science':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'health':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'business':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center space-x-4 mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        
        <Skeleton className="h-32 w-full mb-8" />
        
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Profile not found</h1>
        <p>The profile you&#39;re looking for doesn&#39;t exist or has been removed.</p>
        <Link href="/posts">
          <Button variant="secondary" className="mt-6">
            Back to Posts
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link href="/posts" className="inline-flex items-center text-primary-600 hover:text-primary-800 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Posts
      </Link>
        {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.avatar || "/default-avatar.png"} alt="Profile Avatar" />
          <AvatarFallback>{profile.fullName?.substring(0, 2) || "AU"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>              <h1 className="text-3xl font-bold mb-2 flex items-center">
                {profile.fullName || "Anonymous User"}
                {profile.isVerified && (
                  <span className="relative group">
                    <CheckCircle className="ml-2 h-5 w-5 text-blue-500" aria-label="Verified Account" />
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Verified Account
                    </span>
                  </span>
                )}
              </h1>
              
              {/* Follow counts */}
              <div className="flex gap-4 mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{followCounts.followersCount}</strong> followers
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{followCounts.followingCount}</strong> following
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{posts.length}</strong> posts
                </span>
              </div>
                <div className="flex flex-wrap gap-3 text-gray-600 dark:text-gray-400 mb-3">
                {profile.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                {profile.occupation && (
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    <span>{profile.occupation}</span>
                  </div>
                )}
                
                {profile.credit !== undefined && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 12h8"></path>
                      <path d="M12 8v8"></path>
                    </svg>
                    <span>{profile.credit} credits</span>
                  </div>
                )}
              </div>
            </div>
              {/* Profile action buttons - only show if user is logged in and viewing someone else's profile */}
            {user && !userLoading && user.sub !== profile._id && (              <div className="flex space-x-2">
                <Button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  variant={isUserFollowing ? "outline" : "default"}
                  className="min-w-24"
                >
                  {isFollowLoading ? (
                    "Loading..."
                  ) : isUserFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleStartConversation}
                  disabled={isMessageLoading}
                  variant="outline"
                  className="min-w-24"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>

                {/* Credit Transfer Button */}
                <CreditTransferButton 
                  recipientId={profile._id}
                  recipientName={profile.fullName || profile.email || 'this user'}
                />
              </div>
            )}
          </div>
          
          {profile.joinedDate && (
            <div className="text-sm text-gray-500 dark:text-gray-500 flex items-center mt-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Joined {format(new Date(profile.joinedDate), "MMMM yyyy")}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Bio */}
      {profile.bio && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3">About</h2>
          <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
        </div>
      )}
      
      <Separator className="my-8" />
      
      {/* User's Posts */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Posts by {profile.fullName || "this user"}</h2>
        
        {posts.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {posts.map((post) => (
              <Card key={post._id} className="overflow-hidden transition-all hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary-900/5">
                <CardHeader>
                  <CardTitle>
                    <Link href={`/posts/${post._id}`} className="hover:text-primary-600 transition-colors">
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>
                      Posted on {post.createdAt ? format(new Date(post.createdAt), 'MMMM dd, yyyy') : "Unknown date"}
                    </span>
                    <Badge variant="outline" className={getCategoryColor(post.category)}>
                      {post.category || "General"}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">
                    {post.summary ? post.summary : truncateContent(post.content)}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{post.likes || 0} likes</span>
                    <span>•</span>
                    <span>{post.comments?.length || 0} comments</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/posts/${post._id}`}>
                      Read More
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Toaster />
    </div>
  );
};

export default ProfilePageClient;
