"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";

/**
 * Poll Actions Component
 * 
 * Displays individual poll cards with interactive capabilities:
 * - Poll preview with question and option count
 * - Click-through navigation to full poll view
 * - Owner-only management actions (edit/delete)
 * - Responsive card design with hover effects
 * - Confirmation dialogs for destructive actions
 * 
 * Security features:
 * - User authentication checks for action visibility
 * - Poll ownership validation before showing management options
 * - Confirmation prompts for delete operations
 * - Automatic page refresh after deletions
 */

// Type definitions for poll data structure
interface Poll {
  id: string;
  question: string;
  options: any[]; // Array of poll options
  user_id: string; // Owner's user ID for permission checks
}

interface PollActionsProps {
  poll: Poll;
}

/**
 * Renders a poll card with management actions for authenticated users
 * 
 * @param poll - Poll object containing id, question, options, and ownership info
 */
export default function PollActions({ poll }: PollActionsProps) {
  const { user } = useAuth(); // Get current authenticated user
  
  /**
   * Handles poll deletion with user confirmation
   * 
   * Security measures:
   * - Confirms user intent with native confirmation dialog
   * - Calls server-side delete action (which validates ownership)
   * - Refreshes page to reflect changes in UI
   * 
   * Note: In production, consider using optimistic updates
   * and proper error handling instead of window.location.reload()
   */
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this poll?")) {
      await deletePoll(poll.id);
      window.location.reload(); // Refresh to show updated poll list
    }
  };

  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      {/* Clickable poll preview area */}
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              {/* Poll question with hover effect */}
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.question}
              </h2>
              {/* Option count display */}
              <p className="text-slate-500">{poll.options.length} options</p>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Management actions - only visible to poll owner */}
      {user && user.id === poll.user_id && (
        <div className="flex gap-2 p-2">
          {/* Edit button */}
          <Button asChild variant="outline" size="sm">
            <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
          </Button>
          {/* Delete button with destructive styling */}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
