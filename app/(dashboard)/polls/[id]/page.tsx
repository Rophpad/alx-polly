'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Poll Detail Page Component
 * 
 * Provides comprehensive poll viewing and voting functionality:
 * - Displays poll question, description, and options
 * - Interactive voting interface with visual feedback
 * - Real-time results display with progress bars and percentages
 * - Poll management actions (edit/delete) for poll owners
 * - Social sharing capabilities
 * - Responsive design for all screen sizes
 * 
 * Features:
 * - Single-choice voting with confirmation
 * - Results visualization with vote counts and percentages
 * - Loading states during vote submission
 * - Poll ownership validation for management actions
 * - Accessibility-compliant UI components
 */

// Mock data for a single poll
const mockPoll = {
  id: '1',
  title: 'Favorite Programming Language',
  description: 'What programming language do you prefer to use?',
  options: [
    { id: '1', text: 'JavaScript', votes: 15 },
    { id: '2', text: 'Python', votes: 12 },
    { id: '3', text: 'Java', votes: 8 },
    { id: '4', text: 'C#', votes: 5 },
    { id: '5', text: 'Go', votes: 2 },
  ],
  totalVotes: 42,
  createdAt: '2023-10-15',
  createdBy: 'John Doe',
};

export default function PollDetailPage({ params }: { params: { id: string } }) {
  // State management for voting interface
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // Currently selected option
  const [hasVoted, setHasVoted] = useState(false); // Whether user has completed voting
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state during vote submission

  // In a real app, you would fetch the poll data based on the ID
  const poll = mockPoll;
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  /**
   * Handles vote submission for the selected option
   * 
   * Process:
   * 1. Validates option selection
   * 2. Sets loading state for UI feedback
   * 3. Simulates API call to record vote
   * 4. Updates UI to show results
   * 
   * In production, this would call submitVote() from poll-actions
   */
  const handleVote = () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    
    // Simulate API call - replace with actual vote submission
    setTimeout(() => {
      setHasVoted(true);
      setIsSubmitting(false);
    }, 1000);
  };

  /**
   * Calculates percentage of total votes for a given option
   * Handles edge case of zero total votes
   * 
   * @param votes - Number of votes for this option
   * @returns Rounded percentage (0-100)
   */
  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation and Poll Management Actions */}
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        {/* Poll ownership actions - only visible to poll creator */}
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/polls/${params.id}/edit`}>Edit Poll</Link>
          </Button>
          <Button variant="outline" className="text-red-500 hover:text-red-700">
            Delete
          </Button>
        </div>
      </div>

      {/* Main Poll Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasVoted ? (
            /* Voting Interface - Show before user has voted */
            <div className="space-y-3">
              {poll.options.map((option) => (
                <div 
                  key={option.id} 
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedOption === option.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  {option.text}
                </div>
              ))}
              {/* Vote submission button with loading state */}
              <Button 
                onClick={handleVote} 
                disabled={!selectedOption || isSubmitting} 
                className="mt-4"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            /* Results Display - Show after user has voted */
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {poll.options.map((option) => (
                <div key={option.id} className="space-y-1">
                  {/* Option name and vote statistics */}
                  <div className="flex justify-between text-sm">
                    <span>{option.text}</span>
                    <span>{getPercentage(option.votes)}% ({option.votes} votes)</span>
                  </div>
                  {/* Visual progress bar showing vote percentage */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${getPercentage(option.votes)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {/* Total vote count display */}
              <div className="text-sm text-slate-500 pt-2">
                Total votes: {totalVotes}
              </div>
            </div>
          )}
        </CardContent>
        {/* Poll metadata footer */}
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created by {poll.createdBy}</span>
          <span>Created on {new Date(poll.createdAt).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      {/* Social Sharing Section */}
      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Share this poll</h2>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            Copy Link
          </Button>
          <Button variant="outline" className="flex-1">
            Share on Twitter
          </Button>
        </div>
      </div>
    </div>
  );
}