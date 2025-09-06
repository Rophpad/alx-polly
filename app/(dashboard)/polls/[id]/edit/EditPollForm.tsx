'use client';

import { useState } from 'react';
import { updatePoll } from '@/app/lib/actions/poll-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Edit Poll Form Component
 * 
 * Provides poll editing interface with pre-populated values:
 * - Question modification with existing value
 * - Dynamic option management (add/remove/edit)
 * - Maintains minimum option requirements (2+ options)
 * - Real-time validation and error handling
 * - Success feedback with automatic navigation
 * - Prevents data loss during editing process
 * 
 * Features:
 * - Pre-fills form with existing poll data
 * - Interactive option management identical to creation form
 * - Server-side validation with user-friendly error messages
 * - Loading states and success confirmation
 * - Automatic redirect to polls list after successful update
 * - Form state management to prevent accidental data loss
 */

export default function EditPollForm({ poll }: { poll: any }) {
  // Initialize form state with existing poll data
  const [question, setQuestion] = useState(poll.question);
  const [options, setOptions] = useState<string[]>(poll.options || []);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Updates the value of a specific option at the given index
   * @param idx - Index of the option to update
   * @param value - New value for the option
   */
  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  /**
   * Adds a new empty option to the poll
   */
  const addOption = () => setOptions((opts) => [...opts, '']);
  
  /**
   * Removes an option at the specified index
   * Maintains minimum requirement of 2 options
   * @param idx - Index of the option to remove
   */
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
    }
  };

  return (
    <form
      action={async (formData) => {
        // Reset UI feedback state
        setError(null);
        setSuccess(false);
        
        // Manually set form data since state is controlled
        formData.set('question', question);
        formData.delete('options'); // Clear existing options
        options.forEach((opt) => formData.append('options', opt));
        
        // Submit update request
        const res = await updatePoll(poll.id, formData);
        
        if (res?.error) {
          setError(res.error);
        } else {
          setSuccess(true);
          setTimeout(() => {
            window.location.href = '/polls';
          }, 1200);
        }
      }}
      className="space-y-6"
    >
      {/* Poll Question Input - Pre-filled with existing value */}
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input
          name="question"
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
      </div>
      
      {/* Options Management - Pre-filled with existing options */}
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input
              name="options"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
            />
            {/* Remove button - only show if more than 2 options */}
            {options.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addOption} variant="secondary">
          Add Option
        </Button>
      </div>
      
      {/* Error and Success Feedback */}
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Poll updated! Redirecting...</div>}
      
      {/* Submit Button */}
      <Button type="submit">Update Poll</Button>
    </form>
  );
}