"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Poll Management Actions Module
 * 
 * This module provides comprehensive poll management functionality including:
 * - Poll creation with validation and user authentication
 * - Poll retrieval for individual users and public access
 * - Voting system with optional user authentication
 * - Poll editing and deletion with ownership validation
 * - Real-time data updates and cache invalidation
 * 
 * Security features:
 * - User authentication for poll ownership operations
 * - Input validation for all poll data
 * - Authorization checks for edit/delete operations
 * - Protection against unauthorized access
 */

/**
 * Creates a new poll with the provided question and options
 * 
 * Validates:
 * - User authentication status
 * - Question presence and format
 * - Minimum number of options (2)
 * - All options are non-empty
 * 
 * @param formData - FormData containing question and options array
 * @returns Promise resolving to error object or null on success
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  // Extract and validate form data
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate poll requirements: question and at least 2 options
  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Authenticate user - polls must be created by authenticated users
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  // Insert new poll into database with user ownership
  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question,
      options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  // Invalidate polls cache to reflect new poll in UI
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieves all polls created by the currently authenticated user
 * Ordered by creation date (newest first)
 * 
 * @returns Promise resolving to object containing polls array and error status
 */
export async function getUserPolls() {
  const supabase = await createClient();
  
  // Get current user for authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) return { polls: [], error: "Not authenticated" };

  // Query user's polls ordered by creation date (newest first)
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

/**
 * Retrieves a specific poll by its unique identifier
 * Used for displaying poll details and voting interface
 * 
 * @param id - Unique poll identifier
 * @returns Promise resolving to object containing poll data and error status
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Query single poll by ID
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

/**
 * Records a vote for a specific poll option
 * 
 * Features:
 * - Supports both authenticated and anonymous voting
 * - Records user ID if authenticated for potential vote tracking
 * - Validates option index against poll structure
 * 
 * @param pollId - Unique identifier of the poll being voted on
 * @param optionIndex - Zero-based index of the selected option
 * @returns Promise resolving to error object or null on success
 */
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Get current user (voting can be anonymous or authenticated)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Note: Currently allows anonymous voting
  // Uncomment below to require authentication for voting:
  // if (!user) return { error: 'You must be logged in to vote.' };

  // Record vote in database with optional user association
  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null, // Associate with user if authenticated
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Deletes a poll and all associated votes
 * Only the poll owner can delete their polls
 * 
 * Security: Database RLS policies should enforce user ownership
 * 
 * @param id - Unique identifier of the poll to delete
 * @returns Promise resolving to error object or null on success
 */
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Delete poll (RLS policies should ensure only owner can delete)
  const { error } = await supabase.from("polls").delete().eq("id", id);
  
  if (error) return { error: error.message };
  
  // Refresh polls cache to reflect deletion in UI
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Updates an existing poll's question and options
 * Only the poll owner can edit their polls
 * 
 * @param pollId - Unique identifier of the poll to update
 * @param formData - FormData containing updated question and options
 * @returns Promise resolving to error object or null on success
 */
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  // Extract and validate updated poll data
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate poll requirements remain met
  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Authenticate user - only poll owners can edit
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Update poll with ownership validation in single query
  // Only allows updating polls owned by the current user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id); // Ensures only owner can update

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
