"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNowSimple } from "@/utils/distanceToNow";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  MoreVertical, 
  Edit, 
  Trash2,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReplyForm } from "./ReplyForm";
import { CommentType, UserInfo } from "./types";
import Link from "next/link";

interface CommentItemProps {
  comment: CommentType;
  level?: number;
  currentUser: UserInfo | null;
  isAuthenticated: boolean;
  userVote?: string;
  isVoting?: boolean;
  onVote: (commentId: string, action: 'upvote' | 'downvote') => Promise<void>;
  onReply: (commentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  submitting: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  level = 0,
  currentUser,
  isAuthenticated,
  userVote,
  isVoting,
  onVote,
  onReply,
  onEdit,
  onDelete,
  submitting,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isCommentAuthor = currentUser && comment.author && comment.author._id === currentUser.id;
  console.log(isCommentAuthor,comment.author?._id, currentUser)

  // Start editing a comment
  const startEditing = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  // Start replying to a comment
  const startReplying = () => {
    setIsReplying(true);
    setReplyContent("");
  };

  // Cancel replying
  const cancelReplying = () => {
    setIsReplying(false);
    setReplyContent("");
  };

  // Handle submit reply
  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    
    await onReply(comment._id, replyContent);
    setIsReplying(false);
    setReplyContent("");
  };
  // Handle submit edit
  const handleSubmitEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      await onEdit(comment._id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit comment:", error);
      // We'll let onEdit handle the toast notifications
    }
  };
  return (
    <div className={`border-t border-gray-100 dark:border-gray-800 pt-4 ${
      level > 0 ? `ml-${Math.min(level * 4, 12)}` : ''}`}
    >
      <div className="flex space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.author?.avatar || "/default-avatar.png"} />
          <AvatarFallback>{(comment.author?.fullName || 'User').substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">            <div>
              <div className="flex items-center gap-1.5">
                <Link href={`/profile/${comment.author?._id}`} className="font-medium text-sm text-blue-500 hover:underline">
                  {comment.author?.fullName || 'Anonymous User'}
                </Link>
                {isCommentAuthor && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    You
                  </span>
                )}
              </div>
              
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNowSimple(new Date(comment.createdAt))}
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && 
                  " (edited)"
                }
              </span>
            </div>
            
            {isAuthenticated && comment.author && isCommentAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>                
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={startEditing} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="cursor-pointer text-red-500"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this comment and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(comment._id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
            {isEditing ? (
            <div className="mt-2 border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                className="min-h-[100px] mb-2 focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  onClick={cancelEditing} 
                  variant="outline" 
                  size="sm"
                  className="transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitEdit} 
                  disabled={!editContent.trim() || submitting}
                  size="sm"
                  className="transition-all duration-200"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
          )}
          
          {!isEditing && (
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-1 ${userVote === 'upvote' ? 'text-blue-500' : ''}`}
                  onClick={() => onVote(comment._id, 'upvote')}
                  disabled={!isAuthenticated || isVoting}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="ml-1">{comment.upvotes || 0}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-1 ${userVote === 'downvote' ? 'text-red-500' : ''}`}
                  onClick={() => onVote(comment._id, 'downvote')}
                  disabled={!isAuthenticated || isVoting}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="ml-1">{comment.downvotes || 0}</span>
                </Button>
              </div>
              
              {isAuthenticated && !isReplying && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1"
                  onClick={startReplying}
                >
                  <Reply className="h-4 w-4" />
                  <span className="ml-1">Reply</span>
                </Button>
              )}
            </div>
          )}
          
          {isReplying && (
            <ReplyForm
              value={replyContent}
              onChange={setReplyContent}
              onSubmit={handleSubmitReply}
              onCancel={cancelReplying}
              submitting={submitting}
            />
          )}
          
          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  level={level + 1}
                  currentUser={currentUser}
                  isAuthenticated={isAuthenticated}
                  userVote={userVote}
                  isVoting={isVoting}
                  onVote={onVote}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  submitting={submitting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
