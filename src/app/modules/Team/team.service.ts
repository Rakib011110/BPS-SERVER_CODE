// src/services/teamMember.service.ts

import TeamMemberModel, { TeamMemberType } from "./team.interface";

// Create a new team member under a fixed category
export const createTeamMember = async (data: TeamMemberType) => {
  return await TeamMemberModel.create(data);
};

// Get all team members
export const getAllTeamMembers = async () => {
  return await TeamMemberModel.find();
};

// Get team members by category
export const getTeamMembersByCategory = async (category: string) => {
  return await TeamMemberModel.find({ category });
};

// Update a team member
export const updateTeamMember = async (id: string, data: Partial<TeamMemberType>) => {
  return await TeamMemberModel.findByIdAndUpdate(id, data, { new: true });
};

// Delete a team member
export const deleteTeamMember = async (id: string) => {
  return await TeamMemberModel.findByIdAndDelete(id);
};
 
export const TeamServices = {
  createTeamMember,
    getAllTeamMembers,
    getTeamMembersByCategory,
    updateTeamMember,
    deleteTeamMember,
};