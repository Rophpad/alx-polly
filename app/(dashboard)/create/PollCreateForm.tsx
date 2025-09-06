"use client";

import { useState } from "react";
import { createPoll } from "@/app/lib/actions/poll-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Poll Creation Form Component
 * 
 * Provides comprehensive poll creation interface with:
 * - Dynamic option management (add/remove options)
 * - Real-time form validation and error handling
 * - Success feedback and automatic navigation
 * - Responsive form layout with accessibility features
 * - Minimum requirements enforcement (2+ options)
 * 
 * Features:
 * - Interactive option management with add/remove buttons
 * - Form validation with user-friendly error messages
 * - Loading states during submission
 * - Success confirmation with automatic redirect
 * - Prevents removal of options below minimum threshold
 * - Clean, modern UI with shadcn/ui components
 */

export default function PollCreateForm() {
  // State management for form data and UI feedback
  const [options, setOptions] = useState(["", ""]); // Start with 2 empty options
  const [error, setError] = useState<string | null>(null); // Error message display
  const [success, setSuccess] = useState(false); // Success state for feedback

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
   * Allows users to create polls with unlimited options
   */
  const addOption = () => setOptions((opts) => [...opts, ""]);
  
  /**
   * Removes an option at the specified index
   * Prevents removal if it would leave less than 2 options (minimum requirement)
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
        // Reset UI state before submission
        setError(null);
        setSuccess(false);
        
        // Submit poll creation request
        const res = await createPoll(formData);
        
        if (res?.error) {
          // Display server-side validation errors
          setError(res.error);
        } else {
          // Show success feedback and redirect after delay
          setSuccess(true);
          setTimeout(() => {
            window.location.href = "/polls";
          }, 1200);
        }
      }}
      className="space-y-6 max-w-md mx-auto"
    >
      {/* Poll Question Input */}
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input name="question" id="question" required />
      </div>
      
      {/* Dynamic Options Management */}
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            {/* Option input field */}
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
        {/* Add new option button */}
        <Button type="button" onClick={addOption} variant="secondary">
          Add Option
        </Button>
      </div>
      
      {/* Error and Success Feedback */}
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Poll created! Redirecting...</div>}
      
      {/* Submit Button */}
      <Button type="submit">Create Poll</Button>
    </form>
  );
} 